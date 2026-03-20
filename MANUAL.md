# คู่มือระบบ Line OA IT Support Bot

## 1. ภาพรวมระบบ

ระบบตอบคำถาม IT Support อัตโนมัติผ่าน Line OA โดยใช้ AI (Claude) ตอบแทนเจ้าหน้าที่ รองรับการสนทนาต่อเนื่องและจำบริบทได้ในแต่ละ session

### สถาปัตยกรรมระบบ

```
ผู้ใช้ (Line App)
      │
      ▼
Line Platform
      │  Webhook (HTTPS POST)
      ▼
Railway Server (Node.js + Express)
      │
      ├── Verify Signature (Line SDK)
      ├── Extract Message + UserId
      │
      ▼
Claude API (Anthropic)
      │  IT Support Response
      ▼
Railway Server
      │  Reply Message
      ▼
Line Platform
      │
      ▼
ผู้ใช้ (Line App)
```

---

## 2. Tech Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.x |
| Line SDK | @line/bot-sdk | 9.x |
| AI | Claude Opus (Anthropic) | claude-opus-4-6 |
| Hosting | Railway | - |
| Env | dotenv | 16.x |

---

## 3. โครงสร้างไฟล์

```
line-it-bot/
├── src/
│   ├── config/
│   │   └── line.js              # ตั้งค่า Line MessagingApiClient
│   ├── controllers/
│   │   └── webhookController.js # รับ webhook → ส่งให้ Claude → ตอบกลับ
│   ├── routes/
│   │   └── webhook.js           # route POST /webhook
│   └── services/
│       ├── claudeService.js     # เชื่อม Claude API + จัดการ history
│       └── messageService.js   # replyMessage ไปยัง Line
├── .env                         # API Keys (ห้าม commit)
├── .env.example                 # Template
├── .gitignore
├── index.js                     # Entry point
└── package.json
```

---

## 4. Environment Variables

| ตัวแปร | คำอธิบาย | หาได้จาก |
|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Token สำหรับส่งข้อความผ่าน Line API | Line Developer Console → Messaging API |
| `LINE_CHANNEL_SECRET` | Secret สำหรับ verify webhook signature | Line Developer Console → Basic settings |
| `ANTHROPIC_API_KEY` | API Key สำหรับ Claude AI | console.anthropic.com |
| `PORT` | Port ที่ server รัน (default: 3000) | กำหนดเอง |

---

## 5. การทำงานของระบบ

### Flow การตอบคำถาม

1. ผู้ใช้ส่งข้อความใน Line OA
2. Line Platform ส่ง Webhook มาที่ `/webhook`
3. Server verify signature ก่อน (ป้องกัน request ปลอม)
4. ตอบ HTTP 200 OK ทันที
5. ดึง `userId` และ `message.text` จาก event
6. โหลด conversation history ของ user นั้น
7. ส่ง history + ข้อความใหม่ไปยัง Claude API
8. รับคำตอบจาก Claude
9. บันทึกคู่สนทนาลงใน history
10. ส่งคำตอบกลับไปหาผู้ใช้ผ่าน Line

### Conversation History

- เก็บใน **Memory (Map)** แยกตาม `userId`
- จำกัดสูงสุด **10 รอบ** (20 messages) ต่อ user
- **หายเมื่อ server restart** (Phase ถัดไปอาจเพิ่ม persistent storage)

### IT Support Scope

Bot ถูก configure ให้ตอบเรื่อง:
- Windows / Mac / Linux
- Network / WiFi / VPN
- Email / Microsoft 365 / Google Workspace
- Printer / Scanner
- Software ทั่วไป
- Reset Password
- Remote Desktop

---

## 6. การ Deploy

### Production (Railway)

| รายการ | ค่า |
|---|---|
| URL | `https://line-it-bot-production.up.railway.app` |
| Webhook | `https://line-it-bot-production.up.railway.app/webhook` |
| Health Check | `https://line-it-bot-production.up.railway.app/` |

### Deploy ครั้งต่อไป (Auto Deploy)

Railway เชื่อมกับ GitHub — เมื่อ push code ใหม่ จะ deploy อัตโนมัติ:

```bash
git add .
git commit -m "อธิบาย changes"
git push origin main
```

### รัน Local (Development)

```bash
cd line-it-bot
npm install
npm run dev        # nodemon (auto restart)
# เปิดอีก terminal:
ngrok http 3000    # expose localhost
```

---

## 7. การบำรุงรักษา

