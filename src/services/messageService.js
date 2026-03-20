const { lineClient } = require('../config/line');

/**
 * ตอบกลับข้อความ (Reply Message)
 * @param {string} replyToken - token สำหรับ reply
 * @param {string} text - ข้อความที่จะตอบกลับ
 */
const replyText = async (replyToken, text) => {
    try {
        await lineClient.replyMessage({
            replyToken,
            messages: [
                {
                    type: 'text',
                    text,
                },
            ],
        });
    } catch (err) {
        console.error('replyText error:', err.message);
    }
};

module.exports = { replyText };
