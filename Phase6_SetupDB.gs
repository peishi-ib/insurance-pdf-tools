/** 🏆 皇家旗艦整合引擎 V18.9 - 報告 + 精算雙引擎【數據大補完版】 🏆 */

// 🚀 自動載入選單
// 🚀 舊版選單已移至 Phase6_Triggers.gs 統一管理

// --- 🛡️ 輔助工具區 ---
function cleanValue(val) { 
  if (!val) return 0; 
  if (typeof val === 'number') return val;
  const num = String(val).replace(/[^0-9.]/g, ""); 
  let n = num ? parseFloat(num) : 0;
  // 智能處理：如果使用者打「30萬」，cleanValue 會拿到 30，後續邏輯會知道是單位
  return n;
}
function fmtDate(dateVal) { if (!dateVal) return ""; try { return Utilities.formatDate(new Date(dateVal), "GMT+8", "yyyy/MM/dd"); } catch(e) { return String(dateVal); } }
function fmtNum(num) { return Number(num || 0).toLocaleString(); }
function getCoverMonth() { const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]; const now = new Date(); return monthNames[now.getMonth()] + ", " + now.getFullYear(); }

function showReportLink(url, filename) {
  const html = `<div style="font-family:sans-serif;text-align:center;padding:20px;background:#f5f7fa;border-radius:10px;">
    <h2 style="color:#2c3e50;">✨ 報告產出完成！</h2><p style="color:#576574;font-weight:bold;">${filename}</p>
    <div style="margin-top:10px;"><a href="${url}" target="_blank" style="background-color:#3498db;color:white;padding:15px 35px;text-decoration:none;border-radius:50px;font-weight:bold;display:inline-block;">🚀 立即開啟簡報</a></div>
  </div>`;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(450).setHeight(250), '👑 皇家特助｜報告派送中');
}

function parsePriorityRank(rankText) {
  const text = String(rankText || "");
  const result = { medical: "", disease: "", accident: "", adult_resp: "" };
  const parts = text.split(/[>\uff1e]+/).map(p => p.trim());
  parts.forEach((p, idx) => {
    const r = idx + 1;
    if (p.includes("醫療") || p.includes("住院")) result.medical = r;
    if (p.includes("重疾") || p.includes("重大") || p.includes("癌症") || p.includes("重病")) result.disease = r;
    if (p.includes("意外") || p.includes("失能")) result.accident = r;
    if (p.includes("責任") || p.includes("貸款")) result.adult_resp = r;
  });
  return result;
}

function calculateInsuranceAge(birthDate) {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  let m = now.getMonth() - birthDate.getMonth();
  if (now.getDate() < birthDate.getDate()) m--;
  let totalMonths = age * 12 + m;
  let finalAge = Math.floor(totalMonths / 12);
  if (totalMonths % 12 >= 6) finalAge += 1;
  const base = new Date(birthDate); base.setFullYear(now.getFullYear()); base.setMonth(birthDate.getMonth() + 6);
  if (base < now) base.setFullYear(now.getFullYear() + 1);
  return { age: finalAge, daysToNextAge: Math.ceil((base - now)/(1000*60*60*24)) };
}

// ==========================================
// 💼 大人/小孩載入邏輯
// ==========================================

function initAdultWorksheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = SHEET_ADULT_WORKSPACE; 
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  else sheet.getRange("A1:D41").clearContent().clearFormat();
  sheet.setColumnWidth(2, 130); sheet.setColumnWidth(3, 185); sheet.setColumnWidth(4, 220);
  const sty = (r, c) => { r.setBackground(c).setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center"); };
  sheet.getRange("B2:D2").merge().setValue("🏆 吳佩璽保險經紀人｜大人風險評估工作區").setBackground("#34495e").setFontColor("white").setFontWeight("bold");
  sheet.getRange("B3").setValue("目前處理客戶：").setFontWeight("bold");
  sheet.getRange("B4").setValue("保險年齡：").setFontWeight("bold");
  sheet.getRange("B5:D5").merge().setValue("【醫療住院需求】需求評估");
  sty(sheet.getRange("B5:D5"), "#2c3e50");
  sheet.getRange("B6:D13").setValues([["優先順序", "", ""], ["期望醫院", "", ""], ["房型", "", ""], ["病房費/日", "請填入差額", 3000], ["看護費/日", "", "=IFERROR(IFS(REGEXMATCH(C10, \"全日\"), 2500, REGEXMATCH(C10, \"半日\"), 1500, TRUE, 0), 0)"], ["薪資補償/日", "", ""], ["住院小計", "", "=SUM(D9:D11)"], ["住院雜費額度", "", ""]]);
  sheet.getRange("B15:D15").merge().setValue("【重病失能需求】需求評估");
  sty(sheet.getRange("B15:D15"), "#8e44ad");
  sheet.getRange("B16:D22").setValues([["優先順序", "", ""], ["重大傷病額度", "", ""], ["癌症加強需求", "", ""], ["失能長照月付", "", ""], ["交通工具", "", ""], ["職業等級", "", ""], ["建議意外險總額", "", "=IFS(C21=\"3\", 500, C21=\"2\", 300, TRUE, 200)"]]);
  sheet.getRange("B24:D24").merge().setValue("【責任照顧需求】需求評估");
  sty(sheet.getRange("B24:D24"), "#d35400");
  sheet.getRange("B25:D34").setValues([
    ["優先順序", "", ""], 
    ["貸款餘額", "", ""], 
    ["扶養說明", "手動/自動", ""], 
    ["子1歲數", "手動填寫", 22], 
    ["子2歲數", "手動填寫", 22], 
    ["子女教育金合計", "", "=IFERROR(500/22*(22-D28),0) + IFERROR(500/22*(22-D29),0)"], 
    ["父親歲數", "手動填寫", 76], 
    ["母親歲數", "手動填寫", 83], 
    ["父母孝養金合計", "", "=(12*(76-D31)*2) + (12*(83-D32)*2)"], 
    ["責任總計", "", "=SUM(D26, D30, D33)"]
  ]);
  sheet.getRange("B36:D36").merge().setValue("【基本資料】");
  sty(sheet.getRange("B36:D36"), "#7f8c8d");
  sheet.getRange("B37:D41").setValues([["每月預算", "", ""], ["性別", "", ""], ["生日", "", ""], ["LINE ID", "", ""], ["補充說明", "", ""]]);
  sheet.getRange("C3:D41").setHorizontalAlignment("left");
  ["C3", "D9", "D28", "D29", "D31", "D32"].forEach(c => sheet.getRange(c).setBackground("#FFF2CC"));
  _initActuarialSection(sheet);
}

function loadSelectedAdultToWorksheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName(SHEET_ADULT_INTAKE);
  const target = ss.getSheetByName(SHEET_ADULT_WORKSPACE);
  const row = source.getActiveRange().getRow();
  if (row < 2) return Browser.msgBox("⚠️ 請選資料。");
  const data = source.getRange(row, 1, 1, 24).getValues()[0];
  const ranks = parsePriorityRank(data[6]);
  const ageObj = calculateInsuranceAge(new Date(data[3]));
  target.getRange("C3").setValue(data[1]);
  target.getRange("C4").setValue(ageObj.age + " 歲");
  target.getRange("D6").setValue(ranks.medical);
  target.getRange("C7").setValue(data[9] || "無特定");
  target.getRange("C8").setValue(data[10] || "普通");
  target.getRange("C10").setValue(data[11]);
  target.getRange("D11").setValue(cleanValue(data[12]));
  target.getRange("D13").setValue(data[13]);
  target.getRange("D16").setValue(ranks.disease);
  target.getRange("D17").setValue(cleanValue(data[14]));
  target.getRange("C18").setValue(data[15]);
  target.getRange("D19").setValue(cleanValue(data[18])); // 失能長照月付 (精確對位)
  target.getRange("C20").setValue(data[17]);             // 交通工具說明 (精確對位)
  target.getRange("C21").setValue(1); 
  target.getRange("D25").setValue(ranks.adult_resp);
  target.getRange("D26").setValue(cleanValue(data[20]));
  target.getRange("C27").setValue(data[19]);             // 扶養說明
  // ⛔ 已停止自動擷取歲數，避免誤入
  target.getRange("D37").setValue(data[5]);
  target.getRange("C38").setValue(data[2]);
  target.getRange("C39").setValue(fmtDate(data[3]));
  target.getRange("C40").setValue(data[4]); 
  _initActuarialSection(target); // 使用 init 而非 reset 以重建按鈕
  target.activate();
}

function initChildWorksheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = SHEET_CHILD_WORKSPACE;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  else sheet.getRange("A1:D41").clearContent().clearFormat();
  sheet.setColumnWidth(2, 130); sheet.setColumnWidth(3, 400); sheet.setColumnWidth(4, 150); 
  const sty = (r, c) => { r.setBackground(c).setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center"); };

  sheet.getRange("B2:D2").merge().setValue("👑 旗艦系統｜小孩風險評估工作區").setBackground("#2980b9").setFontColor("white").setFontWeight("bold");
  sheet.getRange("B3").setValue("目前處理父母：").setFontWeight("bold");
  sheet.getRange("B4").setValue("目前處理寶寶：").setFontWeight("bold");
  sheet.getRange("C3:C4").setBackground("#FFF2CC");

  sheet.getRange("B6:D6").merge().setValue("【重大傷病需求】");
  sty(sheet.getRange("B6:D6"), "#34495e");
  sheet.getRange("B7:D9").setValues([["優先順序", "", ""], ["重大傷病總額", "", ""], ["加強防癌金", "", ""]]);

  sheet.getRange("B11:D11").merge().setValue("【意外失能與燒燙傷需求】");
  sty(sheet.getRange("B11:D11"), "#f39c12");
  sheet.getRange("B12:D14").setValues([["優先順序", "", ""], ["意外失能給付", "", ""], ["燒燙傷增額", "", ""]]);

  sheet.getRange("B16:D16").merge().setValue("【醫療住院需求】");
  sty(sheet.getRange("B16:D16"), "#27ae60");
  sheet.getRange("B17:D23").setValues([
    ["優先順序", "", ""], ["期望醫院", "", ""], ["房型", "", ""],
    ["病房費差額", "手動填寫", 3000], ["薪資補償/日", "父母照顧補償", ""],
    ["病房費合計", "", "=D20+D21"], ["住院雜費額度", "", ""]
  ]);

  sheet.getRange("B25:D25").merge().setValue("【基本資料】");
  sty(sheet.getRange("B25:D25"), "#7f8c8d");
  sheet.getRange("B26:D31").setValues([
    ["每月預算", "", ""], ["性別", "", ""], ["生日/預產期", "", ""],
    ["父母健診意願", "", ""], ["重視的事情", "", ""], ["補充說明", "", ""]
  ]);

  const yellowCells = ["C3", "C4", "D20"];
  yellowCells.forEach(cell => sheet.getRange(cell).setBackground("#FFF2CC"));
  _initActuarialSection(sheet);
}

function loadSelectedChildToWorksheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName(SHEET_CHILD_INTAKE);
  const ws = ss.getSheetByName(SHEET_CHILD_WORKSPACE);
  const currentRow = source.getActiveRange().getRow();
  if (currentRow < 2) { Browser.msgBox("⚠️ 請選取寶寶資料列。"); return; }
  
  const rowData = source.getRange(currentRow, 1, 1, 23).getValues()[0];
  const rawRankStr = String(rowData[8]); 
  const rankList = rawRankStr.split(/[>\uff1e]+/).map(item => item.trim());
  const getRank = (key) => {
    for (let i = 0; i < rankList.length; i++) {
        if (rankList[i].includes(key)) { return i + 1; }
    }
    return "";
  };

  ws.getRange("C3").setValue(rowData[1]); // 填表人 (父母)
  ws.getRange("C4").setValue(rowData[2]); // 寶寶暱稱
  ws.getRange("D7").setValue(getRank("重疾"));
  ws.getRange("D8").setValue(rowData[16]);
  ws.getRange("D9").setValue(rowData[17]);
  ws.getRange("D12").setValue(getRank("失能"));
  ws.getRange("D13").setValue(rowData[18]);
  ws.getRange("D14").setValue(rowData[19]);
  ws.getRange("D17").setValue(getRank("醫療"));
  ws.getRange("C18").setValue(rowData[11]);
  ws.getRange("C19").setValue(rowData[12]);
  ws.getRange("D21").setValue(cleanValue(rowData[14]));
  ws.getRange("D23").setValue(rowData[15]);
  ws.getRange("D26").setValue(rowData[7]);
  ws.getRange("C27").setValue(rowData[3]);
  ws.getRange("C28").setValue(fmtDate(rowData[4]));
  ws.getRange("C29").setValue(rowData[9]); // 健診
  ws.getRange("C30").setValue(rowData[10]); // 重視
  ws.getRange("C31").setValue(rowData[20]); // 補充
  
  // 啟動精算初始化 (保留 V18.9 特性)
  const ageObj = calculateInsuranceAge(new Date(rowData[4]));
  _resetActuarialSection(ws, rowData[3] || "男", ageObj.age, 1);
  
  ws.activate();
  Browser.msgBox(`✅ 客戶「${rowData[2]}」載入成功！`);
}

// ==========================================
// ⚙️ 精算引擎核心快取與初始化
// ==========================================

function _initActuarialSection(sheet) {
  const r = 43; // 標題鎖定在 43
  
  // 🧹 結構保護：從 Row 42 開始操作，不碰 Row 41
  sheet.getRange("42:43").clear().clearDataValidations().setFontWeight("normal").setBackground(null);
  
  // Row 42: 總計/套組/報表工具列
  sheet.getRange(r - 1, 1).setValue("💰 總保費：").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange(r - 1, 2).setFormula('=SUMIFS(J44:J100, A44:A100, TRUE)').setFontWeight("bold").setFontColor("#e74c3c").setFontSize(14).setNumberFormat("#,##0元");
  
  sheet.getRange(r - 1, 3).setValue("📦 載入套組：").setFontWeight("bold").setHorizontalAlignment("right");
  const sets = getAvailableSets_();
  if (sets.length > 0) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(sets, true).build();
    sheet.getRange(r - 1, 4).setDataValidation(rule).setBackground("#fff3e0").setBorder(true, true, true, true, null, null);
  }
  
  sheet.getRange(r - 1, 6, 1, 2).merge().setValue("🎨 產生視覺化報告").setFontWeight("bold").setBackground("#8BC220").setFontColor("white").setHorizontalAlignment("center").setBorder(true, true, true, true, null, null);
  
  // Row 43: 藍色標題列 (確保 B43 是文字「保險公司」不是選單)
  const h = ["勾選", "保險公司", "商品分類", "商品名稱", "年期", "保額/計畫別", "性別", "保險年齡", "職級", "年繳保費", "給付摘要"];
  sheet.getRange(r, 1, 1, h.length).setValues([h]).setFontWeight("bold").setBackground("#2DB7F5").setFontColor("white").setBorder(true, true, true, true, null, null);
  
  // Row 44+: 精算區
  sheet.getRange(r + 1, 1, 100, h.length).clearContent().clearDataValidations();
  sheet.getRange(r + 1, 1, 50, 1).insertCheckboxes();
  setupCompanyDropdown(sheet, r + 1);
}