### ตรวจสอบสถานะระบบ

- **Railway Dashboard** → ดู Deployment logs, CPU, Memory
- **Health Check** → เปิด `https://line-it-bot-production.up.railway.app/` ต้องเห็น "Line IT Support Bot is running"

### อัพเดท System Prompt

แก้ไขได้ที่ `src/services/claudeService.js` ตัวแปร `IT_SUPPORT_PROMPT`

### เปลี่ยน AI Model

แก้ไขได้ที่ `src/services/claudeService.js` บรรทัด `model: 'claude-opus-4-6'`

| Model | ความสามารถ | ราคา |
|---|---|---|
| `claude-opus-4-6` | สูงสุด | แพงสุด |
| `claude-sonnet-4-6` | กลาง | กลาง |
| `claude-haiku-4-5-20251001` | เร็ว/เบา | ถูกสุด |

---

## 8. ค่าใช้จ่าย

### 8.1 Railway (Hosting)

| Plan | ราคา | เหมาะกับ |
|---|---|---|
| **Hobby** | **$5/เดือน** | ✅ ใช้งานจริง (แนะนำ) |
| Pro | $20/เดือน | traffic สูง / หลาย service |

> Hobby plan รวม $5 credit/เดือน — bot ขนาดเล็กใช้ไม่เกิน $1-2/เดือน เหลือ credit เฟือ

### 8.2 Claude API (Anthropic)

**claude-opus-4-6 ราคาต่อ 1 ล้าน tokens:**

| | ราคา |
|---|---|
| Input tokens | $15 |
| Output tokens | $75 |

**ประมาณค่าใช้จ่ายต่อเดือน:**

| จำนวนข้อความ/เดือน | Input (est.) | Output (est.) | ค่าใช้จ่าย (USD) | ค่าใช้จ่าย (THB ~35฿) |
|---|---|---|---|---|
| 500 msg | 25K tokens | 100K tokens | ~$8 | ~280฿ |
| 1,000 msg | 50K tokens | 200K tokens | ~$16 | ~560฿ |
| 3,000 msg | 150K tokens | 600K tokens | ~$47 | ~1,645฿ |
| 5,000 msg | 250K tokens | 1M tokens | ~$79 | ~2,765฿ |

> ลด cost ได้ด้วยการเปลี่ยนเป็น `claude-haiku-4-5-20251001` (ถูกกว่า ~20x) หากคำถามไม่ซับซ้อน

### 8.3 Line OA (Messaging)

| Plan | ราคา | Free Messages/เดือน | เกิน |
|---|---|---|---|
| Free | ฿0 | 200 msg | ส่งไม่ได้ |
| **Standard** | **฿1,200/เดือน** | 3,000 msg | +฿3/1,000 msg |
| Pro | ฿3,000/เดือน | 6,000 msg | +฿3/1,000 msg |

> Reply Message (ตอบกลับ) **ไม่นับ quota** — นับเฉพาะ Push Message (ส่งก่อน)
> Bot นี้ใช้แค่ Reply → **ใช้ Free plan ได้ตลอด**

### 8.4 สรุปค่าใช้จ่ายรายเดือน

| รายการ | ค่าใช้จ่าย |
|---|---|
| Railway Hobby | $5 (~175฿) |
| Claude API (1,000 msg/เดือน) | ~$16 (~560฿) |
| Line OA (Reply only) | ฿0 |
| **รวม** | **~$21/เดือน (~735฿)** |

---

## 9. ความปลอดภัย

- ✅ Verify Line signature ทุก request
- ✅ API Keys เก็บใน Environment Variables (ไม่ hardcode)
- ✅ `.env` อยู่ใน `.gitignore`
- ✅ ไม่แนะนำคำสั่งที่เป็นอันตรายต่อระบบ (ตาม System Prompt)

---

## 10. Phase ถัดไป (Roadmap)

| Phase | Feature | สถานะ |
|---|---|---|
| 1 | Webhook + Express + Echo bot | ✅ Done |
| 2 | Claude AI + IT Support prompt | ✅ Done |
| 3 | Conversation history (in-memory) | ✅ Done |
| 4 | Deploy บน Railway | ✅ Done |
| 5 | Persistent history (Redis/DB) | 🔲 Todo |
| 6 | Rich Menu บน Line OA | 🔲 Todo |
| 7 | Admin dashboard / log viewer | 🔲 Todo |
| 8 | Escalation (ส่งต่อเจ้าหน้าที่) | 🔲 Todo |
