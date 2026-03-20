const { replyText } = require('../services/messageService');
const { askClaude } = require('../services/claudeService');

/**
 * จัดการ webhook events จาก Line Platform
 * รองรับเฉพาะ message event ประเภท text (Phase 2)
 */
const handleWebhook = async (req, res) => {
  // ตอบ 200 OK ทันทีก่อน process
  res.status(200).json({ status: 'ok' });

  const events = req.body.events;

  for (const event of events) {
    try {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleTextMessage(event);
      }
    } catch (err) {
      console.error('handleWebhook error:', err.message);
    }
  }
};

/**
 * จัดการ text message — Phase 2: IT Support via Claude
 * @param {object} event - Line message event
 */
const handleTextMessage = async (event) => {
  const { replyToken, message, source } = event;
  const userText = message.text;
  const userId = source.userId;

  console.log(`[MSG] ${userId}: ${userText}`);

  // Phase 3: ส่งให้ Claude พร้อม conversation history
  const reply = await askClaude(userId, userText);
  await replyText(replyToken, reply);
};

module.exports = { handleWebhook };
