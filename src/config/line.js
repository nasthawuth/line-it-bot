const { middleware, messagingApi } = require('@line/bot-sdk');

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// v9: ใช้ MessagingApiClient แทน Client ที่ deprecated
const lineClient = new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});
const lineMiddleware = middleware(lineConfig);

module.exports = { lineClient, lineMiddleware };
