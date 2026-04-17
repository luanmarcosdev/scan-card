import multer from "multer";
import { BadRequestError } from "../errors/bad-request.error";

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export const upload = multer({
    storage: multer.memoryStorage(),
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
