const express = require('express');
const { lineMiddleware } = require('../config/line');
const { handleWebhook } = require('../controllers/webhookController');

const router = express.Router();

// ใช้ Line middleware verify signature ทุก request
router.post('/', lineMiddleware, handleWebhook);

module.exports = router;
