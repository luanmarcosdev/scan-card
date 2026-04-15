import { ErrorBase } from "./error-base.error";

export class ConflictError extends ErrorBase {
    constructor({ message, status = 409}: { message: string; status?: number;}) {
        super(message, status);
    }
}