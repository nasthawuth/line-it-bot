# คู่มือระบบ Line OA IT Support Bot

## 1. ภาพรวมระบบ

ระบบตอบคำถาม IT Support อัตโนมัติผ่าน Line OA โดยใช้ AI (Claude) ตอบแทนเจ้าหน้าที่ รองรับการสนทนาต่อเนื่อง จำบริบทได้ในแต่ละ session และส่งต่อปัญหาไปยัง IT เจ้าของรับผิดชอบโดยตรง

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
      ├── Duplicate Event Prevention
      ├── Line OA Keyword Filter
      │
      ▼
Claude API (Anthropic)
      │  JSON Response { resolved, message, summary, category }
      ▼
Railway Server
      ├── Reply Message → ผู้ใช้
      └── [resolved=false] Push Alert → IT เจ้าของ / Group IT
            │
            ▼
      IT Staff (Line Personal Chat)
```

---

## 2. Tech Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.x |
| Line SDK | @line/bot-sdk | 9.x |
| AI | Claude Haiku (Anthropic) | claude-haiku-4-5-20251001 |
| Hosting | Railway | - |
| Env | dotenv | 16.x |

---

## 3. โครงสร้างไฟล์

```
line-it-bot/
├── src/
│   ├── config/
│   │   └── line.js                # ตั้งค่า Line MessagingApiClient
│   ├── controllers/
│   │   └── webhookController.js   # รับ webhook → filter → Claude → route
│   ├── routes/
│   │   └── webhook.js             # route POST /webhook
│   └── services/
│       ├── claudeService.js       # เชื่อม Claude API + จัดการ history + parse JSON
│       ├── messageService.js      # replyText, pushText, getLineProfile
│       ├── staffService.js        # mapping category → IT เจ้าของ
│       ├── quickReplyService.js   # keyword ที่ Line OA จัดการแล้ว (skip Claude)
│       └── ragService.js          # ค้นหาข้อมูลจาก knowledge_base.json
├── scripts/
│   └── ingest.js                  # แปลงเอกสาร Word/PDF → knowledge_base.json
├── docs/                          # วางไฟล์เอกสาร (ไม่ขึ้น GitHub)
├── it_staff.json                  # ข้อมูล IT Staff 18 คน + Line User ID
├── knowledge_base.json            # chunks เอกสารที่ bot ใช้ค้นหา
├── .env                           # API Keys (ห้าม commit)
├── .env.example                   # Template
├── .gitignore
├── index.js                       # Entry point
└── package.json
```

---

## 4. Environment Variables

| ตัวแปร | คำอธิบาย | หาได้จาก |
|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Token สำหรับส่งข้อความผ่าน Line API | Line Developer Console → Messaging API |
| `LINE_CHANNEL_SECRET` | Secret สำหรับ verify webhook signature | Line Developer Console → Basic settings |
| `ANTHROPIC_API_KEY` | API Key สำหรับ Claude AI | console.anthropic.com |
| `LINE_GROUP_IT_ID` | Group ID ของ Group IT (fallback routing) | Webhook Log เมื่อมีคนส่งในกลุ่ม |
| `PORT` | Port ที่ server รัน (default: 3000) | กำหนดเอง |

---

## 5. การทำงานของระบบ

### Flow การตอบคำถาม

1. ผู้ใช้ส่งข้อความใน Line OA (chat ส่วนตัวเท่านั้น)
2. Line Platform ส่ง Webhook มาที่ `/webhook`
3. Server verify signature ก่อน (ป้องกัน request ปลอม)
4. ตอบ HTTP 200 OK ทันที
5. ตรวจสอบ **Duplicate Event** ด้วย `webhookEventId` (TTL 5 นาที)
6. ตรวจสอบ **User Lock** — ถ้า user นี้กำลัง process อยู่ให้ข้ามไปก่อน
7. ตรวจสอบ **Line OA Keyword** — ถ้าตรง → skip (Line OA จัดการแล้ว)
8. ส่งข้อความ + conversation history ไปยัง Claude API
9. Claude ตอบกลับเป็น **JSON**: `{ resolved, message, summary, category }`
10. Bot ตอบ user ด้วย `message`
11. ถ้า `resolved = false` → ดึงชื่อ user → **Push Alert** ไปหา IT เจ้าของ

### Conversation History

- เก็บใน **Memory (Map)** แยกตาม `userId`
- จำกัดสูงสุด **10 รอบ** (20 messages) ต่อ user
- **หายเมื่อ server restart**

### IT Support Scope

Bot ถูก configure ให้ตอบเรื่อง:
- Windows / Mac / Linux / Remote Desktop / Reset Password
- Network / WiFi / VPN / Fingerscan
- Email / Microsoft 365 / Outlook
- Printer / Scanner / Hardware
- Software / License / OS / Anti Virus
- SAP B1, SAP PR/PO, SAP FI/CO, SAP ECC6
- eUnite, Expense System, TMS, TUG Request, eMemo, PMS
- Fleetcard, Expiredoc
- นโยบาย IT และคู่มือระบบ (จาก Knowledge Base)

### ข้อจำกัดการตอบ

- ตอบเฉพาะ **chat ส่วนตัว** เท่านั้น — ไม่ตอบในกลุ่ม Line
- ไม่แนะนำการแก้ไข registry, เขียน script หรือตั้งค่า network ขั้นสูง

---

## 6. Smart Routing — ส่งต่อ IT เจ้าของ

เมื่อ Claude ตัดสินว่า `resolved = false` (bot แก้ไม่ได้) ระบบจะ push alert ไปหา IT เจ้าของตาม category:

| Category | IT เจ้าของ | ตัวอย่างปัญหา |
|---|---|---|
| `network` | คุณเดชาพล (DC) | Network, WiFi, VPN, Fingerscan |
| `server` | คุณพินิต | Server, Database, Backup |
| `hardware` | คุณเอกฉันท์ | Printer, Computer, Scanner |
| `software` | คุณเดชาพล (DC) | Software, License, OS, Anti Virus |
| `email` | คุณปรมา | Email, Microsoft 365, Outlook |
| `sap_b1` | คุณเดวิทย์ (เดย์) | SAP Business One, SAP B1 |
| `sap_po` | คุณจรินทร์ (นุ๊ก) | SAP PR/PO, eMemo, PMS |
| `sap_fi` | คุณอภิวัฒน์ | FI/CO SAP, SAP ECC6, e-Tax |
| `eunite` | คุณโศภิศว์ | eUnite, Expense System |
| `tms` | คุณศิวพร (ตั้ม) | TMS, TUG Request, BILLING SAP |
| `itmis` | คุณเพ็ญนภา | ITMIS |
| `fleetcard` | คุณวนิดา (อาย) | Fleetcard, Expiredoc |
| `application` | คุณจรินทร์ (นุ๊ก) | ระบบแอปพลิเคชันอื่นๆ |
| `unknown` | Group IT | ไม่ชัดเจน |

### แก้ไขผู้รับผิดชอบ

แก้ไขได้ที่ `src/services/staffService.js` ใน `CATEGORY_ROUTING`

### รูปแบบ Alert ที่ IT ได้รับ

```
🚨 IT Support Alert
──────────────────
👤 พนักงาน: ชื่อ user
❓ ปัญหา: สรุปปัญหา
🏷️ Category: network
📌 ส่งหา คุณเดชาพล (DC) โดยตรง
⏰ เวลา: 22/3/2569 14:30:00
──────────────────
⚠️ Bot ไม่สามารถแก้ไขได้
กรุณาติดต่อ User โดยตรงค่ะ
```

---

## 7. Line OA Keyword Filter

keyword บางคำ Line OA Manager ตั้ง Auto-reply ไว้แล้ว — bot จะ **skip** ไม่ส่งไป Claude เพื่อป้องกันตอบซ้ำ

### แก้ไข keyword list

แก้ไขได้ที่ `src/services/quickReplyService.js` ใน `KEYWORDS_HANDLED_BY_LINE_OA`

> การเปรียบเทียบเป็นแบบ **case-insensitive** เช่น `MemberIT`, `memberit`, `MEMBERIT` ถือว่าเหมือนกัน

---

## 8. Knowledge Base (RAG)

ระบบสามารถตอบคำถามจากเอกสารนโยบาย/คู่มือของบริษัทได้ โดยค้นหาข้อมูลที่เกี่ยวข้องแล้วส่งให้ Claude ตอบ

### โครงสร้างไฟล์

```
docs/                        ← วางไฟล์ Word/PDF ที่นี่ (ไม่ขึ้น GitHub)
scripts/
└── ingest.js                ← script แปลงเอกสาร → knowledge_base.json
knowledge_base.json          ← chunks ที่ bot ใช้ค้นหา (commit ลง GitHub)
```

### รองรับไฟล์

| ประเภท | นามสกุล | หมายเหตุ |
|---|---|---|
| Word | `.docx` | อ่านได้ตรง |
| PDF (ดิจิทัล) | `.pdf` | อ่านได้ตรง |
| PDF (Scan) | `.pdf` | ต้องแปลงเป็น .docx ผ่าน Microsoft Word ก่อน |

### อัพเดทเอกสาร (ปีละครั้ง)

```bash
# 1. วางไฟล์ใหม่ใน docs/
# 2. รัน
node scripts/ingest.js

