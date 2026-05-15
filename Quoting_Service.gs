/**
 * 👑 皇家精算控制台 (Quoting Hub) - 後端服務核心
 * 
 * 本檔案負責處理網頁介面與資料庫之間的資料交換。
 */

/** 🚀 取得啟動控制台所需的初始資料 */
function getQuotingInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 取得客戶列表 (從 客戶基本資料)
  const masterSheet = SpreadsheetApp.openById("1AXCIKKp5JnyKYsmGQjbLJGZZhZCRTV21xVxvYawEh9Y").getSheetByName("客戶基本資料");
  const masterData = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 8).getValues();
  const clients = masterData.map(r => ({
    name: String(r[0]).trim(),
    gender: String(r[1]).trim(),
    birthday: r[3],
    job: String(r[4]).trim()
  })).filter(c => c.name);

  // 2. 取得常用套組 (從 _SET_DNA_)
  const setSheet = ss.getSheetByName("_SET_DNA_");
  let commonSets = [];
  if (setSheet) {
    const setData = setSheet.getRange(2, 1, setSheet.getLastRow() - 1, 6).getValues();
    const setsMap = {};
    setData.forEach(r => {
      const setName = String(r[0]).trim();
      if (!setName) return;
      if (!setsMap[setName]) setsMap[setName] = [];
      setsMap[setName].push({
        company: r[1],
        category: r[2],
        name: r[3],
        term: r[4],
        plan: r[5]
      });
    });
    commonSets = Object.keys(setsMap).map(name => ({ name, items: setsMap[name] }));
  }

  // 3. 取得商品主檔 (從 _DB_CACHE_)
  const dbCache = ss.getSheetByName("_DB_CACHE_");
  const dbData = dbCache.getRange(2, 1, dbCache.getLastRow() - 1, 10).getValues();
  const products = dbData.map(r => ({
    pid: String(r[0]),
    company: String(r[1]),
    category: String(r[2]),
    name: String(r[3]),
    type: r[4],
    logic: r[5],
    minAmount: r[6],
    defaultAmount: r[7],
    commonOptions: String(r[8]).split(",").map(o => o.trim()).filter(Boolean),
    unitBase: r[9] || 10000
  }));

  return {
    clients,
    commonSets
    // ✋ 不再回傳 products，改由搜尋觸發
  };
}

/** 🔍 關鍵優化：伺服器端搜尋 (Server-side Search) */
function searchProducts(query) {
  if (!query || query.length < 2) return [];
  
  const cache = CacheService.getScriptCache();
  const cacheKey = "SEARCH_INDEX";
  let products = JSON.parse(cache.get(cacheKey) || "null");

  // 如果快取沒有索引，從外部資料庫的「常用商品資料庫」抓取
  if (!products) {
    const dbId = "1_K0zfrtuuOpCdAatjC-9SehY22nCuqzvYMprwFXNcD0";
    const extSs = SpreadsheetApp.openById(dbId);
    const db = extSs.getSheetByName("常用商品資料庫") || extSs.getSheetByName("_DB_CACHE_");
    if (!db) return [];
    
    const lastRow = db.getLastRow();
    const data = db.getRange(2, 1, lastRow - 1, 5).getValues();
    products = data.map(r => ({ pid: r[0], company: r[1], category: r[2], name: r[3], type: r[4] }));
    cache.put(cacheKey, JSON.stringify(products), 21600); 
  }

  const q = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.company.toLowerCase().includes(q)
  ).slice(0, 15); // 只回傳前 15 筆，保證速度
}

/** 📦 內部：獲取可用套組清單 (加入快取) */
function getAvailableSetsInternal_(type) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "SETS_CACHE_" + type;
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const setSheet = ss.getSheetByName("_SET_DNA_");
    if (!setSheet) return [];
    
    const lastRow = setSheet.getLastRow();
    if (lastRow < 2) return [];

    const data = setSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const uniqueSets = [...new Set(data.map(r => r[0]))].filter(s => s);
    
    let result = [];
    if (type === 'adult') {
      result = uniqueSets.filter(s => s.includes("大人") || s.includes("全餐") && !s.includes("小孩"));
    } else {
      result = uniqueSets.filter(s => s.includes("小孩") || s.includes("全餐") && !s.includes("大人"));
    }
    
    cache.put(cacheKey, JSON.stringify(result), 3600); // 緩存 1 小時
    return result;
  } catch (e) {
    return [];
  }
}