/** 🛡️ 輔助：抓取可用套組清單 */
function getAvailableSets_() {
  setupSetDNA_(); // 確保分頁存在
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setSheet = ss.getSheetByName("_SET_DNA_");
  if (!setSheet) return ["(暫無組合)"];
  const data = setSheet.getRange(2, 1, setSheet.getLastRow()-1, 1).getValues();
  return [...new Set(data.map(r => r[0]))].filter(s => s);
}

/** 📦 初始化套組資料庫 */
function setupSetDNA_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let setSheet = ss.getSheetByName("_SET_DNA_");
  if (!setSheet) {
    setSheet = ss.insertSheet("_SET_DNA_");
    const headers = ["套組名稱", "保險公司", "分類", "商品名稱", "年期", "保額/計畫"];
    setSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f39c12").setFontColor("white");
    // 建立範例組合：全球全餐 (小孩版)
    const samples = [
      ["全球全餐", "全球人壽", "重大傷病", "DCE．醫卡讚85重大傷病定期健康保險", "30年期", "20萬"],
      ["全球全餐", "全球人壽", "重大傷病", "XDE．醫卡讚重大傷病一年期健康保險附約", "1年期", "80萬"],
      ["全球全餐", "全球人壽", "醫療實支", "XHD．實分鑫安醫療費用健康保險附約", "1年期", "2"],
      ["全球全餐", "全球人壽", "醫療自負額", "XHO．全心全意自負額醫療費用健康保險附約", "1年期", "3A"],
      ["全球全餐(小孩)", "全球人壽", "意外日額", "XAH．個人傷害住院日額保險給付附加條款", "1年期", "1000元"],
      ["全球全餐(小孩)", "全球人壽", "意外醫療", "XMBN．新傷害醫療保險附約", "1年期", "3萬"],
      // 建立範例組合：全球全餐 (大人版)
      ["全球全餐(大人)", "全球人壽", "重大傷病", "DCE．醫卡讚85重大傷病定期健康保險", "20年期", "10萬"],
      ["全球全餐(大人)", "全球人壽", "重大傷病", "XDE．醫卡讚重大傷病一年期健康保險附約", "1年期", "100萬"],
      ["全球全餐(大人)", "全球人壽", "醫療實支", "XHB．實在醫靠醫療費用健康保險附約", "1年期", "計畫二"],
      ["全球全餐(大人)", "全球人壽", "醫療自負額", "XHO．全心全意自負額醫療費用健康保險附約", "1年期", "3A"],
      ["全球全餐(大人)", "全球人壽", "意外增額", "XAH．個人傷害住院日額保險給付附加條款", "1年期", "1000元"],
      ["全球全餐(大人)", "全球人壽", "意外醫療", "XMBN．新傷害醫療保險附約", "1年期", "3萬"]
    ];
    setSheet.getRange(2, 1, samples.length, samples[0].length).setValues(samples);
  }
}

/** 🛠️ 手動工具：修復損壞的工作區佈局 */
function manualResetWorkspace() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sName = sheet.getName();
  if (sName !== "大人工作區" && sName !== "小孩工作區") {
    return SpreadsheetApp.getUi().alert("❌ 請在「大人工作區」或「小孩工作區」執行此操作。");
  }
  const confirm = SpreadsheetApp.getUi().alert("⚠️ 確定要重置精算區？\n這將會清除當前所有勾選與輸入的資料並恢復標準佈局。", SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (confirm === SpreadsheetApp.getUi().Button.YES) {
    _initActuarialSection(sheet);
    SpreadsheetApp.getActiveSpreadsheet().toast("✅ 工作區佈局已修復完成！", "🛠️ 皇家維修中心");
  }
}


/** 🎨 菜單入口：生成報表連結 */
function showReportLinkFromMenu() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sName = sheet.getName();
  if (sName !== "大人工作區" && sName !== "小孩工作區") {
    return SpreadsheetApp.getUi().alert("❌ 請在「大人工作區」或「小孩工作區」執行此操作。");
  }
  showReportLinkDialog_(sheet);
}

function _resetActuarialSection(sheet, gender, age, occ) {
  const r = 44; // 資料自 44 開始
  sheet.getRange(r - 2, 4).setFormula('=SUMIFS(J44:J100, A44:A100, TRUE)');
  sheet.getRange(r, 1, 100, 11).clearContent().clearDataValidations();
  sheet.getRange(r, 1, 50, 1).insertCheckboxes();
  sheet.getRange(r, 7, 50, 3).setValues(Array(50).fill([gender, age, occ]));
  setupCompanyDropdown(sheet, r);
}

