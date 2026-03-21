const { lineClient } = require('../config/line');

/**
 * ตอบกลับข้อความ (Reply Message)
 * @param {string} replyToken
 * @param {string} text
 */
const replyText = async (replyToken, text) => {
    try {
        await lineClient.replyMessage({
            replyToken,
            messages: [{ type: 'text', text }],
        });
    } catch (err) {
        console.error('replyText error:', err.message);
    }
};

/**
 * ส่งข้อความเชิงรุก (Push Message) ไปยัง userId หรือ groupId
 * @param {string} targetId - userId หรือ groupId
 * @param {string} text
 */
const pushText = async (targetId, text) => {
    try {
        await lineClient.pushMessage({
            to: targetId,
            messages: [{ type: 'text', text }],
        });
    } catch (err) {
        console.error('pushText error:', err.message);
    }
};

/**
 * ดึงข้อมูล Profile ของ user จาก Line
 * @param {string} userId
 * @returns {object|null}
 */
const getLineProfile = async (userId) => {
    try {
        return await lineClient.getProfile(userId);
    } catch (err) {
        console.error('getLineProfile error:', err.message);
        return null;
    }
};

module.exports = { replyText, pushText, getLineProfile };
