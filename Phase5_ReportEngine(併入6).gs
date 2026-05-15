// /* 🏆 皇家旗艦報告引擎 V4.5 - 大小雙軌合併【最終語法修正版】 🏆 */

// // ==========================================
// // 🛡️ 通用輔助函數 (數據淨化與格式化)
// // ==========================================

// function cleanValue(val) {
//   if (!val) return 0;
//   const num = String(val).replace(/[^0-9.]/g, ""); 
//   return num ? parseFloat(num) : 0;
// }

// function fmtDate(dateVal) {
//   if (!dateVal) return "";
//   try { return Utilities.formatDate(new Date(dateVal), "GMT+8", "yyyy/MM/dd"); } 
//   catch(e) { return String(dateVal); }
// }

// function fmtNum(num) { 
//   return Number(num || 0).toLocaleString(); 
// }

// function getCoverMonth() {
//   const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//   const now = new Date();
//   return monthNames[now.getMonth()] + ", " + now.getFullYear();
// }

// /** 🚩 助手：顯示報告下載/開啟連結視窗 */
// function showReportLink(url, filename) {
//   const html = `
//     <div style="font-family: sans-serif; text-align: center; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px;">
//       <h2 style="color: #2c3e50;">✨ 報告產出完成！</h2>
//       <p style="color: #576574; font-weight: bold; margin-bottom: 25px;">${filename}</p>
//       <div style="margin-top: 10px;">
//         <a href="${url}" target="_blank" 
//            style="background-color: #3498db; color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4); display: inline-block;">
//            🚀 立即開啟簡報
//         </a>
//       </div>
//       <p style="margin-top: 25px; font-size: 12px; color: #8395a7;">點擊按鈕將於新分頁開啟 Google Slides</p>
//     </div>
//   `;
//   const output = HtmlService.createHtmlOutput(html).setWidth(450).setHeight(280);
//   SpreadsheetApp.getUi().showModalDialog(output, '👑 皇家特助｜報告派送中');
// }

// // ==========================================
// // 💼 大人版專屬功能區
// // ==========================================

// function initAdultWorksheet() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sheetName = "大人評估工作清單";
//   let sheet = ss.getSheetByName(sheetName);
//   if (!sheet) { sheet = ss.insertSheet(sheetName); } 
//   else { sheet.getRange("B2:D41").clearContent().clearFormat(); }

//   sheet.setColumnWidth(2, 130); sheet.setColumnWidth(3, 400); sheet.setColumnWidth(4, 150); 
//   const styleHeader = (range, color) => { range.setBackground(color).setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center"); };

//   sheet.getRange("B2:D2").merge().setValue("🏆 吳佩璽保險經紀人｜大人風險評估工作區").setBackground("#34495e").setFontColor("white").setFontWeight("bold");
//   sheet.getRange("B3").setValue("目前處理客戶：").setFontWeight("bold");
//   sheet.getRange("C3").setBackground("#FFF2CC");

//   sheet.getRange("B5:D5").merge().setValue("【醫療住院需求】需求評估");
//   styleHeader(sheet.getRange("B5:D5"), "#2c3e50");
//   sheet.getRange("B6:D13").setValues([
//     ["優先順序", "", ""],
//     ["期望醫院", "", ""],
//     ["房型", "", ""],
//     ["病房費/日", "請填入差額", 3000], 
//     ["看護費/日", "", "=IFS(C10=\"沒有，需要請半日看護\", 1500, C10=\"沒有，需要請全日看護\", 2500, TRUE, 0)"],
//     ["薪資補償/日", "", ""],
//     ["住院小計", "", "=SUM(D9:D11)"],
//     ["住院雜費額度", "", ""]
//   ]);

