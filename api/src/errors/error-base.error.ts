import { ValidationError } from "class-validator";
import { Request, Response } from "express";

export class ErrorBase extends Error {

    readonly status: number;
    readonly message: string;
    readonly errors?: ValidationError[] | Record<string, string>;

     constructor(message: string = "Internal Server Error", status: number = 500, errors?: ValidationError[] | Record<string, string>) {
        super(message);
        this.message = message;
        this.status = status;
        this.errors = errors;
    }

    sendResponse(req: Request, res: Response) {

        res.status(this.status).json({
            status: this.status,
            message: this.message,
            method: req.method,
            path: req.originalUrl,
            errors_detail: this.errors || null
        });
    }
}