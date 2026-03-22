/**
 * Keyword ที่ Line OA จัดการ Auto-reply ไว้แล้ว
 * Bot จะ skip ไม่ส่งไป Claude เพื่อป้องกันตอบซ้ำ
 *
 * วิธีเพิ่ม/ลด keyword: แก้ไข KEYWORDS_HANDLED_BY_LINE_OA
 */
const KEYWORDS_HANDLED_BY_LINE_OA = new Set([
    'IT', 'MemberIT', 'ITSC', 'ITNFC',
    '1', '3', '4', '5', '6', '7', '8',
    'vpn', 'link', 'Link',
    'webmail', 'webmail2',
    'setup email', 'mailphone', 'mailsetup',
    'fleetcard', 'servicelog', 'expiredoc', 'account',
    'fi', 'co', 'fico', 'fi/co', 'wbs', 'll',
    'shipment', 'SD', 'SAP/SD',
    'TeamSapB1', 'MM', 'TeamMM',
    'eMemo', 'teamintranet',
    'stock', 'GR/GI',
    'TeamPowerBI', 'supportPowerbi',
    'SupportEunit', 'teameeunit', 'eunit',
    'คู่มื', 'manual',
]);

/**
 * ตรวจสอบว่า message นี้ Line OA จัดการแล้วหรือยัง
 * @param {string} text
 * @returns {boolean}
 */
function isHandledByLineOA(text) {
    if (!text) return false;
    const trimmed = text.trim();
    // เช็คแบบ case-sensitive ตามที่ Line OA กำหนด
    return KEYWORDS_HANDLED_BY_LINE_OA.has(trimmed);
}

module.exports = { isHandledByLineOA };
