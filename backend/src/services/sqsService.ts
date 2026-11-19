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

export type OrderSQSEventType = 'ORDER_CREATED' | 'ORDER_STATUS_UPDATED';

export async function sendOrderEventToSQS(
  orderData: Record<string, any>,
  eventType: OrderSQSEventType = 'ORDER_CREATED'
): Promise<boolean> {
  const orderId = orderData.orderId || orderData.id || 'unknown';
  const payload = {
    ...orderData,
    eventType: orderData.eventType || eventType,
  };

  if (process.env.LOCAL_SIMULATION === 'true' || !config.aws.sqsOrderQueueUrl) {
    console.log(`[LOCAL MOCK SQS] Đã đẩy event ${payload.eventType} vào hàng đợi giả lập: ${orderId}`);
    return true;
  }

  try {
    const client = getSQSClient();
    const command = new SendMessageCommand({
      QueueUrl: config.aws.sqsOrderQueueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: payload.eventType,
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
