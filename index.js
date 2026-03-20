require('dotenv').config();
const express = require('express');
const webhookRouter = require('./src/routes/webhook');
const { loadKnowledgeBase } = require('./src/services/ragService');

const app = express();
const PORT = process.env.PORT || 3000;

// โหลดเอกสารนโยบาย/คู่มือตอน startup
loadKnowledgeBase();

// route /webhook
app.use('/webhook', webhookRouter);

// health check
app.get('/', (req, res) => {
  res.send('Line IT Support Bot is running 🤖');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
