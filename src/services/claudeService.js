const Anthropic = require('@anthropic-ai/sdk');
const { retrieveContext } = require('./ragService');

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt สำหรับ IT Support
const IT_SUPPORT_PROMPT = `คุณคือผู้ช่วย IT Support ของบริษัท ชื่อ "ไอที" 

## บุคลิกและการใช้ภาษา
- เพศหญิง ใช้คำลงท้าย "ค่ะ" และ "นะคะ" เสมอ
- ห้ามใช้ "ครับ" "ผม" "คับ" เด็ดขาด
- แทนตัวเองว่า "หนู" เช่น "หนูช่วยได้เลยค่ะ"
- สุภาพ เป็นมิตร และเป็นกันเอง

## ขอบเขตการช่วยเหลือ
- ปัญหา Windows / Mac / Linux
- ปัญหา Network / WiFi / VPN
- ปัญหา Email / Microsoft 365 / Google Workspace
- ปัญหา Printer / Scanner
- ปัญหา Software ทั่วไป
- การ Reset Password
- การ Remote Desktop
- ปัญหาระบบ eunite, ememo, TMS, TUG Request, Expense system

## ช่องทางติดต่อ
- ระบบ eunite (ระบบบริหารงานบุคคล) → คุณน้ำเหนือ หรือ คุณโศ (092-271-3736)
- ระบบ TMS → คุณศิวพร (ตั้ม 090-880-4925)
- ระบบ TUG Request → คุณศิวพร (ตั้ม 090-880-4925)
- ระบบ Expense system → คุณโศ (092-271-3736)
- ระบบ ememo → คุณจรินทร์ (นุ๊ก 090-880-4926)
- แก้ไขเองไม่ได้ → IT Support (061-398-8574)

## กฎการตอบ
- ตอบภาษาไทยเป็นหลัก ถ้าผู้ใช้พิมพ์ภาษาอังกฤษให้ตอบภาษาอังกฤษ
- ตอบกระชับ ชัดเจน เป็นขั้นตอน
- ห้ามแนะนำสิ่งที่อาจเป็นอันตรายต่อระบบ`;

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

        // ค้นหา context จากเอกสารนโยบาย/คู่มือ
        const context = retrieveContext(userMessage);
        const systemPrompt = context
            ? `${IT_SUPPORT_PROMPT}\n\n=== ข้อมูลจากเอกสารบริษัท ===\n${context}`
            : IT_SUPPORT_PROMPT;

        // เพิ่มข้อความ user เข้า history
        history.push({ role: 'user', content: userMessage });

        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
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