function refreshLocalCache() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getUserProperties();
  const dbId = props.getProperty('PRODUCT_DB_ID');
  if (!dbId) return Browser.msgBox("❌ 尚未初始化外部資料庫。");
  const extSs = SpreadsheetApp.openById(dbId);
  
  // 1. 同步商品清單 (新增計算邏輯與門檻欄位)
  const prodData = extSs.getSheetByName("常用商品資料庫").getDataRange().getValues();
  const cache = ss.getSheetByName("_DB_CACHE_") || ss.insertSheet("_DB_CACHE_");
  cache.clear().getRange(1, 1, prodData.length, prodData[0].length).setValues(prodData);
  
  // 2. 同步費率選項
  const rateData = extSs.getSheetByName("費率資料庫").getDataRange().getValues();
  const rCache = ss.getSheetByName("_RATE_OPTIONS_") || ss.insertSheet("_RATE_OPTIONS_");
  const options = [];
  const seen = new Set();
  for (let i = 1; i < rateData.length; i++) {
    const key = rateData[i][0] + "|" + rateData[i][4] + "|" + rateData[i][1];
    if (!seen.has(key)) {
      options.push([rateData[i][0], rateData[i][4], rateData[i][1]]);
      seen.add(key);
    }
  }
  if (options.length > 0) {
    rCache.clear().getRange(1, 1, 1, 3).setValues([["ProductID", "年期", "計畫"]]);
    rCache.getRange(2, 1, options.length, 3).setValues(options);
  }
  Browser.msgBox("✅ 快取同步完成！\n已導入商品計算邏輯與費率選項。");
}

function setupCompanyDropdown(sheet, row) {
  const cache = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_DB_CACHE_");
  if (!cache || cache.getLastRow() < 2) return;
  const list = [...new Set(cache.getRange(2, 2, cache.getLastRow()-1, 1).getValues().flat().filter(c => c))];
  if (list.length) sheet.getRange(row, 2, 50, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(list, true).build());
}