//   sheet.getRange("B15:D15").merge().setValue("【重病失能需求】需求評估");
//   styleHeader(sheet.getRange("B15:D15"), "#8e44ad");
//   sheet.getRange("B16:D22").setValues([
//     ["優先順序", "", ""],
//     ["重大傷病額度", "", ""],
//     ["癌症加強需求", "", ""],
//     ["失能長照月付", "", ""],
//     ["交通工具", "", ""],
//     ["職業等級", "", ""],
//     ["建議意外險總額", "", "=IFS(C21=\"軍警消\", 500, OR(C21=\"外勤\", REGEXMATCH(C20, \"機車|汽車\")), 300, TRUE, 200)"]
//   ]);

//   sheet.getRange("B24:D24").merge().setValue("【責任照顧需求】需求評估");
//   styleHeader(sheet.getRange("B24:D24"), "#d35400");
//   sheet.getRange("B25:D34").setValues([
//     ["優先順序", "", ""],
//     ["貸款餘額", "", ""],
//     ["子女扶養說明", "", ""],
//     ["子1歲數", "手動填寫", 22], 
//     ["子2歲數", "手動填寫", 22], 
//     ["子女教育金合計", "", "=IFERROR(500/22*(22-D28),0) + IFERROR(500/22*(22-D29),0)"],
//     ["父親歲數", "手動填寫", 76],
//     ["母親歲數", "手動填寫", 83],
//     ["父母孝養金合計", "", "=(12*(76-D31)*2) + (12*(83-D32)*2)"],
//     ["責任總計", "", "=SUM(D26, D30, D33)"]
//   ]);

//   sheet.getRange("C4:D41").setHorizontalAlignment("left");
//   const yellowCells = ["C3", "D9", "D28", "D29", "D31", "D32"];
//   yellowCells.forEach(cell => sheet.getRange(cell).setBackground("#FFF2CC"));
//   Browser.msgBox("✅ 大人工作區初始化完成！");
// }

// function loadSelectedAdultToWorksheet() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sourceSheet = ss.getSheetByName("大人風險評估");
//   const workerSheet = ss.getSheetByName("大人評估工作清單");
//   const currentRow = sourceSheet.getActiveRange().getRow();
//   if (currentRow < 2) { Browser.msgBox("⚠️ 請選取大人資料行。"); return; }
//   const rowData = sourceSheet.getRange(currentRow, 1, 1, 24).getValues()[0];
//   const getRank = (key) => {
//     const list = String(rowData[6]).split(">").map(item => item.trim());
//     const idx = list.indexOf(key); return idx !== -1 ? idx + 1 : "";
//   };
//   workerSheet.getRange("C3").setValue(rowData[1]);
//   workerSheet.getRange("D6").setValue(getRank("醫療"));
//   workerSheet.getRange("C7").setValue(rowData[9]);
//   workerSheet.getRange("C8").setValue(rowData[10]);
//   workerSheet.getRange("C10").setValue(rowData[11]);
//   workerSheet.getRange("D11").setValue(cleanValue(rowData[12]));
//   workerSheet.getRange("D13").setValue(rowData[13]);
//   workerSheet.getRange("D16").setValue(getRank("重病"));
//   workerSheet.getRange("D17").setValue(cleanValue(rowData[14]));
//   workerSheet.getRange("C18").setValue(rowData[15]);
//   workerSheet.getRange("D19").setValue(cleanValue(rowData[18]));
//   workerSheet.getRange("C20").setValue(rowData[16]);
//   workerSheet.getRange("C21").setValue(rowData[17]);
//   workerSheet.getRange("D25").setValue(getRank("責任"));
//   workerSheet.getRange("D26").setValue(cleanValue(rowData[20]));
//   workerSheet.getRange("C27").setValue(rowData[19]);
//   workerSheet.getRange("D37").setValue(rowData[5]);
//   workerSheet.getRange("C38").setValue(rowData[2]);
//   workerSheet.getRange("C39").setValue(rowData[3]);
//   workerSheet.getRange("C40").setValue(rowData[7]);
//   workerSheet.activate();
// }

