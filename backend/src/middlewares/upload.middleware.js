import multer from "multer";
import ApiError from "../utils/ApiError.js";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const WRONG_TYPE = "Only images (JPEG, PNG, WebP) and PDF files are allowed";
const TOO_LARGE = "The file must be 2 MB or smaller";

// files are held in memory and passed on to the file store; nothing is written to disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ApiError(400, WRONG_TYPE));
        }
    },
});

// Reads a form that may carry one file in the given field. The file is optional;
// a file of the wrong kind or size is refused with a message for the user.
const acceptFile = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
        if (!error) return next();

        if (error instanceof ApiError) return next(error);

        if (error.code === 'LIMIT_FILE_SIZE') return next(new ApiError(400, TOO_LARGE));

        next(new ApiError(400, "The file could not be read"));
    });
};

export { acceptFile }
