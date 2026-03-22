/**
 * Direct mapping: Claude category → IT เจ้าของ
 * แก้ไขตรงนี้เมื่อต้องการเปลี่ยนผู้รับผิดชอบ
 */
const CATEGORY_ROUTING = {
    'network':     { name: 'คุณเดชาพล (DC)',     line_user_id: 'U5f0d6d984b5cc8a3266c7068b818f694' },
    'server':      { name: 'คุณพินิต',            line_user_id: 'Ue6dfb633d5624e4a095100e5ae343f67' },
    'hardware':    { name: 'คุณสุวัฒน์',          line_user_id: 'U69d43423b5fba3af4004747b18e2598b' },
    'software':    { name: 'คุณเดชาพล (DC)',     line_user_id: 'U5f0d6d984b5cc8a3266c7068b818f694' },
    'email':       { name: 'คุณปรมา',             line_user_id: 'Ub2f49f1fb2a6845ba77ea4a5bc0bc10e' },
    'sap_b1':      { name: 'คุณเดวิทย์ (เดย์)',  line_user_id: 'U827d51be3e76c151d11fb57dc2e854ea' },
    'sap_po':      { name: 'คุณจรินทร์ (นุ๊ก)',  line_user_id: 'U9b1c3618acc55af01b7db5da15eb3b6d' },
    'sap_fi':      { name: 'คุณอภิวัฒน์',         line_user_id: 'U0500cbb103b911443a63eebb5c7899c8' },
    'eunite':      { name: 'คุณโศภิศว์',          line_user_id: 'Uf7aa58bb00d50e6259db2b4a500128ff' },
    'tms':         { name: 'คุณศิวพร (ตั้ม)',     line_user_id: 'U9e5e30eb611574c4058971cae389eebe' },
    'itmis':       { name: 'คุณเพ็ญนภา',          line_user_id: 'U73acb409599ab6c5b09d0fe4bcc808d0' },
    'fleetcard':   { name: 'คุณวนิดา (อาย)',      line_user_id: 'U8eaf5289a72713fb376c60e42f5f0988' },
    'application': { name: 'คุณจรินทร์ (นุ๊ก)',  line_user_id: 'U9b1c3618acc55af01b7db5da15eb3b6d' },
};

/**
 * หาเจ้าหน้าที่ IT ที่รับผิดชอบ category นั้น
 * @param {string} category - category จาก Claude
 * @returns {{ name: string, line_user_id: string }|null}
 */
function findITOwner(category) {
    if (!category || category === 'unknown') return null;
    return CATEGORY_ROUTING[category.toLowerCase()] || null;
}

module.exports = { findITOwner };
