import multer, { MulterError } from "multer";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../errors/bad-request.error";
import { UploadError } from "../errors/upload.error";

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

const MAX_FILES = 8;
const MAX_FILE_SIZE_MB = 3;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();

        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(new BadRequestError({
                message: 'Invalid file type',
                errors: { allowed: `only ${ALLOWED_EXTENSIONS.join(', ')} are accepted` },
            }));
        }

        cb(null, true);
    },
});

export function handleUploadErrors(err: any, _req: Request, _res: Response, next: NextFunction) {
    if (!(err instanceof MulterError)) {
        return next(err);
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new UploadError('File too large', { max_size: `${MAX_FILE_SIZE_MB}MB` }));
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new UploadError('Too many files', { max_files: String(MAX_FILES) }));
    }

    next(new UploadError(err.message));
}
