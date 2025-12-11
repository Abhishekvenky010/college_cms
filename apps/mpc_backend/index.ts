import express from "express";
import {prismaClient} from "mpc-db/client"
import { PublicKey, TSSCli } from 'solana-mpc-tss-lib/mpc';
import {NETWORK} from 'common/solana'
const cli = new TSSCli();
const app = express();
app.post("/create-user",async(req,res)=>{
    const {userid} = req.body;
    const participant = await cli.generate()
    prismaClient.keyshare.create({
        data:{
            userid,
            publicKey:participant.publicKey,
            secretKey:participant.secretKey
        }
    })
    res.json({
        publicKey : participant.publicKey
    })
})
app.post("/send/step-1", async (req, res) => {
    const {to, amount, userId, recentBlockhash} = req.body;
    console.log(req.body);
    console.log(userId);
    const user = await prismaClient.keyshare.findFirst({
        where: userId
    })
    if (!user) {
        res.status(403).json({
            message: "User not found"
        })
        return
    }

    const response = await cli.aggregateSignStepOne(
        user.secretKey,
        to,
        amount,
        undefined, // Optional memo
        recentBlockhash
    );

    res.json({
        response
    })
})
app.post("/send/step-2",async(req,res)=>{
    const {to, amount, userId, recentBlockhash,step1Responses,allPublicNonces} = req.body;
     const user = await prismaClient.keyshare.findFirst({
        where: userId
    })
    if (!user) {
        res.status(403).json({
            message: "User not found"
        })
        return
    }
    const response = await cli.aggregateSignStepTwo(
        step1Responses,
        user.secretKey,
        to,
        amount,
        allPublicNonces,
        undefined,
        recentBlockhash
    );
    res.json({
        response,
        publicKey:user.publicKey
    })
})
app.listen(3001);