/** 🗄️ 初始化外部資料庫 (導入 16 項核心商品 & 0-5 歲費率) */
function setupExternalProductDatabase() {
  const props = PropertiesService.getUserProperties();
  let dbId = props.getProperty('PRODUCT_DB_ID');
  let extSs = dbId ? SpreadsheetApp.openById(dbId) : SpreadsheetApp.create("👑 皇家商品費率庫 (外部資料庫)");
  if (!dbId) props.setProperty('PRODUCT_DB_ID', extSs.getId());
  
  // 3. 完善給付摘要定義 (新增 適用計畫 欄位)
  const benefit = extSs.getSheetByName("給付定義表") || extSs.insertSheet("給付定義表");
  if (benefit.getLastRow() <= 1) {
    benefit.getRange(1, 1, 1, 6).setValues([["ProductID", "給付指標", "數值", "單位", "內容說明", "適用計畫"]]);
    // 預填範例 (由使用者後續補完)
  } else {
    // 已有數據，僅更新標題
    benefit.getRange(1, 1, 1, 6).setValues([["ProductID", "給付指標", "數值", "單位", "內容說明", "適用計畫"]]);
  }

  // 1. 完善常用商品清單 (僅在表單全空時執行初始化，其餘時間保留使用者手動修改)
  const main = extSs.getSheetByName("常用商品資料庫") || extSs.insertSheet("常用商品資料庫");
  if (main.getLastRow() <= 1) {
    main.clear().appendRow(["ProductID", "保險公司", "分類", "商品名稱", "主附約", "計算邏輯", "最低門檻", "預設額度", "常用選項"]);
    const prods = [
      ["全球_DCE", "全球人壽", "重大傷病", "DCE．醫卡讚85重大傷病定期健康保險", "主約", "單位型", 200000, "20萬", ""],
      ["全球_XDE", "全球人壽", "重大傷病", "XDE．醫卡讚重大傷病一年期健康保險附約", "附約", "單位型", 200000, "80萬", "30萬, 50萬, 80萬, 100萬, 130萬, 180萬"],
      ["全球_XCF", "全球人壽", "防癌險", "XCF．臻心一意防癌一年期健康保險附約", "附約", "單位型", 100000, "100萬", "50萬, 150萬, 200萬"],
      ["全球_XCG", "全球人壽", "防癌險", "XCG．臻心全意防癌一年期醫療健康保險附約", "附約", "計畫型", 1, "3", "1, 2, 3"],
      ["全球_XHD", "全球人壽", "醫療實支", "XHD．實分鑫安醫療費用健康保險附約", "附約", "計畫型", 1, "1", "1, 2, 3, 4, 5"],
      ["全球_XHO", "全球人壽", "醫療自負額", "XHO．全心全意自負額醫療費用健康保險附約", "附約", "計畫型", 1, "1", "1, 2, 3"],
      ["全球_NIR", "全球人壽", "健康保險", "NIR．健康保險附約(103.05起)", "附約", "計畫型", 0, "1", ""],
      ["全球_XTK", "全球人壽", "定期壽險", "XTK．守護童心一年期定期壽險附約", "附約", "單位型", 100000, "10萬", ""],
      ["全球_XAB", "全球人壽", "意外險", "XAB．御守傷害暨兒童傷害失能保險附約", "附約", "單位型", 100000, "10萬", "10萬, 30萬, 50萬"],
      ["全球_XMBN", "全球人壽", "意外醫療", "XMBN．新傷害醫療保險附約", "附約", "計畫型", 0, "1", "1, 2"],
      ["新光_FCA", "新光人壽", "防癌險", "FCA．珍愛健康防癌終身保險(109.06.05起)", "主約", "單位型", 100000, "10萬", "10萬, 20萬"],
      ["新光_C2", "新光人壽", "防癌險", "C2．新一年期防癌健康保險附約", "附約", "單位型", 100000, "10萬", "30萬, 50萬"],
      ["新光_5DD", "新光人壽", "意外險", "5DD．骨力贏傷害暨兒童意外骨折保險附約", "附約", "計畫型", 0, "1", ""],
      ["新光_L6D", "新光人壽", "意外醫療", "L6D．新好平安傷害醫療保險金附加條款", "附約", "計畫型", 0, "1", ""],
      ["新光_R1D", "新光人壽", "意外日額", "R1D．傷害住院日額保險附約(104.2.18起)", "附約", "計畫型", 0, "1", ""],
      ["專案_快樂童年", "專案專區", "兒童專案", "新快樂童年專案", "主約", "計畫型", 0, "1", "計畫A, 計畫B"]
    ];
    main.getRange(2, 1, prods.length, prods[0].length).setValues(prods);
  } else {
    // 已有數據，僅更新標題確保與程式邏輯對齊 (新增 預設額度, 常用選項)
    main.getRange(1, 1, 1, 9).setValues([["ProductID", "保險公司", "分類", "商品名稱", "主附約", "計算邏輯", "最低門檻", "預設額度", "常用選項"]]);
  }

  // 2. 處理費率數據 (導入數據保護機制)
  const rate = extSs.getSheetByName("費率資料庫") || extSs.insertSheet("費率資料庫");
  const existingRows = rate.getLastRow();
  let msg = "✅ 商品規則已更新 (含 DCE 20 萬門檻)";
  
  if (existingRows <= 1) {
    // [初始裝機模式]: 資料庫全空，匯入 0-5 歲範例供測試
    rate.clear().appendRow(["ProductID", "保額/計畫別", "性別", "年齡", "繳費年期", "保障年期", "職級", "年繳保費", "投保類型"]);
    const rates = [];
    // DCE 費率導入 (0-5 歲)
    const dceMale20yr = [237, 241, 244, 247, 249, 252];
    const dceFemale30yr = [155, 155, 157, 160, 163, 165];
    for (let a = 0; a <= 5; a++) {
      rates.push(["全球_DCE", "每萬", "M", a, "20年期", "至85歲", 0, dceMale20yr[a]]);
      rates.push(["全球_DCE", "每萬", "F", a, "30年期", "至85歲", 1, dceFemale30yr[a]]);
    }
    // XHD 費率導入
    rates.push(["全球_XHD", "計畫一", "M", 0, "1年期", "1年期", 0, 1751]);
    rates.push(["全球_XHD", "計畫一", "F", 0, "1年期", "1年期", 1, 1519]);
    
    rate.getRange(2, 1, rates.length, 8).setValues(rates);
    msg += "\n並已為您建立 0-5 歲範例費率。";
  } else {
    // [資料保護模式]: 偵測到已有真實數據，僅更新標題與快取，不碰觸實體保費
    rate.getRange(1, 1, 1, 9).setValues([["ProductID", "保額/計畫別", "性別", "年齡", "繳費年期", "保障年期", "職級", "年繳保費", "投保類型"]]);
    msg += "\n偵測到已有費率數據，已為您安全保留原有資料。";
  }

  refreshLocalCache();
  Browser.msgBox(msg);
}


/** 🎨 產出視覺報告 (小孩版) */
function generateChildReport() {
  const templateId = '10vjJPIs7UZJxO9b0dld__lcqvaPJXY5I4_lwjYTx1dY';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("小孩工作區");
  processVisualReport_(sheet, templateId, "【小孩風險報告書】", "child");
}

/** 🎨 產出視覺報告 (大人版) */
function generateAdultReport() {
  const templateId = '1D1XGe_xfOSXa8A8zgWe65R2qvVTdRm0fdIdfU4uJZk0';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("大人工作區");
  processVisualReport_(sheet, templateId, "【成人風險報告書】", "adult");
}