# 3. commit และ push
git add knowledge_base.json
git commit -m "อัพเดท knowledge base 2026"
git push origin main
```

---

## 9. การ Deploy

### Production (Railway)

| รายการ | ค่า |
|---|---|
| URL | `https://line-it-bot-production.up.railway.app` |
| Webhook | `https://line-it-bot-production.up.railway.app/webhook` |
| Health Check | `https://line-it-bot-production.up.railway.app/` |

### Deploy ครั้งต่อไป (Auto Deploy)

Railway เชื่อมกับ GitHub — เมื่อ push code ใหม่ จะ deploy อัตโนมัติภายใน 1-2 นาที:

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

## 10. การบำรุงรักษา

### ตรวจสอบสถานะระบบ

- **Railway Dashboard** → ดู Deployment logs, CPU, Memory
- **Health Check** → เปิด `https://line-it-bot-production.up.railway.app/` ต้องเห็น "Line IT Support Bot is running"

### อัพเดท System Prompt

แก้ไขได้ที่ `src/services/claudeService.js` ตัวแปร `IT_SUPPORT_PROMPT`

### เปลี่ยนผู้รับผิดชอบ IT (Routing)

แก้ไขได้ที่ `src/services/staffService.js` ตัวแปร `CATEGORY_ROUTING`

