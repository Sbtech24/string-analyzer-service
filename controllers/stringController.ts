import { Request, Response, NextFunction } from "express";
import {hashString,computeStringProperties} from "../utils/stringUtils";


export async function createString(req:Request,res:Response,next:NextFunction){

    const {value} = req.body
    const date = new Date()
    try{
        res.status(201).json({
            id:hashString(value),
            value,
            properties: computeStringProperties(value),
            created_at: date.toISOString()
           
        })

    }catch(error){
        // res.status(erro)
        next(error)
    }

}