/** 🏢 獲取分頁物件 (防止空白字元或大小寫問題) */
function getSheetSafe_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
  const sheets = ss.getSheets();
  return sheets.find(s => s.getName().trim() === name.trim());
}

/** 👥 獲取精算上下文 (極速版：一次回傳所有 UI 啟動資料) */
function getQuotingContext(type) {
  let ctx = {
    type: type,
    clients: { top5: [], dropdown: [] },
    sets: [],
    companies: ["全球人壽", "台灣人壽", "遠雄人壽"],
    _error: null
  };

  try {
    ctx.clients = getRecentClientsInternal_(type);
    ctx.sets = getAvailableSetsInternal_(type);
    ctx.companies = getAvailableCompanies();
    return ctx;
  } catch (e) {
    ctx._error = e.message;
    return ctx;
  }
}

/** 🏢 獲取所有保險公司清單 */
function getAvailableCompanies() {
  const dbId = "1_K0zfrtuuOpCdAatjC-9SehY22nCuqzvYMprwFXNcD0";
  
  try {
    const extSs = SpreadsheetApp.openById(dbId);
    const db = extSs.getSheetByName("常用商品資料庫") || extSs.getSheetByName("_DB_CACHE_");
    if (!db) return ["全球人壽", "台灣人壽", "遠雄人壽"];
    
    const lastRow = db.getLastRow();
    const data = db.getRange(2, 2, lastRow - 1, 1).getValues();
    const list = [...new Set(data.map(r => String(r[0]).trim()))].filter(Boolean);
    return list.length > 0 ? list : ["全球人壽"];
  } catch (e) {
    return ["全球人壽", "台灣人壽", "遠雄人壽"];
  }
}

/** 🔍 分層搜尋：根據公司 & 類型 (主約/附約) 獲取商品 */
function getProductsByFilter(company, type) {
  const dbId = "1_K0zfrtuuOpCdAatjC-9SehY22nCuqzvYMprwFXNcD0";
  const extSs = SpreadsheetApp.openById(dbId);
  const db = extSs.getSheetByName("常用商品資料庫") || extSs.getSheetByName("_DB_CACHE_");
  
  if (!db) return [];
  
  const lastRow = db.getLastRow();
  const data = db.getRange(2, 1, lastRow - 1, 5).getValues();
  const products = data.map(r => ({ pid: r[0], company: r[1], category: r[2], name: r[3], type: r[4] }));

  return products.filter(p => 
    String(p.company).trim() === String(company).trim() && 
    (type === 'all' || String(p.type).trim() === String(type).trim())
  );
}

/** 📊 批次精算引擎：計算保費並自動對應保障項目 */
function calculateQuote(clientInfo, selectedItems) {
  const dbId = "1_K0zfrtuuOpCdAatjC-9SehY22nCuqzvYMprwFXNcD0";
  const extSs = SpreadsheetApp.openById(dbId);
  const rateData = extSs.getSheetByName("費率資料庫").getDataRange().getValues();
  const benefitData = extSs.getSheetByName("給付定義表").getDataRange().getValues();

  return selectedItems.map(item => {
    // 1. 尋找匹配費率
    const premium = calculateSinglePremium_(rateData, item.pid, item.plan, item.term, clientInfo.gender, clientInfo.age, clientInfo.occ);
    
    // 2. 尋找匹配保障詳情 (給付定義表 A:ProductID, B:Plan, C:摘要內容)
    const bMatch = benefitData.find(b => String(b[0]) === String(item.pid) && String(b[1]) === String(item.plan));
    const summary = bMatch ? bMatch[2] : "無詳情資料";

    return {
      ...item,
      premium: premium,
      summary: summary
    };
  });
}