### เพิ่ม/ลด Line OA Keyword

แก้ไขได้ที่ `src/services/quickReplyService.js` ตัวแปร `KEYWORDS_HANDLED_BY_LINE_OA`

### เปลี่ยน AI Model

แก้ไขได้ที่ `src/services/claudeService.js` บรรทัด `model: 'claude-haiku-4-5-20251001'`

| Model | ความสามารถ | ราคา |
|---|---|---|
| `claude-opus-4-6` | สูงสุด | แพงสุด |
| `claude-sonnet-4-6` | กลาง | กลาง |
| `claude-haiku-4-5-20251001` | เร็ว/เบา | ถูกสุด ✅ ใช้อยู่ |

---

## 11. ค่าใช้จ่าย

### 11.1 Railway (Hosting)

| Plan | ราคา | เหมาะกับ |
|---|---|---|
| **Hobby** | **$5/เดือน** | ✅ ใช้งานจริง (แนะนำ) |
| Pro | $20/เดือน | traffic สูง / หลาย service |

> Hobby plan รวม $5 credit/เดือน — bot ขนาดเล็กใช้ไม่เกิน $1-2/เดือน เหลือ credit เฟือ

### 11.2 Claude API (Anthropic)

**ราคาต่อ 1 ล้าน tokens:**

| Model | Input | Output |
|---|---|---|
| claude-opus-4-6 | $15 | $75 |
| claude-sonnet-4-6 | $3 | $15 |
| **claude-haiku-4-5** ✅ | **$0.80** | **$4** |

**ประมาณค่าใช้จ่ายต่อเดือน (claude-haiku):**

