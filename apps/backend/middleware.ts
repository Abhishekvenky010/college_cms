import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prismaClient } from "db/client";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.split(" ")?.[1];

    if (!token) {
        return res.status(403).json({
            messsage: "Missing token"
        })
    }

    try {
        const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        if (userId) {
            req.userId = userId;
        }
        next()
    } catch(e) {
        return res.status(403).json({
            messsage: "Token malformed"
        })
    }

}
export const adminauthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.split(" ")?.[1];

    if (!token) {
        return res.status(403).json({
            messsage: "Missing token"
        })
    }

    try {
        const { userId } = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as JwtPayload;
        if (userId) {
            req.userId = userId;
        }
        next()
    } catch(e) {
        return res.status(403).json({
            messsage: "Token malformed"
        })
    }

}

export const courseAccessMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.courseId;
    const course = await prismaClient.course.findFirst({
        where: {
            id: courseId
        }
    });
    if (!course) {
        return res.status(411).json({
            message: "course with id not found"
        });
    }
    const purchase = await prismaClient.purchases.findFirst({
        where: {
            userId: req.userId,
            courseId: courseId
        }
    });
    if (!purchase) {
        return res.status(411).json({
            message: "you dont have access to this course"
        });
    }
    req.course = course;
    next();
};