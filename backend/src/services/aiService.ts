import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

export interface AiDescriptionResult {
  description: string;
  suggestedTags: string[];
  suggestedPriceRange: { min: number; max: number };
  source: 'gemini' | 'fallback';
}

function buildKeywordClause(keywords?: string): string {
  const cleaned = keywords?.trim();
  return cleaned ? ` Đặc biệt nổi bật với hương vị ${cleaned}, khó lòng chối từ.` : '';
}

function buildSmartFallback(productName: string, keywords?: string): AiDescriptionResult {
  const name = productName.trim();
  const haystack = `${name} ${keywords || ''}`.toLowerCase();
  const extra = buildKeywordClause(keywords);

  if (
    haystack.includes('phở') ||
    haystack.includes('pho') ||
    haystack.includes('bún') ||
    haystack.includes('bun') ||
    haystack.includes('hủ tiếu') ||
    haystack.includes('hu tieu') ||
    haystack.includes('mì ') ||
    haystack.includes('miến')
  ) {
    return {
      description: `${name} nóng hổi với phần nước dùng ninh xương đậm đà, ngọt thanh tự nhiên hòa quyện cùng thịt mềm thấm vị và rau thơm tươi xanh.${extra} Thích hợp cho bữa sáng tràn năng lượng hoặc bữa trưa tròn vị.`,
      suggestedTags: ['mon_nuoc', 'dam_da', 'nong_hoi', 'chuan_vi'],
      suggestedPriceRange: { min: 45000, max: 85000 },
      source: 'fallback',
    };
  }

  if (haystack.includes('cơm') || haystack.includes('com ') || haystack.includes('xôi')) {
    return {
      description: `${name} hạt dẻo thơm ăn kèm phần thịt ướp gia vị đậm đà nướng vừa lửa, chan thêm nước mắm pha kẹo và đồ chua giải ngấy.${extra} Phần ăn đầy đặn, chắc bụng cho cả ngày làm việc hiệu quả.`,
      suggestedTags: ['com_ngon', 'chac_bung', 'com_trua', 'dac_san'],
      suggestedPriceRange: { min: 40000, max: 75000 },
      source: 'fallback',
    };
  }

  if (
    haystack.includes('trà') ||
    haystack.includes('tra ') ||
    haystack.includes('cà phê') ||
    haystack.includes('ca phe') ||
    haystack.includes('coffee') ||
    haystack.includes('matcha') ||
    haystack.includes('latte') ||
    haystack.includes('sinh tố') ||
    haystack.includes('nước ép')
  ) {
    return {
      description: `${name} được pha chế chuẩn vị với hương trà/cà phê nguyên bản thơm lừng, cân bằng độ béo mịn và vị ngọt thanh mát.${extra} Thức uống giải nhiệt lý tưởng giúp bạn tỉnh táo và sảng khoái tức thì.`,
      suggestedTags: ['do_uong', 'giai_khat', 'thom_beo', 'best_seller'],
      suggestedPriceRange: { min: 30000, max: 65000 },
      source: 'fallback',
    };
  }

  if (
    haystack.includes('gà rán') ||
    haystack.includes('gà ') ||
    haystack.includes('burger') ||
    haystack.includes('pizza') ||
    haystack.includes('khoai')
  ) {
    return {
      description: `${name} sở hữu lớp vỏ vàng ruộm giòn tan bên ngoài, bên trong thịt vẫn giữ trọn độ mềm mọng ngọt tự nhiên quyện sốt chấm đặc trưng.${extra} Lựa chọn hoàn hảo cho những tín đồ mê đồ ăn nhanh giòn rụm.`,
      suggestedTags: ['gion_rum', 'an_nhanh', 'sot_dam_da', 'combo_hot'],
      suggestedPriceRange: { min: 49000, max: 99000 },
      source: 'fallback',
    };
  }

  if (
    haystack.includes('bánh') ||
    haystack.includes('banh') ||
    haystack.includes('nem') ||
    haystack.includes('cuốn') ||
    haystack.includes('gỏi') ||
    haystack.includes('chè') ||
    haystack.includes('ăn vặt')
  ) {
    return {
      description: `${name} chế biến mới mỗi ngày với phần nhân đầy đặn, hòa quyện hương vị chua cay mặn ngọt hài hòa chuẩn gu đường phố.${extra} Món ăn tiện lợi, hấp dẫn cho bữa xế chiều hoặc tụ họp bạn bè.`,
      suggestedTags: ['an_vat', 'gion_ngon', 'mon_nhe', 'duong_pho'],
      suggestedPriceRange: { min: 25000, max: 59000 },
      source: 'fallback',
    };
  }

  return {
    description: `${name} được đầu bếp chế biến tươi mới mỗi ngày từ nguyên liệu tuyển chọn kỹ lưỡng, giữ trọn hương vị đậm đà và mùi thơm quyến rũ.${extra} Lựa chọn đáng thử cho thực đơn hôm nay của bạn.`,
    suggestedTags: ['mon_ngon', 'tuoi_moi', 'dac_sac', 'yeu_thich'],
    suggestedPriceRange: { min: 35000, max: 75000 },
    source: 'fallback',
  };
}

export async function generateProductMarketingDescription(
  productName: string,
  keywords?: string
): Promise<AiDescriptionResult> {
  const smartFallback = buildSmartFallback(productName, keywords);
  if (!config.ai.geminiApiKey) {
    return smartFallback;
  }

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' } as any,
    });

    const prompt = `Bạn là một chuyên gia ẩm thực và marketing đồ ăn cho ứng dụng giao đồ ăn tại Việt Nam.
Hãy viết một đoạn mô tả ngắn gọn (2-3 câu bằng tiếng Việt tự nhiên), cực kỳ hấp dẫn, kích thích vị giác cho món: '${productName}'.
Từ khóa gợi ý: ${keywords || 'thơm ngon, tươi mới, đậm đà'}.
Đồng thời gợi ý 4 hashtag ngắn gọn tiếng Việt không dấu dạng snake_case và khoảng giá tham khảo hợp lý tại Việt Nam (đơn vị VNĐ).
Trả lời đúng định dạng JSON thuần:
{
  "description": "...",
  "suggestedTags": ["tag_1", "tag_2", "tag_3", "tag_4"],
  "suggestedPriceRange": { "min": 40000, "max": 75000 }
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const description =
      typeof parsed?.description === 'string' && parsed.description.trim().length > 0
        ? parsed.description.trim()
        : smartFallback.description;
    const suggestedTags =
      Array.isArray(parsed?.suggestedTags) && parsed.suggestedTags.length > 0
        ? parsed.suggestedTags.slice(0, 4).map((t: unknown) => String(t).trim()).filter(Boolean)
        : smartFallback.suggestedTags;
    const minPrice = Number(parsed?.suggestedPriceRange?.min);
    const maxPrice = Number(parsed?.suggestedPriceRange?.max);
    const suggestedPriceRange =
      Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice > 0 && maxPrice >= minPrice
        ? { min: minPrice, max: maxPrice }
        : smartFallback.suggestedPriceRange;

    return {
      description,
      suggestedTags,
      suggestedPriceRange,
      source: 'gemini',
    };
  } catch (error) {
    console.error('[AI SERVICE ERROR] Fallback triggered:', error instanceof Error ? error.message : error);
    return smartFallback;
  }
}
