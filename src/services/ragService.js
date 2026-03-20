/**
 * ragService.js
 * โหลด knowledge_base.json และค้นหา chunks ที่เกี่ยวข้องกับคำถาม
 */

const fs = require('fs');
const path = require('path');
const natural = require('natural');

const KB_FILE = path.join(__dirname, '../../knowledge_base.json');
const TOP_K = 3; // จำนวน chunks ที่ส่งให้ Claude

let chunks = [];
const tfidf = new natural.TfIdf();
let isLoaded = false;

// โหลด knowledge base ตอน startup
const loadKnowledgeBase = () => {
  if (!fs.existsSync(KB_FILE)) {
    console.log('[RAG] ไม่พบ knowledge_base.json — bot จะตอบจาก AI อย่างเดียว');
    return;
  }

  const data = JSON.parse(fs.readFileSync(KB_FILE, 'utf-8'));
  chunks = data.chunks;

  // เพิ่มทุก chunk เข้า TF-IDF index
  chunks.forEach(chunk => tfidf.addDocument(chunk.text));

  isLoaded = true;
  console.log(`[RAG] โหลด knowledge base สำเร็จ — ${chunks.length} chunks จาก ${data.created_at}`);
};

// ค้นหา chunks ที่เกี่ยวข้องกับคำถาม
const retrieveContext = (query) => {
  if (!isLoaded || chunks.length === 0) return null;

  // คำนวณ TF-IDF score ของแต่ละ chunk
  const scores = [];
  tfidf.tfidfs(query, (i, measure) => {
    scores.push({ index: i, score: measure });
  });

  // เรียงตาม score สูงสุด แล้วเอา TOP_K
  const topChunks = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .filter(item => item.score > 0)
    .map(item => chunks[item.index]);

  if (topChunks.length === 0) return null;

  // รวม context พร้อมระบุแหล่งที่มา
  const context = topChunks
    .map(chunk => `[${chunk.source}]\n${chunk.text}`)
    .join('\n\n---\n\n');

  return context;
};

module.exports = { loadKnowledgeBase, retrieveContext };
