const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.pdf'));

(async () => {
    for (const file of files) {
        const buffer = fs.readFileSync(path.join(DOCS_DIR, file));
        const result = await pdfParse(buffer);
        console.log(`\nไฟล์: ${file}`);
        console.log(`จำนวนหน้า: ${result.numpages}`);
        console.log(`ความยาว text: ${result.text.length} ตัวอักษร`);
        console.log(`ตัวอย่าง text 300 ตัวแรก:\n"${result.text.slice(0, 300)}"`);
    }
})();
