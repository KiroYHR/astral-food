import {
  SESClient,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
} from '@aws-sdk/client-ses';
import { config } from '../config/index.js';

export type SesVerificationStatus = 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | 'SIMULATED' | 'FAILED';

export interface SesVerificationResult {
  email: string;
  status: SesVerificationStatus;
  sent: boolean;
  verified: boolean;
  message: string;
}

function getSESClient(): SESClient {
  const credentials =
    config.aws.accessKeyId && config.aws.secretAccessKey
      ? {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        }
      : undefined;

  return new SESClient({
    region: config.aws.region,
    credentials,
  });
}

/**
 * Kiểm tra trạng thái xác thực email trên AWS SES (Sandbox/Identity).
 * Không bao giờ throw lỗi để tránh ảnh hưởng luồng xác thực người dùng.
 */
export async function getSesEmailVerificationStatus(email: string): Promise<SesVerificationResult> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (process.env.LOCAL_SIMULATION === 'true') {
    return {
      email: normalizedEmail,
      status: 'SIMULATED',
      sent: false,
      verified: true,
      message: 'Chế độ giả lập cục bộ (LOCAL_SIMULATION).',
    };
  }

  try {
    const client = getSESClient();
    const response = await client.send(
      new GetIdentityVerificationAttributesCommand({
        Identities: [normalizedEmail],
      })
    );

    const verificationStatus = response.VerificationAttributes?.[normalizedEmail]?.VerificationStatus;

    if (verificationStatus === 'Success') {
      return {
        email: normalizedEmail,
        status: 'VERIFIED',
        sent: false,
        verified: true,
        message: 'Email đã được xác thực trên AWS SES.',
      };
    }

    if (verificationStatus === 'Pending') {
      return {
        email: normalizedEmail,
        status: 'PENDING',
        sent: false,
        verified: false,
        message:
          'Email đang chờ xác thực. Vui lòng kiểm tra hộp thư (kể cả Spam) và bấm link xác nhận từ AWS.',
      };
    }

    return {
      email: normalizedEmail,
      status: 'UNVERIFIED',
      sent: false,
      verified: false,
      message: 'Email chưa được xác thực trên AWS SES.',
    };
  } catch (error) {
    console.error('[SES ERROR] Lỗi khi kiểm tra trạng thái xác thực AWS SES:', error);
    return {
      email: normalizedEmail,
      status: 'FAILED',
      sent: false,
      verified: false,
      message: 'Không thể kiểm tra trạng thái xác thực email trên AWS SES.',
    };
  }
}

/**
 * Gửi yêu cầu xác thực email lên AWS SES (tự động bỏ qua nếu email đã VERIFIED).
 * Không bao giờ throw lỗi để không làm hỏng bước đăng ký tài khoản.
 */
export async function requestSesEmailVerification(email: string): Promise<SesVerificationResult> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (process.env.LOCAL_SIMULATION === 'true') {
    return {
      email: normalizedEmail,
      status: 'SIMULATED',
      sent: false,
      verified: true,
      message: 'Chế độ giả lập cục bộ (LOCAL_SIMULATION).',
    };
  }

  try {
    const current = await getSesEmailVerificationStatus(normalizedEmail);
    if (current.status === 'VERIFIED') {
      return current;
    }

    const client = getSESClient();
    await client.send(
      new VerifyEmailIdentityCommand({
        EmailAddress: normalizedEmail,
      })
    );

    return {
      email: normalizedEmail,
      status: 'PENDING',
      sent: true,
      verified: false,
      message:
        'AWS SES đã gửi email xác thực đến hộp thư của bạn. Vui lòng mở email và bấm đường link xác nhận để nhận thông báo đơn hàng.',
    };
  } catch (error) {
    console.error('[SES ERROR] Lỗi khi gửi yêu cầu xác thực AWS SES:', error);
    return {
      email: normalizedEmail,
      status: 'FAILED',
      sent: false,
      verified: false,
      message:
        'Đăng ký thành công nhưng chưa thể gửi email xác thực AWS SES. Bạn có thể bấm gửi lại sau.',
    };
  }
}
