function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('👑 皇家精算控制中心')
    .addItem('🚀 啟動精算控制台 (Web)', 'openQuotingHub')
    .addSeparator()
    .addSubMenu(ui.createMenu('💼 大人版工具')
      .addItem('🏗️ 初始化工作區', 'initAdultWorksheet')
      .addItem('📥 載入選中客戶', 'loadSelectedAdultToWorksheet')
      .addItem('🎨 產出視覺報告', 'generateAdultReport'))
    .addSubMenu(ui.createMenu('👶 小孩版工具')
      .addItem('🏗️ 初始化工作區', 'initChildWorksheet')
      .addItem('📥 載入選中寶寶', 'loadSelectedChildToWorksheet')
      .addItem('🎨 產出視覺報告', 'generateChildReport'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ 核心維護')
      .addItem('🗄️ 初始化外部資料庫', 'setupExternalProductDatabase')
      .addItem('🔄 重新整理商品快取', 'refreshLocalCache')
      .addItem('📊 執行本表精算(舊版)', 'runActurarialCalculation')
      .addItem('🛠️ 校準系統網址', 'setSystemUrl')
      .addSeparator()
      .addItem('🛡️ 執行環境健康檢查', 'ValidateSystemShelves')
      .addItem('📦 立即執行系統備份', 'SystemBackup')
      .addItem('⏰ 安裝自動化排程', 'setupMaintenanceTriggers'))
    .addToUi();
}


/** 🔑 暴力解鎖：強制觸發簡報授權視窗 */
function forceAuthForSlides() {
  const temp = SlidesApp.create("臨時授權驗證");
  DriveApp.getFileById(temp.getId()).setTrashed(true); // 授權完後自動刪除
  Browser.msgBox("✅ 授權成功！現在您可以正常使用『產出視覺報告』功能了。");
}
function openQuotingHub() {
  const props = PropertiesService.getUserProperties();
  let url = props.getProperty('WEB_APP_URL');
  
  // 如果沒設定，才使用自動抓取的
  if (!url) {
    url = ScriptApp.getService().getUrl();
  }
  
  if (url && !url.includes("?")) {
    url += "?page=hub";
  } else if (url && !url.includes("page=hub")) {
    url += "&page=hub";
  }

  const html = HtmlService.createHtmlOutput(`
    <div style="font-family:'Noto Sans TC', sans-serif; padding:10px; line-height:1.6;">
      <p>🚀 正在準備進入「皇家精算控制台」...</p>
      <div style="text-align:center; margin:20px 0;">
        <button onclick="window.open('${url}', '_blank'); google.script.host.close();" 
                style="background:#2DB7F5; color:white; border:none; padding:12px 25px; border-radius:8px; font-weight:bold; cursor:pointer;">
          👉 點此立即開啟網頁
        </button>
      </div>
      <div style="background:#fff3cd; border:1px solid #ffeeba; padding:10px; border-radius:8px; font-size:12px; color:#856404;">
        <b>💡 小提示：</b><br>
        如果開啟後仍有誤，請點選選單中的「🛠️ 校準系統網址」更新。
      </div>
    </div>
  `)
  .setWidth(350)
  .setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(html, "👑 皇家系統導航");
}

/** 🛠️ 手動設定 Web App 網址 */
function setSystemUrl() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt("🛠️ 系統網址校準", "請貼入您可以正常開啟的 Web App 網址 (例如含有 /exec 或 /dev 的那串)：", ui.ButtonSet.OK_CANCEL);
  
  if (res.getSelectedButton() == ui.Button.OK) {
    const url = res.getResponseText().trim();
    if (url.includes("script.google.com")) {
      PropertiesService.getUserProperties().setProperty('WEB_APP_URL', url);
      ui.alert("✅ 網址已校準完成！現在可以正常啟動控制台了。");
    } else {
      ui.alert("❌ 格式不正確，請確保貼入的是 Google 指令碼網址。");
    }
  }
}

/**
 * ⚡️ 連動選單觸發器 (精算實戰升級版)
 * 
 * 支援「單位型 (Rate * Unit)」與「計畫型 (Fixed)」雙重精算邏輯。
 */

function onEdit(e) { handleOnEditLogic(e); }
function onEdit_Triggered(e) { handleOnEditLogic(e); }

