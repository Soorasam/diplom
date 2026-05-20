import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private client(): S3Client {
    return new S3Client({
      endpoint: process.env.MINIO_ENDPOINT ?? 'http://127.0.0.1:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  publicUrl(bucket: string, key: string): string {
    const base = (process.env.MINIO_PUBLIC_URL ?? 'http://127.0.0.1:9000').replace(/\/$/, '');
    return `${base}/${bucket}/${key}`;
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return this.publicUrl(bucket, key);
  }

  productsBucket() {
    return process.env.MINIO_BUCKET ?? 'coop-products';
  }

  driverDocsBucket() {
    return process.env.MINIO_DRIVER_BUCKET ?? 'coop-driver-docs';
  }
}
