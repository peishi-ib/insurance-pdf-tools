/**
 * Put this function in the Apps Script backend.
 * It matches the CRM editor in gas-crm-upgrade.html.
 */
function updateCrmRow(uid, patch) {
  if (!uid) throw new Error('缺少 UID，無法更新客戶紀錄。');
  if (!patch || typeof patch !== 'object') throw new Error('缺少更新內容。');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('客戶追蹤表');
  if (!sheet) throw new Error('找不到工作表：客戶追蹤表');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw new Error('客戶追蹤表沒有資料。');

  const headers = values[0].map(String);
  const uidCol = headers.indexOf('(K) UID');
  if (uidCol < 0) throw new Error('找不到欄位：(K) UID');

  const rowIndex = values.findIndex(function(row, index) {
    return index > 0 && String(row[uidCol]) === String(uid);
  });
  if (rowIndex < 0) throw new Error('找不到 UID：' + uid);

  Object.keys(patch).forEach(function(header) {
    const colIndex = headers.indexOf(header);
    if (colIndex < 0) return;
    sheet.getRange(rowIndex + 1, colIndex + 1).setValue(patch[header]);
  });

  const updatedCol = headers.indexOf('(F) 最後變動日');
  if (updatedCol >= 0 && !Object.prototype.hasOwnProperty.call(patch, '(F) 最後變動日')) {
    sheet.getRange(rowIndex + 1, updatedCol + 1).setValue(new Date());
  }

  return {
    ok: true,
    uid: uid,
    row: rowIndex + 1
  };
}