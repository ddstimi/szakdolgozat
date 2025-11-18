"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = void 0;
exports.presignProfileUpload = presignProfileUpload;
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const region = process.env.S3_REGION;
const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;
const forcePathStyle = /^true$/i.test(process.env.S3_FORCE_PATH_STYLE || '');
const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
exports.s3 = new client_s3_1.S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
});
function extFor(mime) {
    if (mime === 'image/png')
        return '.png';
    if (mime === 'image/webp')
        return '.webp';
    return '.jpg';
}
async function presignProfileUpload(params) {
    if (!ALLOWED.has(params.contentType)) {
        throw new Error('Unsupported content type');
    }
    const expiresIn = params.expiresInSec ?? 900;
    const key = `profile-pictures/${params.userId}/${crypto_1.default.randomUUID()}${extFor(params.contentType)}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: params.contentType,
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(exports.s3, command, { expiresIn });
    const publicUrl = `${cdnBase}/${key}`; // via CDN/website bucket
    return { key, uploadUrl, publicUrl, expiresIn };
}
