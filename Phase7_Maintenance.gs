/**
 * 🛠️ 皇家系統維護中心 (Maintenance Center)
 * 
 * 功能：系統備份、環境健康檢查、LINE 異常通知。
 */

const BACKUP_FOLDER_ID = "1lHqJztl19orrw3sBaUm5Zs7-OoNpO29K"; // 請確認此資料夾 ID 是否正確 (預設使用授權書資料夾)

/** 📦 系統快照備份 (SystemBackup) */
function SystemBackup() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
    const timeStamp = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd_HHmm");
    const fileName = `【系統備份】佩璽CRM_${timeStamp}`;
    
    // 執行備份
    const backupFile = DriveApp.getFileById(ss.getId()).makeCopy(fileName, folder);
    
    console.log("✅ 備份成功: " + backupFile.getName());
    return backupFile.getUrl();
  } catch (e) {
    sendErrorNotification("🚨 系統備份失敗！原因：" + e.message);
  }
}

/** 🔍 環境健康檢查 (ValidateSystemShelves) */
function ValidateSystemShelves() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const essentialLocalSheets = [
    "客戶追蹤表", 
    "_DB_CACHE_", 
    "_SET_DNA_", 
    "大人工作區", 
    "小孩工作區"
  ];
  
  let missingSheets = [];
  essentialLocalSheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      missingSheets.push(name);
    }
  });

  if (missingSheets.length > 0) {
    const msg = `⚠️ 皇家預警：偵測到必要分頁遺失！\n\n遺失項目：\n- ${missingSheets.join("\n- ")}\n\n請立即檢查試算表架構。`;
    sendErrorNotification(msg);
    return false;
  }
  
  console.log("✅ 環境健康檢查通過");
  return true;
}

/** 📢 異常通知傳送門 (LINE Push) */
function sendErrorNotification(message) {
  // 使用 Phase 2 定義的推送函數與 ID
  const myLineId = "Ub6ffd52fae413d0fa543737dbe5af5d3"; 
  try {
    // 確保有引入 pushLineMessage，若無則改用基本 UrlFetch
    const token = "fEuwXrO3oYhJCiAaGpwSoWgdOP17abWf3odv2ekDsQC+WMVQOPWt8oGwNLqqczRTbHCVhJdxBEi9yMlHDXrEnIaHQCaIWYpl/9afYAwhQ23C7t1WGVZTlEpp2WXRk5lZGmiZlBq58q1YFWcmRKDCvQdB04t89/1O/w1cDnyilFU=";
    const url = 'https://api.line.me/v2/bot/message/push';
    const payload = {
      'to': myLineId,
      'messages': [{ 'type': 'text', 'text': message }]
    };
    UrlFetchApp.fetch(url, {
      'method': 'post',
      'headers': { 'Authorization': 'Bearer ' + token },
      'contentType': 'application/json',
      'payload': JSON.stringify(payload)
    });
  } catch (e) {
    console.error("通知發送失敗:", e);
  }
}

/** ⏰ 排程器設定 (手動執行一次即可) */
function setupMaintenanceTriggers() {
  // 1. 刪除舊觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'SystemBackup' || t.getHandlerFunction() === 'ValidateSystemShelves') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 2. 設定每日凌晨 3:00~4:00 備份
  ScriptApp.newTrigger('SystemBackup')
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .inTimezone("GMT+8")
    .create();

  // 3. 設定每 6 小時檢查一次環境
  ScriptApp.newTrigger('ValidateSystemShelves')
    .timeBased()
    .everyHours(6)
    .create();
    
  SpreadsheetApp.getActiveSpreadsheet().toast("✅ 系統備份與驗證排程已建立 (每日 03:00 備份)", "🚀 維護啟動");
}
