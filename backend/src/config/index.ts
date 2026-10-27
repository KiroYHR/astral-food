import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketMedia: process.env.S3_BUCKET_MEDIA || 'cloudbite-media',
    s3PresignedExpires: parseInt(process.env.S3_PRESIGNED_EXPIRES || '300', 10),
    sqsOrderQueueUrl: process.env.SQS_ORDER_QUEUE_URL || '',
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
};
