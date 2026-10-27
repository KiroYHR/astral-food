import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { config } from '../config/index.js';

function getS3Client(): S3Client {
  const credentials =
    config.aws.accessKeyId && config.aws.secretAccessKey
      ? {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        }
      : undefined;

  return new S3Client({
    region: config.aws.region,
    credentials,
  });
}

export async function generatePresignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; fileKey: string; finalS3Url: string }> {
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  const fileKey = `products/${crypto.randomUUID()}.${ext}`;

  try {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: config.aws.s3BucketMedia,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: config.aws.s3PresignedExpires,
    });

    const finalS3Url = `https://${config.aws.s3BucketMedia}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;

    return { uploadUrl, fileKey, finalS3Url };
  } catch (error) {
    // Fallback giả lập cho môi trường Local khi chưa cấu hình AWS
    const mockKey = `mock/${crypto.randomUUID()}_${fileName}`;
    return {
      uploadUrl: `http://localhost:${config.port}/api/v1/media/mock-upload/${mockKey}`,
      fileKey: mockKey,
      finalS3Url: `https://placehold.co/600x400?text=${encodeURIComponent(fileName)}`,
    };
  }
}
