const itStaffData = require('../../it_staff.json');

// mapping จาก category ของ Claude → keywords ที่ใช้ค้นใน it_staff.json
const categoryKeywords = {
    'network':     ['network', 'wifi', 'vpn', 'internet'],
    'server':      ['server', 'database', 'backup'],
    'hardware':    ['hardware', 'printer', 'computer', 'scanner'],
    'software':    ['software', 'license', 'os', 'anti virus'],
    'application': ['application', 'sap', 'eunite', 'ememo', 'pr/po', 'expense'],
    'itmis':       ['itmis', 'tms', 'tug request', 'evaluate', 'pms', 'billing'],
};

/**
 * หาเจ้าหน้าที่ IT ที่รับผิดชอบ category นั้น
 * @param {string} category - claude category
 * @returns {object|null} - staff object หรือ null ถ้าไม่พบ
 */
function findITOwner(category) {
    if (!category || category === 'unknown') return null;

    const keywords = categoryKeywords[category.toLowerCase()] || [category.toLowerCase()];

    const owner = itStaffData.it_staff.find(staff =>
        staff.is_active &&
        staff.category.some(cat =>
            keywords.some(kw => cat.toLowerCase().includes(kw))
        )
    );

    return owner || null;
}

module.exports = { findITOwner };
