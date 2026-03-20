const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt สำหรับ IT Support
const IT_SUPPORT_PROMPT = `คุณคือผู้ช่วย IT Support ของบริษัท ตอบคำถามเกี่ยวกับปัญหาด้าน IT ได้แก่:
- ปัญหา Windows / Mac / Linux
- ปัญหา Network / WiFi / VPN
- ปัญหา Email / Microsoft 365 / Google Workspace
- ปัญหา Printer / Scanner
- ปัญหา Software ทั่วไป
- การ Reset Password
- การ Remote Desktop

แนวทางการตอบ:
- ตอบภาษาไทยเป็นหลัก ถ้าผู้ใช้พิมพ์ภาษาอังกฤษให้ตอบภาษาอังกฤษ
- ตอบกระชับ ชัดเจน เป็นขั้นตอน
- ถ้าแก้ไขเองไม่ได้ให้แนะนำให้ติดต่อ IT Support โดยตรง
- ห้ามแนะนำให้ทำสิ่งที่อาจเป็นอันตรายต่อระบบ`;

// เก็บประวัติการสนทนาต่อ userId (in-memory)
const MAX_HISTORY = 10; // จำนวนคู่สนทนาสูงสุดต่อ user
const conversationHistory = new Map();

/**
 * ส่งข้อความไปยัง Claude API พร้อม conversation history
 * @param {string} userId - Line userId
 * @param {string} userMessage - ข้อความจากผู้ใช้
 * @returns {string} - คำตอบจาก Claude
 */
const askClaude = async (userId, userMessage) => {
  try {
    // โหลด history ของ user นี้ (หรือสร้างใหม่)
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);

    // เพิ่มข้อความ user เข้า history
    history.push({ role: 'user', content: userMessage });

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: IT_SUPPORT_PROMPT,
      messages: history,
    });

    const replyText = response.content[0].text;

    // เพิ่มคำตอบ assistant เข้า history
    history.push({ role: 'assistant', content: replyText });

    // จำกัดไม่เกิน MAX_HISTORY คู่ (user+assistant = 2 entries)
    if (history.length > MAX_HISTORY * 2) {
      history.splice(0, 2);
    }

    return replyText;
  } catch (err) {
    console.error('Claude API error:', err.message);
    return 'ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง หรือติดต่อ IT Support โดยตรงครับ';
  }
};

module.exports = { askClaude };
