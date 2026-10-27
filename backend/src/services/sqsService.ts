import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config/index.js';

function getSQSClient(): SQSClient {
  const credentials =
    config.aws.accessKeyId && config.aws.secretAccessKey
      ? {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        }
      : undefined;

  return new SQSClient({
    region: config.aws.region,
    credentials,
  });
}

export async function sendOrderEventToSQS(orderData: Record<string, any>): Promise<boolean> {
  if (!config.aws.sqsOrderQueueUrl) {
    console.log(`[LOCAL MOCK SQS] Đã đẩy event đơn hàng vào hàng đợi giả lập: ${orderData.id}`);
    return true;
  }

  try {
    const client = getSQSClient();
    const command = new SendMessageCommand({
      QueueUrl: config.aws.sqsOrderQueueUrl,
      MessageBody: JSON.stringify(orderData),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: 'ORDER_CREATED',
        },
      },
    });

    const response = await client.send(command);
    return Boolean(response.MessageId);
  } catch (error) {
    console.error('[SQS ERROR] Lỗi khi gửi message lên AWS SQS:', error);
    return false;
  }
}
