import { Router, Request, Response } from 'express';
import { generateProductMarketingDescription } from '../services/aiService.js';

export const aiRouter = Router();

aiRouter.post('/generate-description', async (req: Request, res: Response) => {
  try {
    const { productName, keywords } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'productName là bắt buộc.' });
    }

    const result = await generateProductMarketingDescription(productName, keywords);
    return res.json(result);
  } catch (error) {
    console.error('[AI COPILOT ERROR]', error);
    return res.status(500).json({ error: 'Không thể sinh mô tả AI.' });
  }
});