// function generateAdultReport() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const ws = ss.getSheetByName("大人評估工作清單");
//   const clientName = ws.getRange("C3").getValue();
//   const templateId = "1D1XGe_xfOSXa8A8zgWe65R2qvVTdRm0fdIdfU4uJZk0"; 
//   const copyFile = DriveApp.getFileById(templateId).makeCopy(`評估報告_${clientName}`);
//   const slide = SlidesApp.openById(copyFile.getId());

//   const replacements = {
//     "{{姓名}}": clientName,
//     "{{填表日期}}": Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd"),
//     "{{報告月份}}": getCoverMonth(),
//     "{{醫療_優先}}": ws.getRange("D6").getValue(),
//     "{{醫療_病房房型}}": ws.getRange("C7").getValue() + " " + ws.getRange("C8").getValue(),
//     "{{醫療_病房費}}": "$" + fmtNum(ws.getRange("D9").getValue()) + "/日",
//     "{{醫療_看護費}}": "$" + fmtNum(ws.getRange("D10").getValue()) + "/日",
//     "{{醫療_薪資}}": "$" + fmtNum(ws.getRange("D11").getValue()) + "/日",
//     "{{醫療_合計}}": "$" + fmtNum(ws.getRange("D12").getValue()) + "/日",
//     "{{醫療_雜費}}": ws.getRange("D13").getValue(),
//     "{{重病_優先}}": ws.getRange("D16").getValue(),
//     "{{重病_重傷金額}}": "$" + fmtNum(ws.getRange("D17").getValue()) + "萬",
//     "{{重病_癌症}}": ws.getRange("C18").getValue(),
//     "{{重病_失能月給付}}": "$" + fmtNum(ws.getRange("D19").getValue()) + "萬/月",
//     "{{重病_意外總額}}": fmtNum(ws.getRange("D22").getValue()) + "萬",
//     "{{責任_優先}}": ws.getRange("D25").getValue(),
//     "{{責任_貸款}}": "$" + fmtNum(ws.getRange("D26").getValue()) + "萬",
//     "{{責任_子女}}": "$" + fmtNum(Math.round(ws.getRange("D30").getValue())) + "萬",
//     "{{責任_扶養}}": "$" + fmtNum(Math.round(ws.getRange("D33").getValue())) + "萬",
//     "{{責任_合計}}": "$" + fmtNum(Math.round(ws.getRange("D34").getValue())) + "萬",
//     "{{基本_預算}}": fmtNum(cleanValue(ws.getRange("D37").getValue())) + " 元/月",
//     "{{基本_性別}}": ws.getRange("C38").getValue(),
//     "{{基本_生日}}": fmtDate(ws.getRange("C39").getValue()),
//     "{{基本_補充}}": ws.getRange("C40").getValue()
//   };

//   slide.getSlides().forEach(s => {
//     Object.keys(replacements).forEach(key => { try { s.replaceAllText(key, String(replacements[key] || " ")); } catch(e){} });
//   });

//   slide.saveAndClose();
//   showReportLink(copyFile.getUrl(), `大人評估報告_${clientName}`);
// }

// // ==========================================
// // 👶 小孩版專屬功能區
// // ==========================================

// function initChildWorksheet() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sheetName = "小孩評估工作清單";
//   let sheet = ss.getSheetByName(sheetName);
//   if (!sheet) { sheet = ss.insertSheet(sheetName); } 
//   else { sheet.getRange("B2:D41").clearContent().clearFormat(); }

//   sheet.setColumnWidth(2, 130); sheet.setColumnWidth(3, 400); sheet.setColumnWidth(4, 150); 
//   const styleHeader = (range, color) => { range.setBackground(color).setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center"); };

//   sheet.getRange("B2:D2").merge().setValue("👑 旗艦系統｜小孩風險評估工作區").setBackground("#2980b9").setFontColor("white").setFontWeight("bold");
//   sheet.getRange("B3").setValue("目前處理父母：").setFontWeight("bold");
//   sheet.getRange("B4").setValue("目前處理寶寶：").setFontWeight("bold");
//   sheet.getRange("C3:C4").setBackground("#FFF2CC");

