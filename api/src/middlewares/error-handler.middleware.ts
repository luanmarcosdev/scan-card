import { Request, Response } from "express";
import { ErrorBase } from "../errors/error-base.error";

export function errorHandler(err: Error, req: Request, res: Response, next: Function) {
    if (err instanceof ErrorBase) {
        err.sendResponse(req, res);
    } else {
        console.error(err);
        new ErrorBase().sendResponse(req, res); 
    }
}