/** 🦷 輔助：計算單筆保費 (精簡版) */
function calculateSinglePremium_(rateData, pid, plan, term, gender, age, occ) {
  const genderKey = (gender.includes("男")) ? "M" : "F";
  const planStr = String(plan).trim();
  
  const match = rateData.find(r => 
    String(r[0]) === String(pid) &&
    (String(r[1]) === planStr || String(r[1]).includes(planStr)) &&
    String(r[2]).trim().toUpperCase() === genderKey &&
    parseInt(r[3]) === parseInt(age) &&
    String(r[4]) === String(term) &&
    parseInt(r[6] || 1) === parseInt(occ || 1)
  );

  return match ? match[7] : 0;
}

/** 輔助：清理金額輸入 (將計畫別或品名轉為純數字) */
function cleanAmountInput_(input, unitBase) {
  if (!input) return 0;
  const str = String(input).replace(/計畫|計劃|單位|元/g, "").trim();
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}


/** 💾 將精算結果存回試算表 */
function saveQuoteToSpreadsheet(type, clientName, items, clientInfo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (type === 'adult') ? "大人工作區" : "小孩工作區";
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("找不到工作區分頁: " + sheetName);

  // 1. 清空舊數據 (從 44 行開始)
  const lastRow = Math.max(sheet.getLastRow(), 94);
  sheet.getRange(44, 1, lastRow - 43, 11).clearContent();

  // 2. 準備批次數據
  const batchData = items.map(item => [
    true,                   // A: 勾選
    item.company,           // B: 保險公司
    item.category,          // C: 商品分類
    item.name,              // D: 商品名稱
    item.term,              // E: 年期
    item.plan,              // F: 保額/計畫
    clientInfo.gender,      // G: 性別
    clientInfo.age,         // H: 保險年齡
    clientInfo.occ || "1",  // I: 職級
    item.premium,           // J: 保費
    item.summary || ""      // K: 給付摘要
  ]);

  if (batchData.length > 0) {
    sheet.getRange(44, 1, batchData.length, 11).setValues(batchData);
    sheet.getRange(44, 1, batchData.length, 1).insertCheckboxes();
  }

  // 3. 更新客戶核心基本資料 (重要：為了能連動產出報告)
  if (type === 'adult') {
    sheet.getRange("C3").setValue(clientName);           // 姓名
    sheet.getRange("C38").setValue(clientInfo.gender);   // 性別
    sheet.getRange("C4").setValue(clientInfo.age + " 歲"); // A4: 保險年齡
    // 如果有生日
    if (clientInfo.birthday) sheet.getRange("C39").setValue(Utilities.formatDate(new Date(clientInfo.birthday), "GMT+8", "yyyy/MM/dd"));
  } else {
    // 小孩版：C3 為父母, C4 為寶寶
    sheet.getRange("C4").setValue(clientName);           // 寶寶暱稱
    sheet.getRange("C27").setValue(clientInfo.gender);   // 性別
    if (clientInfo.birthday) sheet.getRange("C28").setValue(Utilities.formatDate(new Date(clientInfo.birthday), "GMT+8", "yyyy/MM/dd"));
  }

  return "✅ 已成功同步到試算表！\n您可以回到試算表點擊「🎨 產出視覺化報告」了。";
}

/** 🛡️ 數值清洗工具：將任何輸入轉為純數字 */
function cleanValue(input) {
  if (typeof input === 'number') return input;
  const str = String(input || "").replace(/[^0-9.]/g, "");
  return parseFloat(str) || 0;
}

/** 👥 獲取精算上下文 (精簡版：優先讓畫面顯示) 已由上方更新 */

