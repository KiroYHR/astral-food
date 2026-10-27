import { Router, Request, Response } from 'express';
import { generatePresignedUploadUrl } from '../services/s3Service.js';

export const mediaRouter = Router();

mediaRouter.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName là bắt buộc.' });
    }

    const result = await generatePresignedUploadUrl(
      fileName,
      fileType || 'image/jpeg'
    );

    return res.json(result);
  } catch (error) {
    console.error('[PRESIGNED URL ERROR]', error);
    return res.status(500).json({ error: 'Không thể sinh S3 Presigned URL.' });
  }
});
