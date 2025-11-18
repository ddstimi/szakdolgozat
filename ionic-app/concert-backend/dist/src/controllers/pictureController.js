"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileDirect = void 0;
const s3_1 = require("../storage/s3");
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = __importDefault(require("crypto"));
const bucket = process.env.S3_BUCKET;
const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
const uploadProfileDirect = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
        if (!allowed.has(file.mimetype)) {
            res.status(400).json({ message: 'Invalid content type' });
            return;
        }
        const extFromName = path_1.default.extname(file.originalname).toLowerCase();
        const ext = extFromName ||
            (file.mimetype === 'image/png'
                ? '.png'
                : file.mimetype === 'image/webp'
                    ? '.webp'
                    : '.jpg');
        const key = `profile-pictures/${userId}/${crypto_1.default.randomUUID()}${ext}`;
        await s3_1.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        const publicUrl = `${cdnBase}/${key}`;
        res.status(200).json({ key, publicUrl });
    }
    catch (err) {
        console.error('uploadProfileDirect error:', err);
        res.status(500).json({ message: 'Upload failed' });
    }
};
exports.uploadProfileDirect = uploadProfileDirect;
