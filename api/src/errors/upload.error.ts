import { ErrorBase } from './error-base.error';

export class UploadError extends ErrorBase {
    constructor(message: string, errors?: Record<string, string>) {
        super(message, 400, errors);
    }
}
