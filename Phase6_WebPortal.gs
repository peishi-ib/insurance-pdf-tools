/**
 * 佩璽保險自動化系統 - 旗艦門戶引擎 (單機開發 / 免驗證穩定版)
 */

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  // 1. 客戶戰情看板路由 (當網址有 ?page=crm 時)
  if (params.page === 'crm') {
    return HtmlService.createHtmlOutputFromFile('CrmDashboard')
      .setTitle('佩璽私密戰情室')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 2. 資料 API (供 LINE 或 看板抓取資料用)
  if (params.action === 'getCrmData') return getCrmDataForWeb();
  if (params.action === 'editRow') return updateCrmRow(params.uid, params.updates);
  if (params.action === 'updateStatus') return updateCrmStatus(params.uid, params.status);

  // 3. 其餘頁面路由 (報告系統、精算組合器)
  try {
    // 處理報告頁面 (clientId 或 auth/main)
    if (params.id || params.page === 'auth' || params.page === 'main') {
      const type = params.type || 'child';
      if (params.page === 'auth' && !params.admin) {
        let t = HtmlService.createTemplateFromFile('Portal_Auth');
        t.clientId = params.id; t.type = type;
        return t.evaluate().setTitle("🔒 安全驗證").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      } else {
        let t = HtmlService.createTemplateFromFile('Portal_Main');
        t.reportData = getReportData(params.id, type);
        return t.evaluate().setTitle("✨ 專屬風險評估報告").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
    } 
    // 處理組合器 (hub)
    else if (params.page === 'hub') {
      const template = HtmlService.createTemplateFromFile('Quoting_Hub'); 
      template.initialContext = getQuotingContext(params.type || 'adult');
      return template.evaluate().setTitle("👑 皇家保險組合器").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    // 預設進入首頁 (問卷系統)
    else {
      return HtmlService.createHtmlOutputFromFile('index')
        .setTitle("吳佩璽保險經紀人｜風險評估旗艦系統")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (err) {
    return HtmlService.createHtmlOutput("⚠️ 系統連線異常: " + err.message);
  }
}

/** 🚀 內部通訊專用：讓看板能直接拿到資料 */
function getCrmDataDirectly() {
  var response = getCrmDataForWeb(); 
  return JSON.parse(response.getContent()); 
}

/** 🔐 伺服器端驗證：生日對碰 */
function verifyBirthday(clientId, type, inputBirth) {
  const data = getRawClientData(clientId, type);
  if (!data) return { success: false, msg: "找不到客戶資料" };
  const targetBirth = String(data.birth).replace(/[^0-9]/g, "");
  const cleanInput = String(inputBirth).replace(/[^0-9]/g, "");
  return (cleanInput === targetBirth) ? { success: true } : { success: false, msg: "生日驗證失敗。" };
}

/** 📊 核心精算：從工作區抓取數據 */
function getReportData(clientId, type) {
  const clientRaw = getRawClientData(clientId, type);
  const products = getClientProductsFromWorksheet(clientRaw.name, type);
  
  let summary = {
    medical: { ward: 0, misc: 0, surg: 0, premium: 0 },
    disease: { major: 0, premium: 0 },
    accident: { death: 0, premium: 0 },
    life: { premium: 0 },
    other: { premium: 0 },
    finance: { budget: clientRaw.budget || 0, premium: 0, monthAvg: 0 },
    distribution: [] 
  };
  
  products.forEach(p => {
    summary.finance.premium += p.premium;
    const cat = String(p.category || "");
    if (cat.includes("醫療") || cat.includes("日額")) summary.medical.premium += p.premium;
    else if (cat.includes("傷病") || cat.includes("防癌")) summary.disease.premium += p.premium;
    else if (cat.includes("意外") || cat.includes("傷害")) summary.accident.premium += p.premium;
    else if (cat.includes("壽險") || cat.includes("壽")) summary.life.premium += p.premium;
    else summary.other.premium += p.premium;

    const benefits = getBenefitDetails(p.productId); 
    benefits.forEach(b => {
      if (b.category.includes("日額")) summary.medical.ward += b.value;
      if (b.category.includes("雜費")) summary.medical.misc += b.value;
      if (b.category.includes("重大傷病")) summary.disease.major += b.value;
    });
  });
  
  summary.finance.monthAvg = Math.round(summary.finance.premium / 12);
  return { clientName: clientRaw.name, type: type, summary: summary, products: products };
}

/** 📥 讀取工作區中「已勾選」的商品清單 */
function getClientProductsFromWorksheet(clientName, type) {
  const wsName = (type === 'child') ? "小孩工作區" : "大人工作區";
  const ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(wsName);
  const data = ws.getRange(44, 1, 50, 10).getValues();
  
  let products = [];
  data.forEach(row => {
    if (row[0] === true && row[3]) { 
      products.push({
        company: row[1], category: row[2], name: row[3], plan: row[4], premium: parseFloat(row[9]) || 0, productId: row[0]
      });
    }
  });
  return products;
}

/** 🧬 從外部庫抓取商品的基因明細 */
function getBenefitDetails(productId) {
  const extSs = getExtDb();
  if (!extSs) return [];
  const data = extSs.getSheetByName("給付定義表").getDataRange().getValues();
  return data.slice(1)
             .filter(r => r[0] === productId)
             .map(r => ({ category: r[1], value: parseFloat(r[2]), unit: r[3] }));
}

/** 🛠️ 輔助：讀取原始客戶資料 */
function getRawClientData(id, type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName((type === 'child') ? "小孩問卷回覆" : "大人問卷回覆");
  const data = sheet.getRange(parseInt(id) + 1, 1, 1, 10).getValues()[0];
  if (type === 'child') {
    return { name: data[1], babyName: data[2], birth: data[4], budget: parseFloat(data[7]) };
  } else {
    return { name: data[1], birth: data[3], budget: parseFloat(data[5]) };
  }
}

/** 🔍 輔助：根據品名找 ID */
function getProductIdByDetails(company, name) {
  const extSs = getExtDb();
  const data = extSs.getSheetByName("常用商品資料庫").getDataRange().getValues();
  const row = data.find(r => r[1] === company && r[3] === name);
  return row ? row[0] : "";
}

function getExtDb() {
  const id = PropertiesService.getUserProperties().getProperty('PRODUCT_DB_ID');
  return id ? SpreadsheetApp.openById(id) : null;
}
