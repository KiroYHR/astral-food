import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

export async function generateProductMarketingDescription(
  productName: string,
  keywords?: string
): Promise<{ description: string; suggestedTags: string[] }> {
  if (!config.ai.geminiApiKey) {
    return {
      description: `Món '${productName}' thơm ngon hảo hạng, chế biến tươi mới từ nguyên liệu sạch mỗi ngày. Hương vị đậm đà khó quên, thích hợp cho bữa ăn gia đình và bạn bè!`,
      suggestedTags: ['mon_ngon', 'dac_san', 'an_trua', 'fast_food'],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' } as any,
    });

    const prompt = `Bạn là một chuyên gia ẩm thực và marketing đồ ăn cho nhà hàng.
Hãy viết một đoạn mô tả ngắn gọn (3-4 câu), cực kỳ hấp dẫn, kích thích vị giác cho món: '${productName}'.
Từ khóa gợi ý: ${keywords || 'thơm ngon, tươi mới, đậm đà'}.
Đồng thời gợi ý 4 hashtag ngắn gọn (không dấu, cách nhau bởi dấu phẩy).
Trả lời theo định dạng JSON:
{
  "description": "...",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('[AI SERVICE ERROR]', error);
    return {
      description: `Món '${productName}' được chế biến đặc biệt với hương vị khó cưỡng!`,
      suggestedTags: ['foodie', 'delicious', 'yummy'],
    };
  }
}
