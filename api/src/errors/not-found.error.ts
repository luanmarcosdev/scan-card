import { ErrorBase } from "./error-base.error";

export class NotFoundError extends ErrorBase {
    constructor({ message, status = 404}: { message: string; status?: number;}) {
        super(message, status);
    }
}