function handleOnEditLogic(e) {
  if (!e) return;
  const range = e.range;
  const sheet = range.getSheet();
  const sName = sheet.getName();
  const row = range.getRow();
  const col = range.getColumn();
  const value = e.value || range.getValue(); // 確保抓到數值

  if ((sName !== "大人工作區" && sName !== "小孩工作區") || row < 42 || row === 43) return;

  // 0. 勾選框 (A) -> 刷新圓餅圖
  if (col === 1 && row >= 44) {
    updateCategorizedChart_(sheet);
  }
  // 1. 公司 (B) -> 分類 (C)
  else if (col === 2) {
    sheet.getRange(row, 3, 1, 4).clearContent().clearDataValidations();
    updateCategoryDropdown_(sheet, row, value);
  }
  // 2. 分類 (C) -> 名稱 (D)
  else if (col === 3) {
    const company = sheet.getRange(row, 2).getValue();
    sheet.getRange(row, 4, 1, 3).clearContent().clearDataValidations();
    updateProductDropdown_(sheet, row, company, value);
  }
  // 3. 名稱 (D) -> 年期 (E)
  else if (col === 4) {
    sheet.getRange(row, 5, 1, 2).clearContent().clearDataValidations();
    if (!value) return;
    updateTermDropdownCascade_(sheet, row, value);
  }
  // 4. 年期 (E) -> 保額 (F)
  else if (col === 5) {
    sheet.getRange(row, 6).clearContent().clearDataValidations();
    const prodName = sheet.getRange(row, 4).getValue();
    if (!value || !prodName) return;
    updatePlanDropdownCascade_(sheet, row, prodName, value);
  }
  // 5. 保額 (F) -> 發動自動精算 + 啟動紅三角清潔術
  else if (col === 6) {
    if (!value || row < 44) return;
    cleanValidationIndicator_(sheet, row, col, value);
    triggerLiveActurarialForRow_(sheet, row);
    updateCategorizedChart_(sheet);
  }
  // 6. 點擊「產生視覺化報告」按鈕 (F42:G42)
  else if (row === 42 && (col === 6 || col === 7)) {
    showReportLinkDialog_(sheet);
  }
  // 7. 載入常用套組 (D42)
  else if (row === 42 && col === 4) {
    if (!value || value === "(暫無組合)") return;
    applyCommonSet_(sheet, value);
    sheet.getRange(row, col).clearContent(); // 執行後清空
  }
}

/** [名稱 > 年期] 連動 */
function updateTermDropdownCascade_(sheet, row, prodName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodInfo = getProductInfoByName_(prodName);
  if (!prodInfo) return;

  const rCache = ss.getSheetByName("_RATE_OPTIONS_");
  const rateOps = rCache.getRange(2, 1, rCache.getLastRow()-1, 3).getValues();
  const terms = [...new Set(rateOps.filter(r => String(r[0]) === prodInfo.pid).map(r => r[1]))];

  if (terms.length > 0) {
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(terms, true).build();
    sheet.getRange(row, 5).setDataValidation(rule);
    ss.toast("✅ 請選擇「年期 (E欄)」", "✨ 下一步");
  } else {
    // 若無年期分級 (如一年期附約)，直接跳去更新保額
    updatePlanDropdownCascade_(sheet, row, prodName, "1年期");
  }
}