| จำนวนข้อความ/เดือน | ค่าใช้จ่าย (USD) | ค่าใช้จ่าย (THB ~35฿) |
|---|---|---|
| 500 msg | ~$0.05 | ~2฿ |
| 1,000 msg | ~$0.10 | ~4฿ |
| 3,000 msg | ~$0.30 | ~11฿ |
| 5,000 msg | ~$0.50 | ~18฿ |

### 11.3 Line OA (Messaging)

| Plan | ราคา | Free Messages/เดือน | เกิน |
|---|---|---|---|
| Free | ฿0 | 200 msg | ส่งไม่ได้ |
| **Standard** | **฿1,200/เดือน** | 3,000 msg | +฿3/1,000 msg |
| Pro | ฿3,000/เดือน | 6,000 msg | +฿3/1,000 msg |

> Reply Message (ตอบกลับ) **ไม่นับ quota** — Push Message (แจ้ง IT) **นับ quota**
> แนะนำ Standard plan เพราะระบบใช้ Push Message แจ้ง IT ด้วย

### 11.4 สรุปค่าใช้จ่ายรายเดือน

| รายการ | ค่าใช้จ่าย |
|---|---|
| Railway Hobby | $5 (~175฿) |
| Claude Haiku API (1,000 msg/เดือน) | ~$0.10 (~4฿) |
| Line OA Standard | ฿1,200 |
| **รวม** | **~฿1,380/เดือน** |

---

## 12. Git และ GitHub

### Push ครั้งต่อไป (Auto Deploy ไปยัง Railway)

```bash
git add .
git commit -m "อธิบาย changes"
git push origin main
```

Railway จะ detect การ push และ deploy อัตโนมัติภายใน 1-2 นาที

### เช็คสถานะหลัง Push

- Railway Dashboard → **Deployments** → สถานะต้องเป็น **Success** (สีเขียว)
- ทดสอบ URL: `https://line-it-bot-production.up.railway.app/`

> **หมายเหตุ:** ห้าม `git add .env` — ไฟล์นี้มี API Keys ห้าม commit เด็ดขาด

---

## 13. Railway

### ตั้งค่า Environment Variables

Railway Dashboard → Project → **Variables** → เพิ่ม:

```
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
ANTHROPIC_API_KEY=...
LINE_GROUP_IT_ID=...
```

### เช็คว่า Deploy สำเร็จ

1. Railway Dashboard → แท็บ **Deployments**
2. สถานะต้องเป็น **Success** (สีเขียว)
3. เปิด `https://line-it-bot-production.up.railway.app/` ต้องเห็น "Line IT Support Bot is running"

---

## 14. ความปลอดภัย

- ✅ Verify Line signature ทุก request
- ✅ Duplicate Event Prevention (TTL 5 นาที)
- ✅ User Processing Lock (ป้องกัน process ซ้อนกัน)
- ✅ API Keys เก็บใน Environment Variables (ไม่ hardcode)
- ✅ `.env` อยู่ใน `.gitignore`
- ✅ ไม่แนะนำคำสั่งที่เป็นอันตรายต่อระบบ (ตาม System Prompt)

---

## 15. Roadmap

| Phase | Feature | สถานะ |
|---|---|---|
| 1 | Webhook + Express + Echo bot | ✅ Done |
| 2 | Claude AI + IT Support prompt | ✅ Done |
| 3 | Conversation history (in-memory) | ✅ Done |
| 4 | Deploy บน Railway | ✅ Done |
| 5 | RAG — Knowledge Base จาก Word/PDF | ✅ Done |
| 6 | ตอบเฉพาะ chat ส่วนตัว ไม่ตอบในกลุ่ม | ✅ Done |
| 7 | Duplicate Event Prevention | ✅ Done |
| 8 | Claude JSON Response + Smart Routing | ✅ Done |
| 9 | Line OA Keyword Filter | ✅ Done |
| 10 | Direct IT Staff Routing (13 categories) | ✅ Done |
| 11 | Persistent history (Redis/DB) | 🔲 Todo |
| 12 | Rich Menu บน Line OA | 🔲 Todo |
| 13 | Admin dashboard / log viewer | 🔲 Todo |