/** ⚙️ 核心處理引擎：隊長核可之標準映射版本 (穩定版 - 強化格式與標籤) */
function processVisualReport_(sheet, templateId, prefix, mode) {
  if (!sheet) { Browser.msgBox("❌ 找不到工作區，請重新執行載入動作。"); return; }
  
  // 輔助格式化
  const _fNum = (val) => (val && !isNaN(val)) ? Number(val).toLocaleString() : (val || "0");
  const _fDate = (val) => { try { return Utilities.formatDate(new Date(val), "GMT+8", "yyyy/MM/dd"); } catch(e) { return val || ""; } };
  const _fMonth = () => {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const now = new Date();
    return months[now.getMonth()] + ", " + now.getFullYear();
  };

  try {
    let replacements = {
      "{{填表日期}}": Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd"),
      "{{報告月份}}": _fMonth(),
      "{{總保費}}": sheet.getRange("9:9").getValues()[0].length >= 9 ? sheet.getRange("I40").getDisplayValue() : "0"
    };

    if (mode === "adult") {
      // 💼 成人版數據映射 (根據截圖精準對齊)
      replacements["{{姓名}}"] = sheet.getRange("C3").getValue();
      replacements["{{基本_性別}}"] = sheet.getRange("C38").getValue();
      replacements["{{基本_生日}}"] = _fDate(sheet.getRange("C39").getValue());
      replacements["{{保險年齡}}"] = sheet.getRange("C4").getDisplayValue();
      replacements["{{基本_預算}}"] = _fNum(sheet.getRange("C37").getValue()) + " 元/月";
      replacements["{{基本_補充}}"] = sheet.getRange("C41").getValue();
      
      replacements["{{醫療_優先}}"] = sheet.getRange("D6").getValue();
      replacements["{{醫療_病房房型}}"] = sheet.getRange("C7").getValue() + " " + sheet.getRange("C8").getValue();
      replacements["{{醫療_病房費}}"] = "$" + _fNum(sheet.getRange("D9").getValue()) + "/日";
      replacements["{{醫療_看護費}}"] = "$" + _fNum(sheet.getRange("D10").getValue()) + "/日";
      replacements["{{醫療_薪資}}"] = "$" + _fNum(sheet.getRange("D11").getValue()) + "/日";
      replacements["{{醫療_合計}}"] = "$" + _fNum(sheet.getRange("D12").getValue()) + "/日";
      replacements["{{醫療_雜費}}"] = sheet.getRange("D13").getDisplayValue();
      
      replacements["{{重病_優先}}"] = sheet.getRange("D16").getValue();
      replacements["{{重病_重傷金額}}"] = "$" + _fNum(sheet.getRange("D17").getValue()) + "萬";
      replacements["{{重病_癌症}}"] = sheet.getRange("C18").getValue();
      replacements["{{重病_失能月給付}}"] = "$" + _fNum(sheet.getRange("D19").getValue()) + "萬/月";
      replacements["{{重病_意外總額}}"] = "建議投保 " + _fNum(sheet.getRange("D22").getValue()) + "萬";
      
      replacements["{{責任_優先}}"] = sheet.getRange("D25").getValue();
      replacements["{{責任_貸款}}"] = "$" + _fNum(sheet.getRange("D26").getValue()) + "萬";
      replacements["{{責任_子女}}"] = "$" + _fNum(sheet.getRange("D30").getValue()) + "萬";
      replacements["{{責任_扶養}}"] = "$" + _fNum(sheet.getRange("D33").getValue()) + "萬";
      replacements["{{責任_合計}}"] = "$" + _fNum(sheet.getRange("D34").getValue()) + "萬";

    } else {
      // 👶 小孩版數據映射 (穩定維持)
      replacements["{{寶寶姓名}}"] = sheet.getRange("C4").getValue();
      replacements["{{姓名}}"] = sheet.getRange("C4").getValue();
      replacements["{{父母姓名}}"] = sheet.getRange("C3").getValue();
      replacements["{{基本_性別}}"] = sheet.getRange("C27").getValue();
      replacements["{{基本_生日}}"] = _fDate(sheet.getRange("C28").getValue());
      replacements["{{基本_年齡}}"] = sheet.getRange("C29").getDisplayValue();
      replacements["{{基本_預算}}"] = _fNum(sheet.getRange("C26").getValue()) + " 元/月";
      
      replacements["{{優先_重疾}}"] = sheet.getRange("D7").getValue();
      replacements["{{優先_意外}}"] = sheet.getRange("D12").getValue();
      replacements["{{優先_醫療}}"] = sheet.getRange("D17").getValue();
      
      replacements["{{重疾_額度}}"] = "$" + _fNum(sheet.getRange("D8").getValue()) + "萬";
      replacements["{{防癌_額度}}"] = "$" + _fNum(sheet.getRange("D9").getValue()) + "萬";
      replacements["{{意外_額度}}"] = "$" + _fNum(sheet.getRange("D13").getValue()) + "萬";
      replacements["{{意外_燒燙傷}}"] = "$" + _fNum(sheet.getRange("D14").getValue()) + "萬";
      
      replacements["{{醫療_病房費}}"] = "$" + _fNum(sheet.getRange("D20").getValue()) + "/日";
      replacements["{{醫療_補償}}"] = "$" + _fNum(sheet.getRange("D21").getValue()) + "/日";
      replacements["{{醫療_合計}}"] = "$" + _fNum(sheet.getRange("D22").getValue()) + "/日";
    }

    // 2. 複製模板並生成簡報
    const reportName = prefix + (replacements["{{姓名}}"] || "貴賓") + "_" + Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
    const newFile = DriveApp.getFileById(templateId).makeCopy(reportName);
    const pres = SlidesApp.openById(newFile.getId());
    
    // 3. 全量替換
    pres.getSlides().forEach(slide => {
      Object.keys(replacements).forEach(key => {
        slide.replaceAllText(key, String(replacements[key] || ""));
      });
    });
    
    pres.saveAndClose();
    
    // 4. 展示皇家級成果
    const url = newFile.getUrl();
    const html = `<div style="font-family:sans-serif;text-align:center;padding:20px;background:#f8fafc;border-radius:15px;border: 1px solid #e2e8f0;">
      <h2 style="color:#2DB7F5;margin-bottom:5px;">✨ 視覺報告產出成功</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:20px;">👤 客戶：${replacements["{{姓名}}"]}</p>
      <div style="margin:20px 0;">
        <a href="${url}" target="_blank" style="background: linear-gradient(135deg, #2DB7F5, #2980b9); color:white; padding:15px 40px; text-decoration:none; border-radius:50px; font-weight:bold; display:inline-block; box-shadow:0 10px 15px -3px rgba(45,183,245,0.3);">🚀 立即開啟簡報</a>
      </div>
      <p style="font-size:11px;color:#94a3b8;margin-top:15px;">此報告為專屬備品，已自動存入您的雲端硬碟。</p>
    </div>`;
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(400).setHeight(260), '👑 皇家精算控制中心');
    
  } catch (e) {
    Browser.msgBox("❌ 報告生成發生意外：\n" + e.message);
  }
}

