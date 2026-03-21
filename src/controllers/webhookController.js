const { replyText, pushText, getLineProfile } = require('../services/messageService');
const { askClaude } = require('../services/claudeService');
const { findITOwner } = require('../services/staffService');

// ── Duplicate Event Prevention ──────────────────────────────────────────────
// เก็บ eventId ที่ผ่านมาแล้ว (TTL 5 นาที)
const processedEvents = new Map();
const EVENT_TTL_MS = 5 * 60 * 1000;

function isDuplicateEvent(eventId) {
    const now = Date.now();

    // cleanup events ที่หมดอายุแล้ว
    for (const [id, ts] of processedEvents) {
        if (now - ts > EVENT_TTL_MS) processedEvents.delete(id);
    }

    if (processedEvents.has(eventId)) return true;
    processedEvents.set(eventId, now);
    return false;
}

// ── User Processing Lock ─────────────────────────────────────────────────────
// ป้องกัน user เดียวกัน process ซ้อนกัน
const processingUsers = new Set();

// ── Main Handler ─────────────────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
    // ตอบ 200 OK ทันทีก่อน process เสมอ
    res.status(200).json({ status: 'ok' });

    const events = req.body.events;

    for (const event of events) {
        try {
            // รับเฉพาะ message (text) จาก chat ส่วนตัวเท่านั้น
            if (
                event.type !== 'message' ||
                event.message.type !== 'text' ||
                event.source.type !== 'user'
            ) continue;

            // ดัก duplicate event
            if (event.webhookEventId && isDuplicateEvent(event.webhookEventId)) {
                console.log(`[SKIP] duplicate event: ${event.webhookEventId}`);
                continue;
            }

            await handleTextMessage(event);
        } catch (err) {
            console.error('handleWebhook error:', err.message);
        }
    }
};

// ── Text Message Handler ─────────────────────────────────────────────────────
const handleTextMessage = async (event) => {
    const { replyToken, message, source } = event;
    const userId = source.userId;
    const userText = message.text;

    // lock per user — ถ้ากำลัง process อยู่ให้ข้ามไปก่อน
    if (processingUsers.has(userId)) {
        console.log(`[SKIP] ${userId} is already processing`);
        return;
    }
    processingUsers.add(userId);

    try {
        console.log(`[MSG] ${userId}: ${userText}`);

        const result = await askClaude(userId, userText);

        // ตอบ user
        await replyText(replyToken, result.message);

        // ถ้า bot แก้ไม่ได้ → แจ้ง IT
        if (!result.resolved) {
            const profile = await getLineProfile(userId);
            const displayName = profile?.displayName || userId;
            await routeToIT(displayName, result.summary, result.category);
        }
    } finally {
        processingUsers.delete(userId);
    }
};

// ── Smart Routing ─────────────────────────────────────────────────────────────
/**
 * ส่ง alert ไปหา IT เจ้าของ category หรือ Group IT
 * @param {string} displayName - ชื่อ user ที่ถามมา
 * @param {string} summary - สรุปปัญหา
 * @param {string} category - category จาก Claude
 */
const routeToIT = async (displayName, summary, category) => {
    const owner = findITOwner(category);
    const targetId = owner
        ? owner.line_user_id
        : process.env.LINE_GROUP_IT_ID;

    if (!targetId) {
        console.warn('[ROUTE] ไม่มี targetId — กรุณาตั้งค่า LINE_GROUP_IT_ID');
        return;
    }

    const ownerLabel = owner
        ? `📌 ส่งหา ${owner.name} โดยตรง`
        : `📌 ส่งเข้า IT Team`;

    const alertMessage = [
        '🚨 IT Support Alert',
        '──────────────────',
        `👤 พนักงาน: ${displayName}`,
        `❓ ปัญหา: ${summary}`,
        `🏷️ Category: ${category}`,
        ownerLabel,
        `⏰ เวลา: ${new Date().toLocaleString('th-TH')}`,
        '──────────────────',
        '⚠️ Bot ไม่สามารถแก้ไขได้',
        'กรุณาติดต่อ User โดยตรงค่ะ',
    ].join('\n');

    await pushText(targetId, alertMessage);
    console.log(`[ROUTE] → ${owner ? owner.name : 'Group IT'} (category: ${category})`);
};

module.exports = { handleWebhook };
