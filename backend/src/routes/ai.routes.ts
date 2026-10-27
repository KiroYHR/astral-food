import { Router, Request, Response } from 'express';
import { generateProductMarketingDescription } from '../services/aiService.js';

export const aiRouter = Router();

aiRouter.post('/generate-description', async (req: Request, res: Response) => {
  try {
    const { productName, dishName, keywords } = req.body;
    const targetName = productName || dishName;

    if (!targetName) {
      return res.status(400).json({ error: 'productName hoặc dishName là bắt buộc.' });
    }

    const result = await generateProductMarketingDescription(targetName, keywords);
    return res.json({
      description: result.description,
      generated_description: result.description,
      suggestedTags: result.suggestedTags,
      suggested_tags: result.suggestedTags,
      suggested_price_range: { min: 35000, max: 75000 },
    });
  } catch (error) {
    console.error('[AI COPILOT ERROR]', error);
    return res.status(500).json({ error: 'Không thể sinh mô tả AI.' });
  }
});