/** 🚀 開啟批量匯入對話框 */
function showBulkImportDialog() {
  const html = HtmlService.createHtmlOutputFromFile('BulkImportDialog')
    .setWidth(600)
    .setHeight(500)
    .setTitle('👑 皇家特助｜費率數據批量匯入');
  SpreadsheetApp.getUi().showModalDialog(html, '🚀 費率數據批量匯入');
}

/** ⚙️ 處理批量匯入數據 (支援首年/續保分類) */
function processBulkImport(rawText, importType) {
  if (!rawText) return "❌ 請貼入資料內容。";
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getUserProperties();
  const dbId = props.getProperty('PRODUCT_DB_ID');
  if (!dbId) return "❌ 尚未初始化外部資料庫。";
  const extSs = SpreadsheetApp.openById(dbId);
  const rateSheet = extSs.getSheetByName("費率資料庫");
  
  const lines = rawText.trim().split(/[\r\n]+/);
  const dataToAppend = [];
  
  lines.forEach(line => {
    // 支援 Tab 或逗號分隔
    const cols = (line.includes('\t')) ? line.split('\t') : line.split(',');
    const cleanCols = cols.map(c => c.trim());
    
    // 如果是標題列或欄位不足則跳過 (第一欄若包含 "ProductID" 或長度 < 5)
    if (cleanCols[0].includes("ProductID") || cleanCols[0].includes("代碼") || cleanCols.length < 5) {
      return;
    }
    
    // 數據清理
    const pid = cleanCols[0];
    const plan = cleanCols[1];
    
    // 1. 性別智慧解析 (支援 B/Both)
    const genderRaw = String(cleanCols[2]).toUpperCase().trim();
    const genders = (genderRaw === "B" || genderRaw === "BOTH" || genderRaw === "通用") ? ["M", "F"] : [genderRaw.includes("F") ? "F" : "M"];
    
    // 2. 智慧年齡解析 (支援級距如 0-19)
    const ageRaw = cleanCols[3];
    let ages = [];
    if (ageRaw && String(ageRaw).includes("-")) {
      const parts = String(ageRaw).split("-");
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      if (!isNaN(start) && !isNaN(end)) {
        for (let a = start; a <= end; a++) ages.push(a);
      }
    } else {
      ages.push(parseInt(ageRaw) || 0);
    }

    // 3. 職級智慧解析 (支援級距如 1-4)
    const occRaw = cleanCols[6];
    let occs = [];
    if (occRaw && String(occRaw).includes("-")) {
      const parts = String(occRaw).split("-");
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      if (!isNaN(start) && !isNaN(end)) {
        for (let o = start; o <= end; o++) occs.push(o);
      }
    } else {
      occs.push(parseInt(occRaw) || 0);
    }

    const payTerm = cleanCols[4];
    const coverTerm = cleanCols[5] || "";
    const premium = cleanValue(cleanCols[7]);
    
    // 4. 多維度展開寫入 (性別 x 年齡 x 職級)
    genders.forEach(g => {
      ages.forEach(a => {
        occs.forEach(o => {
          dataToAppend.push([pid, plan, g, a, payTerm, coverTerm, o, premium, importType]);
        });
      });
    });
  });
  
  if (dataToAppend.length > 0) {
    try {
      rateSheet.getRange(rateSheet.getLastRow() + 1, 1, dataToAppend.length, 9).setValues(dataToAppend);
      // 自動刷新快取 (關鍵動作)
      refreshLocalCache();
      return "✅ 成功匯入 " + dataToAppend.length + " 筆【" + importType + "】費率資料！\n系統已自動同步快取。";
    } catch(e) {
      return "❌ 寫入資料庫失敗：" + e.toString();
    }
  } else {
    return "⚠️ 沒有可匯入的數據 (或格式不正確)。";
  }
}