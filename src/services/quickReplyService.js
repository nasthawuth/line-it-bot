/**
 * Keyword ที่ Line OA จัดการ Auto-reply ไว้แล้ว
 * Bot จะ skip ไม่ส่งไป Claude เพื่อป้องกันตอบซ้ำ
 *
 * วิธีเพิ่ม/ลด keyword: แก้ไข KEYWORDS_HANDLED_BY_LINE_OA
 */
// เก็บเป็น lowercase ทั้งหมด เพื่อให้เช็คแบบ case-insensitive
const KEYWORDS_HANDLED_BY_LINE_OA = new Set([
    'it', 'memberit', 'itsc', 'itnfc',
    '1', '3', '4', '5', '6', '7', '8',
    'vpn', 'link',
    'webmail', 'webmail2',
    'setup email', 'mailphone', 'mailsetup',
    'fleetcard', 'servicelog', 'expiredoc', 'account',
    'fi', 'co', 'fico', 'fi/co', 'wbs', 'll',
    'shipment', 'sd', 'sap/sd',
    'teamsapb1', 'mm', 'teammm',
    'ememo', 'teamintranet',
    'stock', 'gr/gi',
    'teampowerbi', 'supportpowerbi',
    'supporteunit', 'teameeunit', 'eunit',
    'คู่มือ', 'manual',
]);

/**
 * ตรวจสอบว่า message นี้ Line OA จัดการแล้วหรือยัง
 * @param {string} text
 * @returns {boolean}
 */
function isHandledByLineOA(text) {
    if (!text) return false;
    // lowercase ก่อนเช็ค ให้ case-insensitive
    return KEYWORDS_HANDLED_BY_LINE_OA.has(text.trim().toLowerCase());
}

module.exports = { isHandledByLineOA };
