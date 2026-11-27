import {
  SESClient,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  SendEmailCommand,
} from '@aws-sdk/client-ses';
import { config } from '../config/index.js';

export type SesVerificationStatus = 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | 'SIMULATED' | 'FAILED';

export interface SesVerificationResult {
  email: string;
  status: SesVerificationStatus;
  sent: boolean;
  verified: boolean;
  message: string;
  welcomeEmailSent?: boolean;
  welcome_email_sent?: boolean;
}

// Chống gửi trùng email chào mừng khi Frontend polling hoặc chuyển tab nhiều lần
const welcomeEmailSentCache = new Set<string>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

/**
 * Gửi email chào mừng mang thương hiệu AstralFood ngay khi email vừa xác thực AWS SES thành công.
 * Mỗi địa chỉ email chỉ gửi tối đa 1 lần trong vòng đời process và không bao giờ throw lỗi.
 */
export async function sendWelcomeVerifiedEmail(email: string, fullName?: string): Promise<boolean> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return false;
  }

  if (process.env.LOCAL_SIMULATION === 'true') {
    console.log(`[SES WELCOME][LOCAL] Mô phỏng gửi email chào mừng tới ${normalizedEmail}`);
    return true;
  }

  if (welcomeEmailSentCache.has(normalizedEmail)) {
    return false;
  }

  // Đánh dấu trước khi gọi AWS SES để chặn race condition khi Frontend polling song song
  welcomeEmailSentCache.add(normalizedEmail);

  const displayName = escapeHtml((fullName || '').trim() || 'bạn');
  const safeEmail = escapeHtml(normalizedEmail);
  const subject = '🎉 Xác thực email AstralFood thành công!';
  const textBody = [
    `Xin chào ${(fullName || '').trim() || 'bạn'},`,
    '',
    `Email ${normalizedEmail} của bạn đã được xác thực thành công trên hệ thống AWS SES của AstralFood.`,
    'Từ giờ khi bạn đặt món trên AstralFood, mọi thông báo xác nhận đơn hàng, cập nhật trạng thái giao hàng và hóa đơn điện tử PDF sẽ tự động gửi về hộp thư này.',
    '',
    'Trải nghiệm đặt món ngay tại: https://dl2uzojz50nh6.cloudfront.net',
    '',
    'Trân trọng,',
    'Đội ngũ AstralFood',
  ].join('\n');

  const htmlBody = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Xác thực email AstralFood thành công</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFFDF9; margin: 0; padding: 24px; color: #1E293B;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #ffedd5; overflow: hidden; box-shadow: 0 4px 14px rgba(255, 90, 31, 0.08);">
    <div style="background: linear-gradient(135deg, #FF5A1F 0%, #F59E0B 100%); padding: 26px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">ASTRALFOOD</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Xác thực email thành công</p>
    </div>
    <div style="padding: 26px 24px;">
      <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>${displayName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Chúc mừng! Địa chỉ email <strong>${safeEmail}</strong> của bạn đã được xác thực thành công trên hệ thống thông báo <strong>AWS SES</strong> của <strong>AstralFood</strong>.
      </p>
      <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 14px 16px; margin: 18px 0; font-size: 13px; color: #065F46; line-height: 1.55;">
        Từ giờ, mỗi khi bạn đặt món trên AstralFood, hệ thống sẽ tự động gửi:
        <ul style="margin: 8px 0 0 18px; padding: 0;">
          <li>Email xác nhận đơn hàng mới ngay khi đặt món</li>
          <li>Thông báo cập nhật trạng thái đơn theo thời gian thực</li>
          <li>Đường dẫn tải hóa đơn điện tử PDF lưu trên AWS S3</li>
        </ul>
      </div>
      <p style="text-align: center; margin: 24px 0 8px 0;">
        <a href="https://dl2uzojz50nh6.cloudfront.net" style="display: inline-block; background: linear-gradient(135deg, #FF5A1F 0%, #F59E0B 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px;">
          Khám phá món ngon ngay
        </a>
      </p>
      <hr style="border: none; border-top: 1px dashed #E2E8F0; margin: 22px 0 14px 0;">
      <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
        Email được gửi tự động bởi hệ thống AstralFood trên AWS Cloud.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const client = getSESClient();
    await client.send(
      new SendEmailCommand({
        Source: `AstralFood <${config.aws.sesSenderEmail}>`,
        Destination: {
          ToAddresses: [normalizedEmail],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      })
    );

    return true;
  } catch (error) {
    welcomeEmailSentCache.delete(normalizedEmail);
    console.error('[SES WELCOME ERROR] Lỗi khi gửi email chào mừng AstralFood:', error);
    return false;
  }
}
