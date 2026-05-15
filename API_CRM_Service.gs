// 這個函式專門負責抓取「客戶追蹤表」的資料
function getCrmDataForWeb() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("客戶追蹤表"); 
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
// 核心函式：接收網頁傳來的資料並寫入試算表
function updateCrmRow(uid, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("客戶追蹤表");
  var data = sheet.getDataRange().getValues();
  var updateObj = JSON.parse(updates); 
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][10] == uid) { // 比對 K 欄的 UID
      if (updateObj.status) sheet.getRange(i + 1, 3).setValue(updateObj.status); // 更新 C 欄
      if (updateObj.task) sheet.getRange(i + 1, 5).setValue(updateObj.task);     // 更新 E 欄
      if (updateObj.note) sheet.getRange(i + 1, 8).setValue(updateObj.note);     // 更新 H 欄
      
      sheet.getRange(i + 1, 6).setValue(new Date()); // 更新最後變動時間
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success: false}));
}