/** [年期 > 保額] 連動 (核心邏輯升級) */
function updatePlanDropdownCascade_(sheet, row, prodName, termValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodInfo = getProductInfoByName_(prodName);
  if (!prodInfo) return;

  const rCache = ss.getSheetByName("_RATE_OPTIONS_");
  const rateOps = rCache.getRange(2, 1, rCache.getLastRow()-1, 3).getValues();
  
  // 抓取快取中的計畫選項 (或使用商品定義的常用選項)
  let plans = [];
  if (prodInfo.commonOptions) {
    plans = prodInfo.commonOptions.split(",").map(s => s.trim());
  } else {
    plans = [...new Set(
      rateOps.filter(r => String(r[0]) === prodInfo.pid && (!termValue || String(r[1]) === String(termValue)))
             .map(r => r[2])
    )];
  }

  const target = sheet.getRange(row, 6);
  
  // ⚡️ 智慧自動填充：如果保額欄位目前是空的，自動填入預設額度
  if (!target.getValue() && prodInfo.defaultAmount) {
    target.setValue(prodInfo.defaultAmount);
    // 填充後立刻發動一次精算
    triggerLiveActurarialForRow_(sheet, row);
  }

  if (prodInfo.logic === "單位型") {
    // 單位型：優先使用自定義常用選單，若無則用預設清單
    const suggestions = plans.length > 0 ? plans : ["10萬", "20萬", "30萬", "50萬", "100萬", "200萬"];
    const rule = SpreadsheetApp.newDataValidation()
                  .requireValueInList(suggestions, true)
                  .setAllowInvalid(true)
                  .setHelpText("請點選建議或直接手動輸入保額")
                  .build();
    target.setDataValidation(rule);
  } else {
    // 計畫型：智慧下拉選單 (不強制作選，允許手動輸入 1, 2, 3)
    if (plans.length > 0) {
      const rule = SpreadsheetApp.newDataValidation()
                    .requireValueInList(plans, true)
                    .setAllowInvalid(true) // 改為允許手動輸入
                    .setHelpText("請點選計畫代號或手動輸入 (如 1, 2, 3)")
                    .build();
      target.setDataValidation(rule);
      ss.toast("✅ 已設定【" + prodInfo.name.split("．")[0] + "】專屬選單", "✨ 智慧連動成功");
    }
  }
}

/** 👑 自動精算發動機 (實戰版) */
function triggerLiveActurarialForRow_(sheet, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getUserProperties();
  const dbId = props.getProperty('PRODUCT_DB_ID');
  if (!dbId) return;
  const extSs = SpreadsheetApp.openById(dbId);

  const r = sheet.getRange(row, 1, 1, 11).getValues()[0];
  const prodName = r[3], term = r[4], planInput = r[5], gender = r[6], age = r[7];
  const company = r[1], category = r[2];

  if (!prodName || !planInput) return;

  const prodInfo = getProductInfoByName_(prodName);
  if (!prodInfo) return;

  // 1. 執行保費計算 (支援 單位型/計畫型)
  calculatePremiumSmart_(sheet, row, extSs, prodInfo, planInput, term, gender, age);
  
  // 檢核：最低投保門檻提醒
  const amount = cleanAmountInput_(planInput);
  if (prodInfo.minAmount && amount < prodInfo.minAmount) {
     ss.toast("⚠️ " + prodName + " 的最低投保金額為 " + (prodInfo.minAmount/10000) + " 萬，目前輸入不足！", "📏 規則提醒");
  }

  // 2. 更新摘要 (傳入保額供比例換算)
  updateBenefitSummary_(sheet, row, extSs, company, prodName, planInput, prodInfo);

  // 3. 全域投保結構檢核 (主附約關係)
  validatePolicyStructure_(sheet);
}

/** 💎 智慧保費運算邏輯 */
function calculatePremiumSmart_(sheet, row, extSs, prodInfo, planInput, term, gender, age) {
  const rateData = extSs.getSheetByName("費率資料庫").getDataRange().getValues();
  const pid = prodInfo.pid;
  
  // 智慧性別判定 (支援 小王子/小英雄/小公主/小珍珠 等)
  const genderStr = String(gender);
  let genderKey = "F";
  if (genderStr.includes("男") || genderStr.includes("王子") || genderStr.includes("英雄")) {
    genderKey = "M";
  } else if (genderStr.includes("女") || genderStr.includes("公主") || genderStr.includes("珍珠")) {
    genderKey = "F";
  }
  
  if (prodInfo.logic === "單位型") {
    // [單位型邏輯]: 抓取該年齡的單價 * (保額 / 10000)
    const match = rateData.find(r => 
      String(r[0]) === pid &&
      String(r[4]) === String(term) &&
      String(r[2]).trim().toUpperCase() === genderKey &&
      parseInt(r[3]) === parseInt(age) &&
      (String(r[8]) === "首年" || !r[8])
    );
    
    if (match) {
      const ratePer10k = match[7];
      const amount = cleanAmountInput_(planInput, prodInfo.unitBase);
      const totalPremium = (ratePer10k * amount) / (prodInfo.unitBase || 10000);
      sheet.getRange(row, 10).setValue(Math.round(totalPremium));
      SpreadsheetApp.getActiveSpreadsheet().toast("💰 單位型計算完成 (" + amount.toLocaleString() + ")", "✨ 精算成功");
    } else {
      sheet.getRange(row, 10).setValue("無此費率");
    }
  } else {
    // [計畫型邏輯]: 智慧比對計畫文字 (支援 1, 計畫1, 計劃1)
    const planStr = String(planInput).trim();
    const cleanPlanValue = cleanAmountInput_(planInput, prodInfo.unitBase);
    
    const match = rateData.find(r => {
      const dbPlan = String(r[1]).trim();
      const dbPlanNum = cleanAmountInput_(dbPlan, prodInfo.unitBase);
      
      // 智慧比對：1. 文字精確比對 2. 數值相等比對 (例如 3萬 vs 30000)
      const isPlanMatch = (dbPlan === planStr || dbPlan === "計畫" + planStr || dbPlan === "計劃" + planStr) ||
                          (dbPlanNum > 0 && dbPlanNum === cleanPlanValue);
      
      return String(r[0]) === pid &&
        isPlanMatch &&
        String(r[2]).trim().toUpperCase() === genderKey &&
        parseInt(r[3]) === parseInt(age) &&
        (String(r[8]) === "首年" || !r[8]);
    });
    
    if (match) {
      sheet.getRange(row, 10).setValue(match[7]);
      SpreadsheetApp.getActiveSpreadsheet().toast("💰 計畫型對應完成", "✨ 精算成功");
    } else {
      sheet.getRange(row, 10).setValue("查無計畫");
    }
  }
}

