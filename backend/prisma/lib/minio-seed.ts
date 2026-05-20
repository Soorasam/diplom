import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const BUCKET = process.env.MINIO_BUCKET ?? 'coop-products';

const client = () =>
  new S3Client({
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://127.0.0.1:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    },
    forcePathStyle: true,
  });

export function publicObjectUrl(key: string): string {
  const base = (process.env.MINIO_PUBLIC_URL ?? 'http://127.0.0.1:9000').replace(/\/$/, '');
  return `${base}/${BUCKET}/${key}`;
}

export async function uploadProductImage(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicObjectUrl(key);
}

/** Локальные файлы из prisma/seed-assets/products/ */
export async function uploadFromAsset(fileName: string, objectKey: string): Promise<string> {
  const filePath = path.join(__dirname, '..', 'seed-assets', 'products', fileName);
  const body = await readFile(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return uploadProductImage(objectKey, body, contentType);
}

export type SeedProductImage = {
  objectKey: string;
  assetFile: string;
};

export const SEED_PRODUCT_IMAGES: SeedProductImage[] = [
  { objectKey: 'grechka.png', assetFile: 'grechka.png' },
  { objectKey: 'condensed-milk.png', assetFile: 'condensed-milk.png' },
  { objectKey: 'laundry-powder.png', assetFile: 'laundry-powder.png' },
  { objectKey: 'paracetamol.png', assetFile: 'paracetamol.png' },
  { objectKey: 'sealant.png', assetFile: 'sealant.png' },
];
