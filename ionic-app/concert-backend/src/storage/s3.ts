import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.S3_REGION!;
const bucket = process.env.S3_BUCKET!;
const endpoint = process.env.S3_ENDPOINT;
const forcePathStyle = /^true$/i.test(process.env.S3_FORCE_PATH_STYLE || '');
const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');

export type AllowedImageType = 'image/jpeg' | 'image/png' | 'image/webp';
const ALLOWED: Set<string> = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const s3 = new S3Client({
  region,
  endpoint: endpoint || undefined,
  forcePathStyle,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

function extFor(mime: AllowedImageType): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

export async function presignProfileUpload(params: {
  userId: number;
  contentType: AllowedImageType;
  expiresInSec?: number;
}) {
  if (!ALLOWED.has(params.contentType)) {
    throw new Error('Unsupported content type');
  }
  const expiresIn = params.expiresInSec ?? 900;
  const key = `profile-pictures/${params.userId}/${crypto.randomUUID()}${extFor(
    params.contentType
  )}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
  const publicUrl = `${cdnBase}/${key}`; // via CDN/website bucket

  return { key, uploadUrl, publicUrl, expiresIn };
}