/** 🛡️ 輔助：抓取商品資訊 (包含 PID、計算邏輯、最低門檻、主附約屬性、預設額度、常用清單) */
function getProductInfoByName_(name) {
  const cache = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_DB_CACHE_");
  const data = cache.getRange(2, 1, cache.getLastRow()-1, 9).getValues();
  const row = data.find(r => String(r[3]).trim() === String(name).trim());
  return row ? { 
    pid: row[0], 
    company: row[1], 
    category: row[2], 
    name: row[3], 
    type: row[4], // 主約 or 附約
    logic: row[5],
    minAmount: parseFloat(row[6]) || 0,
    defaultAmount: String(row[7]).trim(),
    commonOptions: String(row[8]).trim(),
    unitBase: parseFloat(row[9]) || 10000 // J 欄：單位基數
  } : null;
}

/** 🛡️ 輔助：數值轉換 (支援 30萬, 300000, 30) */
function cleanAmountInput_(input, unitBase) {
  const str = String(input);
  const num = cleanValue(str);
  
  // 1. 如果有明確寫「萬」，直接 * 10000
  if (str.includes("萬")) return num * 10000;
  
  // 2. 如果基數大於等於 1000 (代表這是萬元級商品，如 DCE)
  if (!unitBase || unitBase >= 1000) {
    // 且輸入值很小 (例如 < 5000)，高度疑似是簡寫，幫他 * 10000
    if (num > 0 && num < 5000) return num * 10000;
  }
  
  // 3. 其他情況 (如 XAH 基數是 100，或輸入值已經很大)，則視為原始金額
  return num;
}

// (其餘輔助函數: updateCategoryDropdown_, updateProductDropdown_, updateBenefitSummary_, runActurarialCalculation 保持原本邏輯)
function updateCategoryDropdown_(sheet, row, company) {
  const cache = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_DB_CACHE_");
  const data = cache.getRange(2, 2, cache.getLastRow()-1, 2).getValues();
  const cats = [...new Set(data.filter(r => String(r[0]).trim() === String(company).trim()).map(r => r[1]))];
  if (cats.length) sheet.getRange(row, 3).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(cats, true).build());
}

function updateProductDropdown_(sheet, row, company, category) {
  const cache = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_DB_CACHE_");
  const data = cache.getRange(2, 2, cache.getLastRow()-1, 3).getValues();
  const prods = [...new Set(data.filter(r => String(r[0]) === company && String(r[1]) === category).map(r => r[2]))];
  if (prods.length) sheet.getRange(row, 4).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(prods, true).build());
}

