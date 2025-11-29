import { RequestHandler } from 'express';
import { s3 } from '../storage/s3';
import path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const bucket = process.env.S3_BUCKET!;
const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');

export const uploadProfileDirect: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      res.status(400).json({ message: 'Invalid content type' });
      return;
    }

    const extFromName = path.extname(file.originalname).toLowerCase();
    const ext =
      extFromName ||
      (file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/webp'
        ? '.webp'
        : '.jpg');

    const key = `profile-pictures/${userId}/${crypto.randomUUID()}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const publicUrl = `${cdnBase}/${key}`;
    res.status(200).json({ key, publicUrl });
  } catch (err) {
    console.error('uploadProfileDirect error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
};
