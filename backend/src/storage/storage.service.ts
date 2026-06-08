import { Injectable, Logger } from '@nestjs/common';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly log = new Logger(StorageService.name);
  private readonly ensuredBuckets = new Set<string>();
  private readonly publicReadBuckets = new Set<string>();

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
    const base = process.env.MINIO_PUBLIC_URL?.trim();
    if (!base) {
      return `/${bucket}/${key}`;
    }
    return `${base.replace(/\/$/, '')}/${bucket}/${key}`;
  }

  async ensureBucket(bucket: string): Promise<void> {
    if (this.ensuredBuckets.has(bucket)) return;
    const client = this.client();
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'name' in err
          ? String((err as { name?: string }).name)
          : '';
      const status =
        err && typeof err === 'object' && '$metadata' in err
          ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode
          : undefined;
      if (code !== 'NotFound' && code !== 'NoSuchBucket' && status !== 404) {
        throw err;
      }
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      this.log.log(`Created MinIO bucket: ${bucket}`);
    }
    this.ensuredBuckets.add(bucket);
  }

  async ensurePublicRead(bucket: string): Promise<void> {
    await this.ensureBucket(bucket);
    if (this.publicReadBuckets.has(bucket)) return;

    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    });

    try {
      await this.client().send(
        new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }),
      );
      this.publicReadBuckets.add(bucket);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(`Public read policy for ${bucket}: ${message}`);
    }
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.ensureBucket(bucket);
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

  ticketsBucket() {
    return process.env.MINIO_TICKETS_BUCKET ?? 'coop-tickets';
  }

  receiptsBucket() {
    return process.env.MINIO_RECEIPTS_BUCKET ?? 'coop-receipts';
  }
}