/** 🧬 動態給付摘要更新 (支援比例換算) */
function updateBenefitSummary_(sheet, row, extSs, company, prodName, planInput, prodInfo) {
  try {
    const prodData = extSs.getSheetByName("常用商品資料庫").getDataRange().getValues();
    const pRow = prodData.find(r => String(r[1]).trim() === String(company).trim() && String(r[3]).trim() === String(prodName).trim());
    if (!pRow) return;
    
    const benefitData = extSs.getSheetByName("給付定義表").getDataRange().getValues();
    const multiplier = (prodInfo && prodInfo.logic === "單位型") ? (cleanAmountInput_(planInput, prodInfo.unitBase) / (prodInfo.unitBase || 10000)) : 1;
    
    // 取得當前所選計畫的簡化標籤 (例如 "計畫1" -> "1")
    const currentPlanLabel = String(planInput).replace(/計畫|計劃/g, "").trim();
    
    const summary = benefitData.slice(1)
      .filter(r => {
        const isPidMatch = String(r[0]) === String(pRow[0]);
        const applicablePlan = String(r[5] || "").trim(); // F 欄: 適用計畫
        
        // 1. 如果「適用計畫」欄位是空的，代表此項保障全計畫通用
        if (!applicablePlan) return isPidMatch;
        
        // 2. 如果有填計畫，則比對簡化後的標籤 (支援多計畫、數值等值、字串包含)
        const dbPlanLabels = applicablePlan.split(",").map(p => p.replace(/計畫|計劃/g, "").trim());
        const currentInputNum = cleanAmountInput_(currentPlanLabel, prodInfo.unitBase);
        
        return isPidMatch && dbPlanLabels.some(dbLabel => {
          const dbLabelClean = dbLabel.trim();
          const dbLabelNum = cleanAmountInput_(dbLabelClean, prodInfo.unitBase);
          
          return (dbLabelClean === currentPlanLabel) ||               // 精確匹配 (3A)
                 (dbLabelNum > 0 && dbLabelNum === currentInputNum) || // 數值匹配 (3萬 vs 30000)
                 (dbLabelClean.includes(currentPlanLabel)) ||         // 包含匹配 (3萬 vs 3萬元)
                 (currentPlanLabel.includes(dbLabelClean));           // 被包含匹配
        });
      })
      .map(r => {
         const baseVal = parseFloat(r[2]) || 0;
         const finalVal = Math.round(baseVal * multiplier);
         return r[1] + ":" + finalVal.toLocaleString() + r[3];
      })
      .join(" | ");
      
    sheet.getRange(row, 11).setValue(summary);
  } catch(e){
    console.error("更新摘要失敗:", e);
  }
}

function runActurarialCalculation() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = Math.max(sheet.getLastRow(), 94);
  for (let i = 44; i <= lastRow; i++) {
    const prod = sheet.getRange(i, 4).getValue();
    const plan = sheet.getRange(i, 6).getValue();
    if (prod && plan) triggerLiveActurarialForRow_(sheet, i);
  }
}
/** 🛡️ 全域投保結構檢核器 */
function validatePolicyStructure_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 94);
  const data = sheet.getRange(44, 1, lastRow - 43, 4).getValues(); // A:勾選, D:名稱
  
  const statusMap = {}; // { "全球人壽": { hasMain: false, hasRider: false, riderNames: [] } }
  
  data.forEach(r => {
    const isChecked = r[0] === true;
    const prodName = r[3];
    if (isChecked && prodName) {
      const info = getProductInfoByName_(prodName);
      if (info) {
        if (!statusMap[info.company]) {
          statusMap[info.company] = { hasMain: false, hasRider: false, riderNames: [] };
        }
        if (info.type === "主約") {
          statusMap[info.company].hasMain = true;
        } else if (info.type === "附約") {
          statusMap[info.company].hasRider = true;
          statusMap[info.company].riderNames.push(info.name.split("．")[0]); // 簡稱
        }
      }
    }
  });
  
  // 檢核邏輯
  for (let company in statusMap) {
    const status = statusMap[company];
    if (status.hasRider && !status.hasMain) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "⚠️ " + company + " 警告：已選附約 (" + status.riderNames.join(",") + ")，但尚未選擇主約！", 
        "📏 投保結構不合法", 
        10
      );
    }
  }
}

