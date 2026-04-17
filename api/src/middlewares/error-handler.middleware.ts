import { Request, Response } from "express";
import { MulterError } from "multer";
import { ErrorBase } from "../errors/error-base.error";
import { BadRequestError } from "../errors/bad-request.error";

export function errorHandler(err: Error, req: Request, res: Response, next: Function) {
    if (err instanceof ErrorBase) {
        err.sendResponse(req, res);
    } else if (err instanceof MulterError) {
        new BadRequestError({ message: err.message, errors: err.field ? { field: err.field } : undefined }).sendResponse(req, res);
    } else {
        console.error(err);
        new ErrorBase().sendResponse(req, res);
    }
}