//   sheet.getRange("B6:D6").merge().setValue("【重大傷病需求】");
//   styleHeader(sheet.getRange("B6:D6"), "#34495e");
//   sheet.getRange("B7:D9").setValues([["優先順序", "", ""], ["重大傷病總額", "", ""], ["加強防癌金", "", ""]]);

//   sheet.getRange("B11:D11").merge().setValue("【意外失能與燒燙傷需求】");
//   styleHeader(sheet.getRange("B11:D11"), "#f39c12");
//   sheet.getRange("B12:D14").setValues([["優先順序", "", ""], ["意外失能給付", "", ""], ["燒燙傷增額", "", ""]]);

//   sheet.getRange("B16:D16").merge().setValue("【醫療住院需求】");
//   styleHeader(sheet.getRange("B16:D16"), "#27ae60");
//   sheet.getRange("B17:D23").setValues([
//     ["優先順序", "", ""], ["期望醫院", "", ""], ["房型", "", ""],
//     ["病房費差額", "手動填寫", 3000], ["薪資補償/日", "父母照顧補償", ""],
//     ["病房費合計", "", "=D20+D21"], ["住院雜費額度", "", ""]
//   ]);

//   sheet.getRange("B25:D25").merge().setValue("【基本資料】");
//   styleHeader(sheet.getRange("B25:D25"), "#7f8c8d");
//   sheet.getRange("B26:D31").setValues([
//     ["每月預算", "", ""], ["性別", "", ""], ["生日/預產期", "", ""],
//     ["父母健診意願", "", ""], ["重視的事情", "", ""], ["補充說明", "", ""]
//   ]);

//   const yellowCells = ["C3", "C4", "D20"];
//   yellowCells.forEach(cell => sheet.getRange(cell).setBackground("#FFF2CC"));
//   Browser.msgBox("✅ 小孩工作區初始化完成！");
// }

// function loadSelectedChildToWorksheet() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sourceSheet = ss.getSheetByName("問卷自動入庫");
//   const ws = ss.getSheetByName("小孩評估工作清單");
//   const currentRow = sourceSheet.getActiveRange().getRow();
//   if (currentRow < 2) { Browser.msgBox("⚠️ 請選取寶寶資料列。"); return; }
  
//   const rowData = sourceSheet.getRange(currentRow, 1, 1, 23).getValues()[0];
//   const rawRankStr = String(rowData[8]); 
//   const rankList = rawRankStr.split(">").map(item => item.trim());
//   const getRank = (key) => {
//     for (let i = 0; i < rankList.length; i++) {
//         if (rankList[i].indexOf(key) !== -1) { return i + 1; }
//     }
//     return "";
//   };

//   ws.getRange("C3").setValue(rowData[1]); // 填表人 (父母)
//   ws.getRange("C4").setValue(rowData[2]); // 寶寶暱稱
//   ws.getRange("D7").setValue(getRank("重疾"));
//   ws.getRange("D8").setValue(rowData[16]);
//   ws.getRange("D9").setValue(rowData[17]);
//   ws.getRange("D12").setValue(getRank("失能"));
//   ws.getRange("D13").setValue(rowData[18]);
//   ws.getRange("D14").setValue(rowData[19]);
//   ws.getRange("D17").setValue(getRank("醫療"));
//   ws.getRange("C18").setValue(rowData[11]);
//   ws.getRange("C19").setValue(rowData[12]);
//   ws.getRange("D21").setValue(cleanValue(rowData[14]));
//   ws.getRange("D23").setValue(rowData[15]);
//   ws.getRange("D26").setValue(rowData[7]);
//   ws.getRange("C27").setValue(rowData[3]);
//   ws.getRange("C28").setValue(fmtDate(rowData[4]));
//   ws.getRange("C29").setValue(rowData[9]);
//   ws.getRange("C30").setValue(rowData[10]);
//   ws.getRange("C31").setValue(rowData[20]);
//   ws.activate();
//   Browser.msgBox(`✅ 客戶「${rowData[2]}」載入成功！`);
// }

