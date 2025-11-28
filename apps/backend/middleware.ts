import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const authMiddleware = (req:Request,res:Response,next:NextFunction)=>{
    const header = req.headers.authorization;
    const token = header?.split(" ")?.[1];

    if(!token){
        res.status(403).json({
            message : "missing token"
        })
    }
    const {userId} = jwt.verify(token,process.env.JWT_SECRET) 
}