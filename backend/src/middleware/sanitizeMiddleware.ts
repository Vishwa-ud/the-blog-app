import { Request,Response, NextFunction } from "express";
import { sanitizeInput } from "../utils/sanitize";

export function sanitizeMiddleware(req:Request,res:Response,next:NextFunction):void{
    if(req.body){
        for(const key in req.body){
            if(typeof req.body[key]==="string"){
                req.body[key] = sanitizeInput(req.body[key]) as string;
            }
        }
    }

    next();
}