// /** 🚩 產出：產出小孩版報告 (生日修正版) */
// function generateChildReport() {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const ws = ss.getSheetByName("小孩評估工作清單");
//   const fillerName = ws.getRange("C3").getValue();
//   const babyName = ws.getRange("C4").getValue();
//   const templateId = "10vjJPIs7UZJxO9b0dld__lcqvaPJXY5I4_lwjYTx1dY"; 
//   const copyFile = DriveApp.getFileById(templateId).makeCopy(`寶寶評估報告_${babyName}`);
//   const slide = SlidesApp.openById(copyFile.getId());

//   let genderRaw = ws.getRange("C27").getValue();
//   let genderFmt = (genderRaw === "小王子") ? "男生" : (genderRaw === "小公主") ? "女生" : genderRaw;
//   let memoRaw = String(ws.getRange("C31").getValue());
//   let memoFmt = memoRaw.length > 20 ? memoRaw.substring(0, 20) + "..." : memoRaw;

//   const replacements = {
//     "{{姓名}}": fillerName,      
//     "{{寶寶姓名}}": babyName,    
//     "{{填表日期}}": Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd"),
//     "{{報告月份}}": getCoverMonth(),
//     "{{重傷_優先}}": ws.getRange("D7").getValue(),
//     "{{重傷_總額}}": ws.getRange("D8").getValue(),
//     "{{重傷_癌症}}": ws.getRange("D9").getValue(),
//     "{{意外_優先}}": ws.getRange("D12").getValue(),
//     "{{意外_失能}}": ws.getRange("D13").getValue(),
//     "{{意外_燒燙傷}}": ws.getRange("D14").getValue(),
//     "{{醫療_優先}}": ws.getRange("D17").getValue(),
//     "{{醫療_病房日額}}": "$" + fmtNum(ws.getRange("D20").getValue()) + "/日",
//     "{{醫療_醫院房型}}": ws.getRange("C18").getValue() + " " + ws.getRange("C19").getValue(),
//     "{{醫療_薪資}}": "$" + fmtNum(ws.getRange("D21").getValue()) + "/日",
//     "{{醫療_合計}}": "$" + fmtNum(ws.getRange("D22").getValue()) + "/日",
//     "{{醫療_雜費}}": ws.getRange("D23").getValue(),
//     "{{基本_預算}}": fmtNum(cleanValue(ws.getRange("D26").getValue())) + " 元/月",
//     "{{基本_性別}}": genderFmt, 
//     "{{基本_生日}}": fmtDate(ws.getRange("C28").getValue()), // ✅ 已加上格式化函數！
//     "{{基本_補充}}": memoFmt
//   };

//   slide.getSlides().forEach(s => {
//     Object.keys(replacements).forEach(key => { try { s.replaceAllText(key, String(replacements[key] || " ")); } catch(e){} });
//   });

//   slide.saveAndClose();
//   showReportLink(copyFile.getUrl(), `寶寶評估報告_${babyName}`);
// }

// // ==========================================
// // 🛡️ 權限與選單
// // ==========================================

// function onOpen() {
//   const ui = SpreadsheetApp.getUi();
//   ui.createMenu('👑 皇家特助')
//     .addSubMenu(ui.createMenu('💼 大人版工具')
//       .addItem('🏗️ 初始化：大人工作清單', 'initAdultWorksheet')
//       .addItem('📥 載入選中大人資料', 'loadSelectedAdultToWorksheet')
//       .addItem('🚀 產出大人評估報告', 'generateAdultReport'))
//     .addSeparator()
//     .addSubMenu(ui.createMenu('👶 小孩版工具')
//       .addItem('🏗️ 初始化：小孩工作清單', 'initChildWorksheet')
//       .addItem('📥 載入選中小孩資料', 'loadSelectedChildToWorksheet')
//       .addItem('🚀 產出小孩評估報告', 'generateChildReport'))
//     .addToUi();
// }
