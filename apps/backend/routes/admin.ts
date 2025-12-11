import {prismaClient} from "db/client";
import { TSSCli } from 'solana-mpc-tss-lib/mpc';
import { adminauthMiddleware, courseAccessMiddleware } from '../middleware';
import jwt from 'jsonwebtoken';
import {sendSchema, SignupSchema, UserCreateSchema} from "common/inputs"
import { response, Router } from "express";
import axios from "axios";
import {NETWORK} from "common/solana"
export const MPC_SERVERS = [
    "http://localhost:3001",
    "http://localhost:3002",
    // "http://localhost:3003",
];
export const MPC_THRESHOLD = Math.max(1, MPC_SERVERS.length - 1);

export const cli = new TSSCli(NETWORK);
const router = Router();

export default router;
router.post("/signin",async (req,res)=>{
    const {success,data} = SignupSchema.safeParse(req.body);
    if(!success){
        res.status(403).json({
            message:"incorrect credentials"
        })
        return
    }
    const email = data.email;
    const password = data.password;

    const user = await prismaClient.user.findFirst({
        where:{
            email
        }
    });
    if(!user){
        res.status(403).json({
            message : "user not found"
        })
        return;
    }
    if(user.password !== password){
           res.status(403).json({
            message:"incorrect credentials"
        })
        return
    }
    const token = jwt.sign({
        userId : user.id
    },process.env.ADMIN_JWT_SECRET as string)
    res.json({ token });
})
router.post("/create_user",adminauthMiddleware,async (req,res)=>{
    const {success,data} = UserCreateSchema.safeParse(req.body);
    if(!success){
        res.status(403).json({
            message : "invalid input data"
        })
        return;
    }
    const {email,password,phone} = data;
    const user = await prismaClient.user.create({
        data:{
            email : data.email,
            password : data.password,
            phone : data.phone,
            role : "USER"
        }
    })
       const responses = await Promise.all(MPC_SERVERS.map(async (server) => {
        const response = await axios.post(`${server}/create-user`, {
            userId: user.id
        })
        return response.data;
    }))
    console.log(responses);
  const aggregatedPublicKey = cli.aggregateKeys(responses.map(r=>r.publicKey),MPC_THRESHOLD);
  console.log(aggregatedPublicKey);
  await prismaClient.user.update({
    where:{id:user.id},
    data:{
        publicKey:aggregatedPublicKey.aggregatedPublicKey
    }
  })   
  await cli.airdrop(aggregatedPublicKey.aggregatedPublicKey,1000000000);
  res.json({
    message : "user created",
    user
  })
})
router.post("/send",adminauthMiddleware,async(req,res)=>{
    const {success,data} = sendSchema.safeParse(req.body);
    const blockhash = await cli.recentBlockHash();
    if(!success){
        res.status(403).json({
            message : "incorrect creds"
        })
        return;
    } 
        const user = await prismaClient.user.findFirst({
        where: {id: req.userId}
    });

    if (!user) {
        res.status(403).json({
            message: "User not found"
        })
        return;
    }

    const step1Responses = await Promise.all(MPC_SERVERS.map(async (server)=>{
        const response = await axios.post(`${server}/send/step1`,{
            to : data.to,
            amount : data.amount,
            userId : req.userId,
            recentBlockhash : blockhash
        })
        return response.data;
    }))
      const step2Responses = await Promise.all(MPC_SERVERS.map(async (server,index)=>{
        const response = await axios.post(`${server}/send/step1`,{
            to : data.to,
            amount : data.amount,
            userId : req.userId,
            recentBlockhash : blockhash,
            step1Responses:step1Responses[index],
            allPublicNonces:step1Responses.map((r)=>r.response.publicNonce)
        })
        return response.data;
    }))
   const partialSignatures = step2Responses.map((r)=>r.response);
   const transactionDetails = {
        amount: data.amount,
        to: data.to,
        from: user.publicKey,
        network: NETWORK,
        memo: undefined,
        recentBlockhash: blockhash
      };
            const signature = await cli.aggregateSignaturesAndBroadcast(
        JSON.stringify(partialSignatures),
        JSON.stringify(transactionDetails),
        JSON.stringify({
            aggregatedPublicKey: user.publicKey,
            participantKeys: step2Responses.map((r) => r.publicKey),
            threshold: MPC_THRESHOLD
        })
      );

      res.json({
        signature
      })   
})