/** 🔍 內部：獲取最近填表的客戶 */
function getRecentClientsInternal_(type) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = (type === 'adult') ? "大人問卷" : "小孩問卷";
    const sheet = getSheetSafe_(sheetName);
    if (!sheet) return { top5: [], dropdown: [] };

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { top5: [], dropdown: [] };

    // 抓取最後 50 筆來進行篩選
    const startRow = Math.max(2, lastRow - 49);
    const numRows = lastRow - startRow + 1;
    const data = sheet.getRange(startRow, 1, numRows, 10).getValues();
    
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 12);

    const allClients = data.map((row) => {
      const timestamp = new Date(row[0]);
      if (isNaN(timestamp.getTime())) return null;
      
      // 🎯 修正對齊：大人(B:名, C:性, D:生) / 小孩(C:暱稱, D:性, E:生)
      const name = (type === 'adult') ? row[1] : row[2];
      const gender = (type === 'adult') ? row[2] : row[3];
      const birthday = (type === 'adult') ? row[3] : row[4];
      
      if (!name || String(name).trim() === "") return null;

      return {
        name: String(name).trim(),
        gender: String(gender).trim(),
        birthday: birthday,
        timestamp: timestamp,
        dateStr: Utilities.formatDate(timestamp, "GMT+8", "MM/dd HH:mm")
      };
    }).filter(c => c !== null);

    // 日期從新到舊
    allClients.sort((a, b) => b.timestamp - a.timestamp);
    const threeMonthList = allClients.filter(c => c.timestamp >= threeMonthsAgo);
    const top5 = allClients.slice(0, 5);

    return { top5: top5, dropdown: threeMonthList };
  } catch (e) {
    return { top5: [], dropdown: [] };
  }
}

/** 📦 內部：獲取可用套組清單 (加入快取) */
function getAvailableSetsInternal_(type) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "SETS_CACHE_" + type;
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const setSheet = ss.getSheetByName("_SET_DNA_");
    if (!setSheet) return [];
    
    const lastRow = setSheet.getLastRow();
    if (lastRow < 2) return [];

    const data = setSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const uniqueSets = [...new Set(data.map(r => r[0]))].filter(s => s);
    
    let result = [];
    if (type === 'adult') {
      result = uniqueSets.filter(s => s.includes("大人") || s.includes("組合") || s.includes("餐") || s.includes("家庭"));
    } else {
      result = uniqueSets.filter(s => s.includes("小孩") || s.includes("寶寶") || s.includes("新手") || s.includes("全餐"));
    }
    
    cache.put(cacheKey, JSON.stringify(result), 3600); // 緩存 1 小時
    return result;
  } catch (e) {
    return [];
  }
}

/** 🧬 計算單一客戶的精算屬性 (完整版：包含風險評估答案) */
function getClientActuarialDetails(type, clientName) {
  const sheetName = (type === 'adult') ? "大人問卷" : "小孩問卷";
  const sheet = getSheetSafe_(sheetName);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  
  const nameCol = (type === 'adult') ? 1 : 2;
  const row = data.find(r => String(r[nameCol]).trim() === clientName.trim());
  
  if (!row) return null;
  
  const birthday = (type === 'adult') ? row[3] : row[4];
  const ageObj = calculateInsuranceAgeInternal_(new Date(birthday));
  
  // 🎯 職業自動換算
  let occLevel = 1;
  const occRaw = String(row[17] || "");
  if (occRaw.includes("外勤") || occRaw.includes("司機") || occRaw.includes("警")) occLevel = 3;
  else if (occRaw.includes("工程") || occRaw.includes("業務")) occLevel = 2;

  // 📝 風險報告書必備答案 (根據截圖 1 的欄位對齊)
  return {
    name: clientName,
    gender: (type === 'adult') ? row[2] : row[3],
    birthday: birthday,
    age: ageObj.age,
    occ: occLevel,
    budget: row[5],        // 每月預算
    priority: row[6],      // 優先序
    motivation: row[7],     // 規劃動機
    concern: row[8],       // 最在意的事
    problems: row[9],      // 現狀問題
    wardLevel: row[10],    // 病房等級
    medicalPref: row[11],  // 醫療偏好
    cancerBudget: row[12], // 癌症預留
    accidentPrep: row[13]  // 車禍準備金
  };
}


