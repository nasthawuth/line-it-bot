/**
 * scripts/ingest.js
 * แปลงไฟล์ Word/PDF ใน docs/ → knowledge_base.json
 * รันครั้งเดียวตอนเพิ่ม/อัพเดทเอกสาร: node scripts/ingest.js
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const DOCS_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(__dirname, '../knowledge_base.json');
const CHUNK_SIZE = 500;      // ตัวอักษรต่อ chunk
const CHUNK_OVERLAP = 100;   // overlap ระหว่าง chunk

// แบ่งข้อความเป็น chunks
const splitIntoChunks = (text, filename) => {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = start + CHUNK_SIZE;
        const chunk = text.slice(start, end).trim();

        if (chunk.length > 50) { // กรอง chunk สั้นเกินไป
            chunks.push({
                id: `${filename}_${chunks.length}`,
                source: filename,
                text: chunk,
            });
        }
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
};

// อ่านไฟล์ .docx
const extractWord = async (filePath) => {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
};

// อ่านไฟล์ .pdf
const extractPdf = async (filePath) => {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return result.text;
};

// main
const ingest = async () => {
    if (!fs.existsSync(DOCS_DIR)) {
        console.log('ไม่พบโฟลเดอร์ docs/ กรุณาสร้างและวางไฟล์ก่อน');
        return;
    }

    const files = fs.readdirSync(DOCS_DIR);
    const supportedFiles = files.filter(f =>
        f.endsWith('.docx') || f.endsWith('.pdf')
    );

    if (supportedFiles.length === 0) {
        console.log('ไม่พบไฟล์ .docx หรือ .pdf ใน docs/');
        return;
    }

    console.log(`พบไฟล์ ${supportedFiles.length} ไฟล์ กำลังประมวลผล...`);

    const allChunks = [];

    for (const file of supportedFiles) {
        const filePath = path.join(DOCS_DIR, file);
        console.log(`  → อ่าน: ${file}`);

        try {
            let text = '';
            if (file.endsWith('.docx')) {
                text = await extractWord(filePath);
            } else if (file.endsWith('.pdf')) {
                text = await extractPdf(filePath);
            }

            // ทำความสะอาดข้อความ
            text = text.replace(/\s+/g, ' ').trim();

            const chunks = splitIntoChunks(text, file);
            allChunks.push(...chunks);
            console.log(`     สร้าง ${chunks.length} chunks`);
        } catch (err) {
            console.error(`     ERROR: ${err.message}`);
        }
    }

    // บันทึก JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        created_at: new Date().toISOString(),
        total_chunks: allChunks.length,
        chunks: allChunks,
    }, null, 2));

    console.log(`\nเสร็จแล้ว! บันทึก ${allChunks.length} chunks → knowledge_base.json`);
};

ingest();
