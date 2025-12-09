import {prismaClient} from "db/client"
import { authMiddleware, courseAccessMiddleware } from '../middleware';
import jwt from 'jsonwebtoken';
import {SignupSchema} from "common/inputs"
import { Router } from "express";
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
    },process.env.JWT_SECRET as string)
    res.json({ token });
})
router.get("/calendar/:courseId", authMiddleware, courseAccessMiddleware, async (req, res) => {
    res.json({
        calendarId: req.course!.calendarNotionId,
        id: req.course!.id
    })
})


router.get("/courses", authMiddleware, async(req, res) => {
    const courses = await prismaClient.course.findMany({
        where: {
            purchase: {
                some: {
                    userId: req.userId
                }
            }
        }
    });

    res.json({
        courses: courses.map(c => ({
            id: c.id,
            title: c.title,
            slug: c.slug
        }))
    })
})