/** 📊 圖表引擎：掃描工作區並產出圓餅圖 */
function updateCategorizedChart_(sheet) {
  const data = sheet.getRange(44, 1, 30, 10).getValues();
  const summary = { "醫療保障": 0, "重病重疾": 0, "意外傷害": 0, "壽險責任": 0, "其它": 0 };
  
  data.forEach(r => {
    if (r[0] === true && r[9]) {
      const cat = String(r[2]);
      const premium = parseFloat(r[9]) || 0;
      if (cat.includes("醫療") || cat.includes("日額")) summary["醫療保障"] += premium;
      else if (cat.includes("傷病") || cat.includes("防癌")) summary["重病重疾"] += premium;
      else if (cat.includes("意外") || cat.includes("傷害")) summary["意外傷害"] += premium;
      else if (cat.includes("壽險") || cat.includes("壽")) summary["壽險責任"] += premium;
      else summary["其它"] += premium;
    }
  });

  // 檢查是否有現有圖表並移除
  const charts = sheet.getCharts();
  charts.forEach(c => { if (c.getContainerInfo().getAnchorRow() === 43) sheet.removeChart(c); });

  // 建立圖表數據源 (寫在遠端不影響主畫面)
  const chartValues = Object.keys(summary).map(k => [k, summary[k]]).filter(r => r[1] > 0);
  if (chartValues.length === 0) return;

  const rCache = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_DB_CACHE_");
  rCache.getRange(100, 1, 5, 2).clearContent().setValues(chartValues);

  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(rCache.getRange(100, 1, chartValues.length, 2))
    .setPosition(43, 12, 0, 0)
    .setOption('title', '⚖️ 規劃保費佔比彙整')
    .setOption('legend', {textStyle: {fontSize: 10}})
    .setOption('pieHole', 0.4)
    .setOption('colors', ['#2ecc71', '#3498db', '#f1c40f', '#e67e22', '#95a5a6'])
    .build();

  sheet.insertChart(chart);
}

/** 🔗 彈出 Web 建議書連結 */
function showReportLinkDialog_(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clientName = sheet.getRange("C3").getValue();
  const type = sheet.getName().includes("大人") ? "adult" : "child";
  const url = ScriptApp.getService().getUrl() + "?page=main&type=" + type + "&id=" + encodeURIComponent(clientName);
  
  const ui = HtmlService.createHtmlOutput(`
    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
      <h3 style="color: #2980b9;">🎨 視覺化建議書已生成</h3>
      <p>客戶姓名：<b>${clientName}</b></p>
      <input id="url" type="text" value="${url}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
      <br><br>
      <button onclick="window.open('${url}', '_blank')" style="background: #8BC220; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">🌍 立即開啟 Web 報表</button>
      <p style="font-size: 12px; color: #7f8c8d; margin-top: 15px;">※ 提示：手機開啟可直接分享連結給客戶。</p>
    </div>
  `).setWidth(400).setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(ui, "👑 皇家建議書發布中心");
}

/** 🧹 紅三角清潔術：消除非預設項目的錯誤標記 */
function cleanValidationIndicator_(sheet, row, col, value) {
  const target = sheet.getRange(row, col);
  const validation = target.getDataValidation();
  if (!validation) return;

  const criteria = validation.getCriteriaType();
  if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
    const list = validation.getCriteriaValues()[0];
    if (list && !list.includes(String(value))) {
      // 偵測到手動輸入且不在名單內 -> 替換為寬鬆驗證以消除紅三角
      let builder = SpreadsheetApp.newDataValidation().setAllowInvalid(true);
      
      // 判斷是文字還是純數字
      if (typeof value === 'number' || !isNaN(value)) {
        builder.requireNumberBetween(-1, 1000000000);
      } else {
        builder.requireTextLengthGreaterThan(0); // 文字型保額 (如: 計畫B)
      }
      
      target.setDataValidation(builder.setHelpText("已接受自定義保額/計畫").build());
      SpreadsheetApp.getActiveSpreadsheet().toast("🎨 已自動優化視覺顯示 (紅三角消除)", "⚡️ 皇家清潔術");
    }
  }
}