/** 🚀 皇家流水線：一鍵產出整合 PDF 建議書 (背景執行模式) */
function triggerReportByLine(type, clientName) {
  try {
    const pdfUrl = generateIntegratedPDF(type, clientName);
    const message = `✅ 報告書產出成功！\n\n👤 客戶：${clientName}\n📂 連結：${pdfUrl}\n\n📋 [長按複製說明文字]：\n您好，這是為您規劃的專屬建議書。內容包含風險缺口診斷與精選組合，請點擊連結查閱。有任何問題歡迎隨時詢問！`;
    
    // 如果有設定 LINE API，則發送訊息
    // sendLinePushMessage_(message); 
    
    return message;
  } catch (e) {
    return "❌ 產出失敗：" + e.message;
  }
}

/** ⚙️ 核心引擎：渲染 HTML 並轉為 PDF */
function generateIntegratedPDF(type, clientName) {
  const clientInfo = getClientActuarialDetails(type, clientName);
  if (!clientInfo) throw new Error("找不到客戶資料：" + clientName);

  // 1. 抓取已儲存的建議商品 (改良版：動態抓取非空資料)
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (type === 'adult') ? "大人工作區" : "小孩工作區";
  const sheet = ss.getSheetByName(sheetName);
  
  // 這裡假設資料在 B 到 J 欄，我們抓取整張表的資料後進行過濾
  const allData = sheet.getDataRange().getValues();
  let tableRows = "";
  let totalPremium = 0;
  let stats = { "醫療": 0, "意外": 0, "癌症": 0, "壽險": 0, "其他": 0 };
  let hasItems = false;

  allData.forEach(row => {
    // 判斷邏輯：如果 B 欄有公司名且 E 欄有品名，就算是一筆有效保單
    const comp = String(row[1] || "").trim();
    const cat = String(row[2] || "").trim();
    const name = String(row[3] || "").trim();
    const term = String(row[4] || "").trim();
    const plan = String(row[5] || "").trim();
    const premStr = String(row[8] || "0").replace(/[^0-9]/g, "");
    const prem = parseInt(premStr) || 0;

    if (comp && name && (comp.includes("人壽") || prem > 0)) {
      hasItems = true;
      tableRows += `<tr><td style="color:#2c3e50;">${comp}</td><td style="color:#2c3e50;">${name}</td><td>${term}</td><td>${plan}</td><td style="text-align:right;">$${Number(prem).toLocaleString()}</td></tr>`;
      totalPremium += prem;

      if (cat.includes("醫") || cat.includes("實")) stats["醫療"]++;
      else if (cat.includes("意") || cat.includes("傷")) stats["意外"]++;
      else if (cat.includes("癌") || cat.includes("重")) stats["癌症"]++;
      else if (cat.includes("壽")) stats["壽險"]++;
      else stats["其他"]++;
    }
  });

  if (!hasItems) {
    tableRows = "<tr><td colspan='5' style='text-align:center; color:#999; padding:20px;'>尚未選取商品或試算表中無資料</td></tr>";
  }

  // 2. 準備圓餅圖 (優化網址格式並加入強效參數)
  const chartConfig = {
    type: 'doughnut',
    data: {
      labels: Object.keys(stats),
      datasets: [{ 
        data: Object.values(stats), 
        backgroundColor: ['#2DB7F5', '#8BC220', '#FF9F43', '#FF5252', '#9BC53D'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: { 
      plugins: { 
        datalabels: { display: true, color: '#fff' },
        legend: { display: true, position: 'bottom' }
      } 
    }
  };
  // 加入 bkg: white 確保背景不透明，方便 PDF 渲染
  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=350&bkg=white&f=png`;

  // 3. 填充模板
  let html = HtmlService.createHtmlOutputFromFile('Report_Template').getContent();
  const replacements = {
    '{{CLIENT_NAME}}': clientName,
    '{{DATE}}': Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd"),
    '{{BUDGET}}': clientInfo.budget || "依建議",
    '{{CONCERN}}': clientInfo.concern || "全面保障",
    '{{MOTIVATION}}': clientInfo.motivation || "風險轉嫁",
    '{{WARD}}': clientInfo.wardLevel || "單人房",
    '{{CANCER_BUDGET}}': clientInfo.cancerBudget || "200萬",
    '{{ACCIDENT_PREP}}': clientInfo.accidentPrep || "500萬",
    '{{QUOTE_TABLE_ROWS}}': tableRows,
    '{{TOTAL_PREMIUM}}': `$ ${totalPremium.toLocaleString()}`,
    '{{CHART_URL}}': chartUrl,
    '{{MAIN_RISK}}': Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b)
  };

  Object.keys(replacements).forEach(key => {
    html = html.replace(new RegExp(key, 'g'), replacements[key]);
  });

  // 4. 轉換為 PDF 並存檔
  const blob = Utilities.newBlob(html, 'text/html', 'report.html')
                 .getAs('application/pdf')
                 .setName(`${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd")}_${clientName}_保險建議書.pdf`);
  
  const folder = DriveApp.getRootFolder(); // 之後可以改成特定資料夾
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}


/** 🧪 一鍵測試按鈕：請在編輯器上方選擇執行此函數 */
function runTestReport() {
  const testClient = '王小明'; // 這裡請換成您分頁中有的名字
  const result = triggerReportByLine('adult', testClient);
  Logger.log(result);
  console.log("PDF 產出連結：" + result);
}

/** 🔄 自動化按鈕：重新計算工作區內所有保單的保費與保障 */
function recalculateCurrentSelection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // 決定目前是大人還是小孩
  const mode = (ss.getName().includes("大人")) ? "adult" : "child";
  const sheet = ss.getActiveSheet();
  
  // 1. 從上方固定區域 (1~41行) 讀取客戶精算基本資料
  // 假設：C3=姓名, C4=性別, C5=生日, C28=年齡, C29=職級
  const clientInfo = {
    name: sheet.getRange("C1").getValue(), // 這裡依您的實際格子調整
    gender: sheet.getRange("C4").getValue(),
    age: sheet.getRange("C28").getValue(),
    occ: sheet.getRange("C29").getValue() || 1
  };
  
  if (!clientInfo.age) {
    Browser.msgBox("⚠️ 錯誤：找不到客戶保險年齡，請先確認上方資料正確填寫。");
    return;
  }

  // 2. 獲取 42 行之後的選購商品
  const lastRow = sheet.getLastRow();
  if (lastRow < 42) return;
  
  // 抓取 D(ID), E(名稱), F(年期), G(計畫)
  const productRange = sheet.getRange(42, 4, lastRow - 41, 4); 
  const productData = productRange.getValues();
  
  // 3. 呼叫精算引擎計算
  const items = productData.map(r => ({ pid: r[0], name: r[1], term: r[2], plan: r[3], gender: clientInfo.gender, age: clientInfo.age, occ: clientInfo.occ }));
  const results = calculateQuote(clientInfo, items);
  
  // 4. 將保費回填至 I 欄 (9), 摘要回填至 J 欄 (10)
  const premiumOutput = results.map(r => [r.premium]);
  const summaryOutput = results.map(r => [r.summary]);
  
  sheet.getRange(42, 9, results.length, 1).setValues(premiumOutput);
  sheet.getRange(42, 10, results.length, 1).setValues(summaryOutput);
  
  Browser.msgBox("✅ 精算完成！保費與保障摘要已更新至 I 與 J 欄。");
}

/** 🚀 皇家流水線：一鍵產出整合 PDF 建議書 (背景執行模式) */
function triggerReportByLine(type, clientName) {
  try {
    const pdfUrl = generateIntegratedPDF(type, clientName);
    const message = `✅ 報告書產出成功！\n\n👤 客戶：${clientName}\n📂 連結：${pdfUrl}\n\n📋 [長按複製說明文字]：\n您好，這是為您規劃的專屬建議書。內容包含風險缺口診斷與精選組合，請點擊連結查閱。有任何問題歡迎隨時詢問！`;
    return message;
  } catch (e) {
    return "❌ 產出失敗：" + e.message;
  }
}

/** ⚙️ 核心引擎：渲染 HTML 並轉為 PDF */
function generateIntegratedPDF(type, clientName) {
  const clientInfo = getClientActuarialDetails(type, clientName);
  if (!clientInfo) throw new Error("找不到客戶資料：" + clientName);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (type === 'adult') ? "大人工作區" : "小孩工作區";
  const sheet = ss.getSheetByName(sheetName);
  const allData = sheet.getDataRange().getValues();
  let tableRows = "";
  let totalPremium = 0;
  let stats = { "醫療": 0, "意外": 0, "癌症": 0, "壽險": 0, "其他": 0 };
  let hasItems = false;

  allData.forEach(row => {
    const comp = String(row[1] || "").trim();
    const cat = String(row[2] || "").trim();
    const name = String(row[3] || "").trim();
    const term = String(row[4] || "").trim();
    const plan = String(row[5] || "").trim();
    const prem = parseInt(String(row[8] || "0").replace(/[^0-9]/g, "")) || 0;

    if (comp && name && (comp.includes("人壽") || prem > 0)) {
      hasItems = true;
      tableRows += `<tr><td style="color:#2c3e50;">${comp}</td><td style="color:#2c3e50;">${name}</td><td>${term}</td><td>${plan}</td><td style="text-align:right;">$${Number(prem).toLocaleString()}</td></tr>`;
      totalPremium += prem;
      if (cat.includes("醫") || cat.includes("實")) stats["醫療"]++;
      else if (cat.includes("意") || cat.includes("傷")) stats["意外"]++;
      else if (cat.includes("癌") || cat.includes("重")) stats["癌症"]++;
      else if (cat.includes("壽")) stats["壽險"]++;
      else stats["其他"]++;
    }
  });

  if (!hasItems) tableRows = "<tr><td colspan='5' style='text-align:center; color:#999; padding:20px;'>尚未選取商品或試算表中無資料</td></tr>";

  const chartConfig = {
    type: 'doughnut',
    data: {
      labels: Object.keys(stats),
      datasets: [{ data: Object.values(stats), backgroundColor: ['#2DB7F5', '#8BC220', '#FF9F43', '#FF5252', '#9BC53D'], borderWidth: 2, borderColor: '#ffffff' }]
    },
    options: { plugins: { datalabels: { display: true, color: '#fff' }, legend: { display: true, position: 'bottom' } } }
  };
  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=350&bkg=white&f=png`;

  let html = HtmlService.createHtmlOutputFromFile('Report_Template').getContent();
  const replacements = { '{{CLIENT_NAME}}': clientName, '{{DATE}}': Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd"), '{{BUDGET}}': clientInfo.budget || "依建議", '{{CONCERN}}': clientInfo.concern || "全面保障", '{{MOTIVATION}}': clientInfo.motivation || "風險轉嫁", '{{WARD}}': clientInfo.wardLevel || "單人房", '{{CANCER_BUDGET}}': clientInfo.cancerBudget || "200萬", '{{ACCIDENT_PREP}}': clientInfo.accidentPrep || "500萬", '{{QUOTE_TABLE_ROWS}}': tableRows, '{{TOTAL_PREMIUM}}': `$ ${totalPremium.toLocaleString()}`, '{{CHART_URL}}': chartUrl, '{{MAIN_RISK}}': Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b) };
  Object.keys(replacements).forEach(key => { html = html.replace(new RegExp(key, 'g'), replacements[key]); });

  const blob = Utilities.newBlob(html, 'text/html', 'report.html').getAs('application/pdf').setName(`${Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd")}_${clientName}_保險建議書.pdf`);
  const file = DriveApp.getRootFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/** 🧪 一鍵測試按鈕：請在編輯器上方選擇執行此函數 */
function runTestReport() {
  const testClient = '周阿方'; 
  const result = triggerReportByLine('adult', testClient);
  Logger.log(result);
}

/** 🦷 輔助：計算精算年齡 (保險年齡) */
function calculateInsuranceAgeInternal_(birthDate) {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  let m = now.getMonth() - birthDate.getMonth();
  if (now.getDate() < birthDate.getDate()) m--;
  let totalMonths = age * 12 + m;
  let finalAge = Math.floor(totalMonths / 12);
  if (totalMonths % 12 >= 6) finalAge += 1;
  return { age: finalAge };
}
