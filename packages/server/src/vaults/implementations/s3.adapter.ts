import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  type S3ServiceException,
} from '@aws-sdk/client-s3';
import { VaultAdapter } from '@vaults/base';
import type { VaultAdapterField } from '@vaults/base';

export type S3Connection = {
  endpoint: string;
  bucket: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean | string;
};

export class S3VaultAdapter extends VaultAdapter {
  readonly vaultAdapterId = 's3';
  readonly name = 'S3 Compatible';
  readonly fields: VaultAdapterField[] = [
    {
      key: 'endpoint',
      label: 'Endpoint URL',
      type: 'text',
      required: true,
    },
    {
      key: 'bucket',
      label: 'Bucket',
      type: 'text',
      required: true,
    },
    {
      key: 'region',
      label: 'Region',
      type: 'text',
      required: false,
      default: 'us-east-1',
    },
    {
      key: 'accessKeyId',
      label: 'Access Key ID',
      type: 'text',
      required: true,
      secure: true,
    },
    {
      key: 'secretAccessKey',
      label: 'Secret Access Key',
      type: 'text',
      required: true,
      secure: true,
    },
    {
      key: 'forcePathStyle',
      label: 'Force Path Style',
      type: 'text',
      required: false,
      default: 'true',
    },
  ];

  private buildClient(conn: S3Connection): S3Client {
    return new S3Client({
      endpoint: conn.endpoint,
      region: conn.region || 'us-east-1',
      credentials: {
        accessKeyId: conn.accessKeyId,
        secretAccessKey: conn.secretAccessKey,
      },
      forcePathStyle:
        conn.forcePathStyle !== false && conn.forcePathStyle !== 'false',
    });
  }

  async upload(
    connection: unknown,
    key: string,
    data: Buffer,
    mimeType: string,
  ): Promise<void> {
    const conn = connection as S3Connection;
    const client = this.buildClient(conn);
    await client.send(
      new PutObjectCommand({
        Bucket: conn.bucket,
        Key: key,
        Body: data,
        ContentType: mimeType,
      }),
    );
  }

  async download(connection: unknown, key: string): Promise<Buffer> {
    const conn = connection as S3Connection;
    const client = this.buildClient(conn);
    const response = await client.send(
      new GetObjectCommand({ Bucket: conn.bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error('vault_download_failed');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(connection: unknown, key: string): Promise<void> {
    const conn = connection as S3Connection;
    const client = this.buildClient(conn);
    await client.send(
      new DeleteObjectCommand({ Bucket: conn.bucket, Key: key }),
    );
  }

  async ensureBucket(connection: unknown): Promise<void> {
    const conn = connection as S3Connection;
    const client = this.buildClient(conn);
    try {
      await client.send(new HeadBucketCommand({ Bucket: conn.bucket }));
      return;
    } catch (error: unknown) {
      const statusCode = (error as S3ServiceException).$metadata
        ?.httpStatusCode;
      if (statusCode !== 404 && statusCode !== undefined) throw error;
    }
    try {
      await client.send(new CreateBucketCommand({ Bucket: conn.bucket }));
    } catch (error: unknown) {
      const statusCode = (error as S3ServiceException).$metadata
        ?.httpStatusCode;
      // 409 = bucket already exists, treat as success
      // Also ignore deserialization errors (some S3-compatible servers
      // return non-XML responses) as long as the bucket was created
      if (statusCode === 409) return;
      if (statusCode === 200) return;
      throw error;
    }
  }

  async exists(connection: unknown, key: string): Promise<boolean> {
    const conn = connection as S3Connection;
    const client = this.buildClient(conn);
    try {
      await client.send(
        new HeadObjectCommand({ Bucket: conn.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
