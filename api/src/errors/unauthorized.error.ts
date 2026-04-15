import { ErrorBase } from "./error-base.error";

export class UnauthorizedError extends ErrorBase {
    constructor({ message = "Unauthorized" }: { message?: string } = {}) {
        super(message, 401);
    }
}