/** 📦 核心引擎：套用常用套組 (🚀 終極批次版 - 單次 API 完成) */
function applyCommonSet_(sheet, setName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setSheet = ss.getSheetByName("_SET_DNA_");
  if (!setSheet) { ss.toast("⚠️ 找不到 _SET_DNA_ 分頁", "🚫 錯誤"); return; }
  
  const lastRow = setSheet.getLastRow();
  if (lastRow <= 1) { ss.toast("⚠️ 套組資料庫是空的", "🚫 錯誤"); return; }
  const setRows = setSheet.getRange(2, 1, lastRow - 1, 6).getValues();
  
  // 🧠 模糊比對：過濾「套餐/全餐/方案/大人/小孩」後比對
  const normalize = (s) => String(s || "").replace(/(套餐|全餐|方案|大人|小孩)/g, "").trim();
  const targetName = normalize(setName);
  const targetSet = setRows.filter(r => normalize(r[0]) === targetName);
  
  if (targetSet.length === 0) {
    const available = [...new Set(setRows.map(r => r[0]).filter(Boolean))].join(", ");
    ss.toast("⚠️ 找不到「" + setName + "」。可用套組：" + available, "🚫 載入中止", 8);
    try { _rebuildGreenButton_(sheet); } catch(e) {}
    return;
  }
  
  ss.toast("⚡️ 載入中...", "⚖️ 皇家報價中心");
  
  // 📋 一次性讀取基本資料（只讀一次，最小 API 呼叫）
  const isAdult = sheet.getName().includes("大人");
  const genderCell = isAdult ? "C38" : "C27";
  const birthCell  = isAdult ? "C39" : "C28";
  
  const gender   = String(sheet.getRange(genderCell).getValue() || "");
  const birthVal = sheet.getRange(birthCell).getValue();
  const jobVal   = isAdult ? String(sheet.getRange("C20").getValue() || "") : "";
  
  let insuranceAge = "";
  try {
    if (birthVal) {
      const ageObj = calculateInsuranceAge(new Date(birthVal));
      insuranceAge = ageObj.age || "";
    }
  } catch(e) {}
  
  let jobLevel = "1";
  if (jobVal.includes("軍") || jobVal.includes("警") || jobVal.includes("消") || jobVal.includes("外勤")) {
    jobLevel = "3";
  } else if (jobVal.includes("業務") || jobVal.includes("司機") || jobVal.includes("危險")) {
    jobLevel = "2";
  }
  
  try {
    const n = targetSet.length;
    
    // 1. 只清內容（保留 checkbox 驗證規則，省去重新 insertCheckboxes 的時間）
    sheet.getRange(44, 1, 50, 11).clearContent();
    
    // 2. 確保使用到的列有 checkbox（只插 n 格，不是 50 格）
    sheet.getRange(44, 1, n, 1).insertCheckboxes();
    
    // 3. 🚀 單次批次寫入 A~I 欄（真正的批次，最快）
    const batchData = targetSet.map(item => [
      true,         // A: 勾選
      item[1],      // B: 保險公司
      item[2],      // C: 商品分類
      item[3],      // D: 商品名稱
      item[4],      // E: 年期
      item[5],      // F: 保額/計畫
      gender,       // G: 性別
      insuranceAge, // H: 保險年齡
      jobLevel      // I: 職級
    ]);
    sheet.getRange(44, 1, n, 9).setValues(batchData);
    
    SpreadsheetApp.flush();
    ss.toast("✅ 「" + setName + "」載入完成！共 " + n + " 項｜性別：" + (gender||"—") + "　年齡：" + (insuranceAge||"—") + "　職級：" + jobLevel, "✨ 發布成功", 5);
    
  } finally {
    try { _rebuildGreenButton_(sheet); } catch(e) {}
  }
}

/** 🌿 輔助：重建綠色「產生視覺化報告」按鈕 */
function _rebuildGreenButton_(sheet) {
  sheet.getRange(42, 6, 1, 2).merge()
    .setValue("🎨 產生視覺化報告")
    .setFontWeight("bold").setBackground("#8BC220").setFontColor("white")
    .setHorizontalAlignment("center").setBorder(true, true, true, true, null, null);
}

/** 🔬 診斷工具：檢查 _SET_DNA_ 內容 */
function debugSetDNA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("_SET_DNA_");
  if (!sh) { Browser.msgBox("❌ 找不到 _SET_DNA_ 分頁！"); return; }
  const rows = sh.getRange(1, 1, sh.getLastRow(), 6).getValues();
  const lines = rows.map((r, i) => i + ": [" + r.join(" | ") + "]").join("\n");
  Browser.msgBox("_SET_DNA_ 內容：\n" + lines);
}

/** 🛠️ 手動載入套組（繞過 onEdit，直接執行此函數測試） */
function manualLoadSet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  if (!sheet.getName().includes("工作區")) {
    Browser.msgBox("請先切換到「大人工作區」或「小孩工作區」再執行。");
    return;
  }
  const setName = "全球全餐";
  applyCommonSet_(sheet, setName);
}

