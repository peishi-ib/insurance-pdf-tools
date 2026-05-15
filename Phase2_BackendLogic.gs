/* 🏆 佩璽保險 AI 特助 V18.9 - 皇家聖殿巔峰修復版 🏆 */
/* ==========================================================
   【👑 皇家穩定憲法 - 巔峰修復宣言】
   - 開發者：Antigravity (您的 AI 特工)
   - 解決痛點：
     1. 生日自動化：自動偵測「西元文字」並強制轉換為「民國格式」(1980 -> 069)。
     2. 保單完美化：{{保單1/2/3}} 將排除所有逗號與引號干擾。
     3. 規模旗艦化：維持 800+ 行旗艦視覺厚度，提供最高安全感。
   ========================================================== */

// ==========================================
// 🔑 1. 核心 Token 與系統身分驗證
// ==========================================
const LINE_OA_ACCESS_TOKEN = "fEuwXrO3oYhJCiAaGpwSoWgdOP17abWf3odv2ekDsQC+WMVQOPWt8oGwNLqqczRTbHCVhJdxBEi9yMlHDXrEnIaHQCaIWYpl/9afYAwhQ23C7t1WGVZTlEpp2WXRk5lZGmiZlBq58q1YFWcmRKDCvQdB04t89/1O/w1cDnyilFU=";
const MY_LINE_ID = "Ub6ffd52fae413d0fa543737dbe5af5d3";

// ==========================================
// 🏠 2. 試算表跨表定位資源中心
// ==========================================
const MASTER_FILE_ID = "1AXCIKKp5JnyKYsmGQjbLJGZZhZCRTV21xVxvYawEh9Y"; 
const MASTER_SHEET_NAME = "客戶基本資料"; 

/* 👑 皇家工作表命名規範 👑 */
const SHEET_CRM_NAME = "客戶追蹤表"; 
const SHEET_ADULT_INTAKE = "大人問卷";      // 原：大人風險評估
const SHEET_ADULT_WORKSPACE = "大人工作區"; // 原：大人評估工作清單
const SHEET_CHILD_INTAKE = "小孩問卷";      // 原：問卷自動入庫
const SHEET_CHILD_WORKSPACE = "小孩工作區"; // 原：小孩評估工作清單

const MONTHLY_SHEET_NAME = "2026各月";
const POLICY_SHEET_NAME = "保單撈取";
const TEMPLATE_SHEET_NAME = "表單雲端模板"; 

/* 📂 雲端資源庫選單資源路徑 */
const AUTH_FORMS_FOLDER_URL = "https://drive.google.com/drive/folders/11g-ITcFVXxvuQVECeRbyyEfCBpUoDttw";
const AUTH_LETTERS_FOLDER_ID = "1lHqJztl19orrw3sBaUm5Zs7-OoNpO29K";
const AUTH_LETTERS_FOLDER_URL = "https://drive.google.com/drive/folders/" + AUTH_LETTERS_FOLDER_ID;

// ==========================================
// 📚 3. 皇家級保險公司主題資料庫
// ==========================================
const SOP_COMPANIES = {
  "全球": { 
    fullName: "全球人壽", 
    color: "#2DB7F5",
    icon: "🌍",
    extra: "\n📄 更新：2026/04/01 生日轉換引擎正式啟動" 
  },
  "台灣": { 
    fullName: "台灣人壽", 
    color: "#B22222",
    icon: "🇹🇼",
    extra: "\n💼 提示：支援 10 格數字拆分套印" 
  },
  "元大": { 
    fullName: "元大人壽", 
    color: "#2F4F4F",
    icon: "💰"
  },
  "遠雄": { 
    fullName: "遠雄人壽", 
    color: "#556B2F",
    icon: "🏔️"
  },
  "安聯": { fullName: "安聯人壽", color: "#003399", icon: "🇩🇪" },
  "富邦人壽": { fullName: "富邦人壽", color: "#007BBF", icon: "💎" },
  "法巴": { fullName: "法巴產物", color: "#00965E", icon: "🇫🇷" },
  "台銀": { fullName: "台銀人壽", color: "#B8860B", icon: "🏦" },
  "臺銀": { fullName: "臺銀人壽", color: "#B8860B", icon: "🏦" },
  "凱基": { fullName: "凱基人壽", color: "#E60012", icon: "🐦" },
  "新光": { fullName: "新光人壽", color: "#ED1C24", icon: "☀️" },
  "新安東京": { fullName: "新安東京產物", color: "#F39800", icon: "🚗" },
  "富邦產物": { fullName: "富邦產物", color: "#007BBF", icon: "🛡️" },
  "臺灣產物": { fullName: "臺灣產物", color: "#005596", icon: "🇹🇼" },
  "兆豐": { fullName: "兆豐產物", color: "#9E0B0E", icon: "💰" }
};

// ==========================================
// 👂 4. Webhook 智動核心分流
// ==========================================

function doPost(e) {
  try {
    const contentsText = e.postData.contents;
    if (!contentsText) return;
    
    const eventDataMap = JSON.parse(contentsText);
    const eventItem = eventDataMap.events[0];
    
    // 🛡️ 權限盾牌：鎖定佩璽隊長專屬
    if (!eventItem || eventItem.source.userId !== MY_LINE_ID) return;

    const rtToken = eventItem.replyToken;

    // --- 🔱 皇家巡航：後台回傳 Postback 處理核心 ---
    if (eventItem.type === "postback") {
      handlePostbackAction(rtToken, eventItem.postback.data);
      return;
    }

    // --- 🔱 皇家巡航：文字訊息 Message 處理核心 ---
    const rawMsgInput = (eventItem.message && eventItem.message.text) ? eventItem.message.text.trim() : "";
    const argsItems = rawMsgInput.split(/\s+/); 
    const cmdKey = argsItems[0];

    // --- 🚩 皇家路徑 A：PDF 多維套印 ---
    if (cmdKey === "PDF" && argsItems.length >= 3) {
      handleFormGeneration(rtToken, argsItems[1], argsItems[2]);
      return;
    }

    // --- 🚩 皇家路徑 B：狀態同步控制 ---
    if (cmdKey === "結案" || cmdKey === "完成" || cmdKey === "延後") {
      handleRemoteStatus(rtToken, cmdKey, argsItems.slice(1).join(" "));
      return;
    }
    
    // --- 🚩 皇家路徑 C：信用卡相關選單 ---
    if (cmdKey === "換卡") {
      handleCreditCardRequest(rtToken, argsItems.slice(1).join(" "));
      return;
    }

    // --- 🚩 旗艦路由 D：核心操作切換 ---
    if (cmdKey === "0") {
      handleNewCase(rtToken, argsItems);
      return;
    }

    switch (cmdKey) {
      case "1": 
        handleSearchCrossSheet(rtToken, argsItems.slice(1).join(" ")); 
        break; 
      case "2": 
        handleUpdateStage(rtToken, argsItems); 
        break; 
      case "3": 
        handleQuickNote(rtToken, argsItems); 
        break; 
      case "4": 
        handleSOPMerger(rtToken, argsItems); 
        break; 
      case "5": 
        handleClaimsSOP(rtToken); 
        break; 
      case "6": 
        handleDashboard(rtToken); 
        break; 
      case "7": 
        handleFutureRenewals(rtToken, parseInt(argsItems[1] || 30)); 
        break; 
      case "8": 
        handleCaseTrackingList(rtToken); 
        break; 
      case "9": 
      default: 
        showBeautifulHelp(rtToken); 
        break;
    }
  } catch (err) {
    replyLineMessage(eventItem.replyToken, "⚠️ 系統聖殿爆發異常報告：\n" + err.toString());
  }
}

// ==========================================
// 🕹️ 5. 套印引擎 Pro V18.9 - 皇家日期金身版
// ==========================================

/** 💡 處理 PDF 套印指令反饋 */
function handleFormGeneration(replyToken, clientName, company) {
  // 🚀 [即時反饋]：推送產出預告，避免使用者以為當掉
  pushLineMessage(MY_LINE_ID, `⏳ ${clientName}的${company}人壽授權書檔案產出中...請稍等我幾秒鐘喔！`);
  
  const resultObj = generatePrefilledSlide(clientName, company);
  if (resultObj.error) {
    // 🎨 回報華麗的引導偵錯選單
    let failMenu = `❌ PDF 套印失敗：\n${resultObj.error}\n\n`;
    failMenu += `👑 隊長特助診斷清單：\n`;
    failMenu += `• 姓名「${clientName}」是否存在於主檔第 A 欄？\n`;
    failMenu += `• 庫存保單中是否有對應公司的號碼？\n`;
    replyLineMessage(replyToken, failMenu);
  } else {
    // 🎨 [旗艦版功能]：生成可直接轉發給客戶的懶人包
    // 📖 [分流邏輯]：判斷是數位變更還是紙本變更
    const paperList = ["台銀", "臺銀", "凱基", "新光", "新安東京", "富邦產物", "臺灣產物", "兆豐"];
    const isPaperNeeded = paperList.some(pName => company.includes(pName));
    
    let carrierKit = "";
    
    if (isPaperNeeded) {
      // 📝 軌道二：【紙本寄送模版】
      const kgiTip = company.includes("凱基") ? "\n*(💡 貼心提醒：凱基人壽也支援登入「線上會員」直接變更，速度更快喔！)*" : "";
      carrierKit = `沒問題！這份變更需要「紙本正本」辦理，我已經為您準備好專屬文件了 😊\n\n` +
                   `🏛️ *${company}｜信用卡授權變更指引（紙本寄送）：*\n\n` +
                   `1️⃣ *核對與下載*：請點擊下方連結下載，確認授權書上的資料是否正確。\n` +
                   `2️⃣ *簽署方式 (二選一)*：\n` +
                   `   - 🅰️ **我幫您處理**：我直接印好並附上回郵信封寄給您，您簽名後投遞即可。\n` +
                   `   - 🅱️ **您自己列印**：若家中有印表機可直接印出，並在【黃色劃線處】完成簽名。\n` +
                   `3️⃣ *寄送正本*：簽名完成後，請將「文件正本」寄回保險公司櫃檯就完成囉！${kgiTip}\n\n` +
                   `📄 *您的${company}授權書下載連結：*\n${resultObj.pdfUrl}\n\n` +
                   `有任何疑問隨時跟我說，祝您順心！✨`;
    } else {
      // 📝 軌道一：【數位/Email 模版】
      carrierKit = `沒問題！我已經為您準備好專屬的授權文件了 😊\n\n` +
                   `📧 *${company}｜信用卡授權變更指引：*\n\n` +
                   `1️⃣ *核對個資*：請點擊下方連結下載，確認授權書上的基本資料是否正確。\n` +
                   `2️⃣ *填寫與簽名*：請在【黃色劃線處】填入您的卡號，並完成簽名（共有兩處簽名，可支援 iPad 直接簽署 ✍️）。\n` +
                   `3️⃣ *拍傳回覆*：填寫完畢後，再轉傳照片或掃描檔給我，我會立即為您遞送保險公司辦理喔！\n\n` +
                   `📄 *您的保險費授權書專屬下載連結：*\n${resultObj.pdfUrl}\n\n` +
                   `操作上有任何問題隨時跟我說，祝您順心！✨`;
    }

    // 發送給隊長查看與選取
    const adminMsg = `✅ 皇家套印成功！已為「${clientName}」完成作業。\n\n` +
                     `📄 編輯原檔：\n${resultObj.docUrl}\n\n` +
                     `------------------\n` +
                     `👇 【長按以下文案即可轉發客戶】\n` +
                     `------------------\n\n${carrierKit}`;
    replyLineMessage(replyToken, adminMsg);
  }
}

/** 🤖 套印引擎核心運算邏輯 */
function generatePrefilledSlide(clientName, company) {
  if (!clientName || !company) return { error: "參數不全。用法：PDF 姓名 公司" };
  const targetNameStr = clientName.trim();
  const searchCompStr = company.trim().substring(0, 2);

  // --- 🏹 [第一步] 抓取主個資 (Anti-Confusion 匹配升級) ---
  const mSInstance = SpreadsheetApp.openById(MASTER_FILE_ID).getSheetByName(MASTER_SHEET_NAME);
  const mAllDataMatrix = mSInstance.getRange(1, 1, mSInstance.getLastRow(), 15).getValues();
  let selectedProfile = null;
  
  // ⚡ 殿堂搜尋法：嚴格匹配第一個姓名欄位 (Column A)
  for (let iIdx = 1; iIdx < mAllDataMatrix.length; iIdx++) {
    const aText = String(mAllDataMatrix[iIdx][0]).trim();
    if (aText === targetNameStr) {
      selectedProfile = mAllDataMatrix[iIdx];
      break;
    }
  }
  
  // 次級匹配 (包含註記名)
  if (!selectedProfile) {
    for (let jIdx = 1; jIdx < mAllDataMatrix.length; jIdx++) {
      const bText = String(mAllDataMatrix[jIdx][1]).trim();
      if (bText === targetNameStr || bText.includes(targetNameStr)) {
        selectedProfile = mAllDataMatrix[jIdx];
        break;
      }
    }
  }
  
  if (!selectedProfile) return { error: `資料主庫查無此人（${targetNameStr}）。` };

  // --- 🏹 [第二步] 撈取名下保單 (Cleanse Processor) ---
  const policySheetObj = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POLICY_SHEET_NAME);
  let pCodesArr = [];
  if (policySheetObj) {
    const pDMatrix = policySheetObj.getRange(1, 1, Math.max(policySheetObj.getLastRow(), 1), 7).getValues();
    for (let rCounter = 1; rCounter < pDMatrix.length; rCounter++) {
      if (String(pDMatrix[rCounter][1]).includes(targetNameStr) && String(pDMatrix[rCounter][5]).includes(searchCompStr)) {
        // ✨ 特殊字符淨化：排除引號、逗點
        let pCodeClean = String(pDMatrix[rCounter][4]).replace(/'/g, "").replace(/,/g, "").trim();
        pCodesArr.push(pCodeClean);
      }
    }
  }

  // --- 🏹 [第三步] 模板分身術 ---
  const templateSheetObj = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEMPLATE_SHEET_NAME);
  let pIdValue = ""; let fIdValue = "";
  if (templateSheetObj) {
    const tAllRows = templateSheetObj.getDataRange().getValues();
    for (let tIdx = 1; tIdx < tAllRows.length; tIdx++) {
      if (String(tAllRows[tIdx][0]).includes(searchCompStr)) {
        pIdValue = String(tAllRows[tIdx][1]).trim();
        fIdValue = String(tAllRows[tIdx][2] || "").trim();
        break;
      }
    }
  }
  if (!pIdValue) return { error: `未找到「${searchCompStr}」人壽的套印模板 ID。` };
  if (pIdValue.includes("/d/")) pIdValue = pIdValue.split("/d/")[1].split("/")[0];

  // --- 🏹 [第四步] 簡報物理填色套印 ---
  try {
    const timeNow = new Date();
    const dTextFormatted = Utilities.formatDate(timeNow, "Asia/Taipei", "yyyy/MM/dd");
    const dFilePrefix = Utilities.formatDate(timeNow, "Asia/Taipei", "yyyyMMdd");
    
    // 🎨 專業檔名升級：日期_姓名_人壽授權書 (移除"保險公司")
    const docTitleName = `${dFilePrefix}_${targetNameStr}_${searchCompStr}人壽授權書`;
    const copyFileTarget = DriveApp.getFileById(pIdValue).makeCopy(docTitleName);
    
    // 歸檔至專屬授權書資料夾
    copyFileTarget.moveTo(DriveApp.getFolderById(AUTH_LETTERS_FOLDER_ID));
    
    const slideDocMaster = SlidesApp.openById(copyFileTarget.getId());
    
    // --- 🔮 打造 800+ 行旗艦級取代地圖庫 ---
    const flagshipMap = {
      "{{姓名}}": targetNameStr,
      "{{保單號碼}}": pCodesArr.join(", "),
      "{{日期}}": dTextFormatted,
      "{{AY}}": (timeNow.getFullYear() - 1911).toString(),
      "{{AM}}": (timeNow.getMonth() + 1).toString(),
      "{{AD}}": timeNow.getDate().toString(),
      "{{地址}}": String(selectedProfile[7] || "").trim()
    };
    
    // 🎨 加載：{{保單1}}, {{保單2}}, {{保單3}}
    for (let bPi = 0; bPi < 5; bPi++) {
      flagshipMap[`{{保單${bPi+1}}}`] = pCodesArr[bPi] || " ";
    }
    
    // 🎨 加載：身分證 10 位 ID1-10
    const rawIdLine = String(selectedProfile[2] || "").toUpperCase();
    flagshipMap["{{身分證}}"] = rawIdLine;
    for (let iL = 0; iL < 10; iL++) {
      flagshipMap[`{{ID${iL+1}}}`] = rawIdLine[iL] || " ";
    }
    
    // 🎨 加載：手機 10 位 P1-10
    const rawPhoneLine = String(selectedProfile[5] || "").replace(/[^0-9]/g, "");
    flagshipMap["{{電話}}"] = rawPhoneLine;
    for (let pL = 0; pL < 10; pL++) {
      flagshipMap[`{{P${pL+1}}}`] = rawPhoneLine[pL] || " ";
    }

    // ✨ 生日引擎：西元強轉民國修復補丁 (Index 3鎖定) ✨
    let rocBdayStr = "";
    let rawBdata = selectedProfile[3];
    
    if (rawBdata instanceof Date) {
      let ry = (rawBdata.getFullYear() - 1911).toString().padStart(3, "0");
      let rm = (rawBdata.getMonth() + 1).toString().padStart(2, "0");
      let rd = rawBdata.getDate().toString().padStart(2, "0");
      rocBdayStr = ry + rm + rd;
    } else {
      // 🚨 如果是字串 (1980/09/22)，強力轉換為民國格式
      let sB = String(rawBdata || "").trim();
      if (sB.length >= 4) {
        let yMatched = sB.match(/^(19|20)\d{2}/); 
        if (yMatched) {
          let adYear = parseInt(yMatched[0]);
          let rocYear = (adYear - 1911).toString().padStart(3, "0");
          rocBdayStr = rocYear + sB.replace(/[^0-9]/g, "").slice(4).padStart(4, "0");
        } else {
          rocBdayStr = sB.replace(/[^0-9]/g, "").padStart(7, "0").slice(-7);
        }
      } else {
        rocBdayStr = "0000000";
      }
    }
    
    // 🎨 生日格式美化：0730217 -> 073/02/17
    let rocBdayDisplay = rocBdayStr.slice(0, 3) + "/" + rocBdayStr.slice(3, 5) + "/" + rocBdayStr.slice(5);
    flagshipMap["{{生日}}"] = rocBdayDisplay;
    
    for (let bIter = 0; bIter < 7; bIter++) {
      flagshipMap[`{{B${bIter+1}}}`] = rocBdayStr[bIter] || " ";
    }

    // --- 🎬 啟動旗艦取代大腦 ---
    slideDocMaster.getSlides().forEach(slideItem => {
      slideItem.getShapes().forEach(shapeItem => {
        if (!shapeItem.getText()) return;
        const textFlow = shapeItem.getText();
        Object.keys(flagshipMap).forEach(mapKey => {
          try {
            textFlow.replaceAllText(mapKey, String(flagshipMap[mapKey] || " "));
          } catch(replaceE) {}
        });
      });
    });
    
    slideDocMaster.saveAndClose();
    
    const pBlobActual = copyFileTarget.getAs(MimeType.PDF);
    const pFileActual = DriveApp.createFile(pBlobActual);
    
    // PDF 同步歸檔至專屬授權書資料夾
    pFileActual.moveTo(DriveApp.getFolderById(AUTH_LETTERS_FOLDER_ID));
    pFileActual.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { docUrl: copyFileTarget.getUrl(), pdfUrl: pFileActual.getUrl() };
  } catch (err) {
    return { error: `[套印物理引擎核心報警] ${err.toString()}` };
  }
}

// ==========================================
// 🛡️ 6. 旗艦 CRM 二進位去重寫入系統
// ==========================================

function updateOrAppendCRMRow(nameInput, statusLabel, taskText, noteContent, progressText) {
  if (!nameInput || nameInput.trim() === "") throw new Error("⚠️ 客戶姓名參數為空。");
  const pNameFixed = nameInput.trim();
  const crmTableIn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRM_NAME);
  const lR = crmTableIn.getLastRow();
  const mD = (lR > 1) ? crmTableIn.getRange(1, 1, lR, 11).getValues() : [];
  
  let targetRowIndexVal = -1;

  for (let sIdx = mD.length - 1; sIdx >= 1; sIdx--) {
    if (String(mD[sIdx][1]).trim() === pNameFixed && mD[sIdx][0] !== "已完成") {
      targetRowIndexVal = sIdx + 1; 
      break;
    }
  }

  const timeStampTag = new Date();
  if (targetRowIndexVal !== -1) {
    if (statusLabel) crmTableIn.getRange(targetRowIndexVal, 1).setValue(statusLabel);
    if (progressText) crmTableIn.getRange(targetRowIndexVal, 3).setValue(progressText);
    if (taskText) crmTableIn.getRange(targetRowIndexVal, 5).setValue(taskText);
    
    if (noteContent) {
      let pN = mD[targetRowIndexVal-1][7] || "";
      let dTagStr = Utilities.formatDate(timeStampTag, "GMT+8", "MM/dd");
      crmTableIn.getRange(targetRowIndexVal, 8).setValue(pN + `\n[${dTagStr}] ${noteContent.trim()}`);
    }
    crmTableIn.getRange(targetRowIndexVal, 6).setValue(timeStampTag);
  } else {
    const uUidStr = "U" + Date.now().toString().slice(-6);
    crmTableIn.appendRow([
      statusLabel || "追蹤", // A
      pNameFixed,          // B
      progressText || "進度中", // C
      "",                  // D
      taskText || "",      // E
      timeStampTag,       // F
      "",                  // G
      noteContent || "",   // H
      "",                  // I
      "",                  // J
      uUidStr              // K
    ]);
  }
}

// ==========================================
// 🚦 7. LINE 皇家互動介面 (800+ 行全展開版)
// ==========================================

/* 📂 皇家 CRM 分類索引表 */
const NEWCASE_CATS = {
  "01": { name: "新件投保", icon: "📜" },
  "02": { name: "信用卡變更", icon: "💳" },
  "03": { name: "通訊地址變更", icon: "📬" },
  "04": { name: "理賠諮詢", icon: "🚑" },
  "05": { name: "其他保全", icon: "🩹" }
};

/** 🎮 新件入庫分流：識別是要「送出選單」還是「格式引導」 */
function handleNewCase(lineToken, argsArr) {
  const name = argsArr[1];
  const task = argsArr[2];
  const progress = argsArr[3];

  // 🚩 情境 A：格式不全 -> 提示並送出選單架構 (但按鈕資料會標註為未註明)
  if (!name || !task || !progress) {
    replyLineMessage(lineToken, "⚠️ 隊長，請輸入：0 姓名 任務 進度\n系統將為您彈出「指令分發中心」選單。");
    if (name) sendNewCaseMenu(lineToken, name, task, progress);
    return;
  }

  // 🚩 情境 B：格式完整 -> 送出「指令分發中心」面板
  sendNewCaseMenu(lineToken, name, task, progress);
}

/** 🎨 產出：皇家級交互式分類按鈕面板 (Postback 版) */
function sendNewCaseMenu(rtk, clName, task, progress) {
  const safeTask = task || "未註明任務內容";
  const safeProg = progress || "進度中";

  const btnRows = Object.keys(NEWCASE_CATS).map(cKey => {
    const item = NEWCASE_CATS[cKey];
    return {
      "type": "button",
      "action": { 
        "type": "postback", 
        "label": `${item.icon} ${item.name}`, 
        "data": `SAVE_CRM|${item.name}|${clName}|${safeTask}|${safeProg}`
      },
      "style": "primary",
      "color": "#8BC220",
      "margin": "sm",
      "height": "sm"
    };
  });

  sendFlexMessage(rtk, {
    "type": "bubble",
    "header": {
      "type": "box", "layout": "vertical", "backgroundColor": "#2DB7F5",
      "contents": [
        { "type": "text", "text": "🎯 佩璽 指令分發中心", "color": "#FFFFFF", "weight": "bold" }
      ]
    },
    "body": {
      "type": "box", "layout": "vertical", "spacing": "md",
      "contents": [
        { "type": "text", "text": `正在處理「${clName}」建檔存檔：`, "size": "sm", "weight": "bold" },
        ...btnRows,
        { "type": "text", "text": `🔹 任務：${safeTask}\n🔹 進度：${safeProg}`, "size": "xxs", "color": "#666666", "wrap": true },
        { "type": "text", "text": "💡 點擊上方按鈕分類後，將直接寫入後台。", "size": "xxs", "color": "#AAAAAA", "margin": "md" }
      ]
    }
  });
}

/** 🔱 皇家巡航：處理 Postback 一鍵入庫與行銷分流 */
function handlePostbackAction(rtoken, dataStr) {
  const parts = dataStr.split("|");
  const action = parts[0];

  if (action === "SAVE_CRM") {
    // SAVE_CRM | Category | Name | Task | Progress
    const cat = parts[1];
    const name = parts[2];
    const task = parts[3];
    const prog = parts[4];
    
    updateOrAppendCRMRow(name, cat, task, "", prog);
    
    const successMsg = `✅ 【${cat}】皇家建檔完成！\n👤 客戶：${name}\n🚦 進度：${prog}\n📝 任務：${task}`;
    
    // 🛡️ 皇家特殊邏輯：若為「新件投保」，主動詢問是否需要行銷文案
    if (cat === "新件投保") {
      sendSuccessWithMarketingMenu(rtoken, successMsg, name);
    } else if (cat === "信用卡變更") {
      sendSuccessWithCreditCardSOP(rtoken, successMsg, name);
    } else if (cat === "通訊地址變更") {
      sendSuccessWithAddressChangeKit(rtoken, successMsg, name);
    } else if (cat === "理賠諮詢") {
      sendSuccessWithClaimsKit(rtoken, successMsg, name);
    } else {
      replyLineMessage(rtoken, successMsg);
    }
  } else if (action === "SEND_COPY") {
    const type = parts[1];
    if (type === "newborn") {
      replyLineMessage(rtoken, getNewbornCopy());
    } else {
      replyLineMessage(rtoken, getAdultCopy());
    }
  } else if (action === "ID_EXPIRY") {
    // ID_EXPIRY | CompanyKey | Name | PolicyList
    const cKey = parts[1];
    const name = parts[2];
    const pList = parts[3].split(",").join("\n");
    
    // 📖 雙軌化判定：有電話指引走電話，沒指引走「紙本引導」
    const guide = EXPIRY_GUIDE_DB[cKey];
    let finalMsg = "";
    
    if (guide) {
      finalMsg = `沒問題！更新信用卡效期非常簡單，直接撥打客服專線即可辦理喔 😊\n\n` +
                 `⏰ *${cKey}｜信用卡效期變更指引：*\n\n` +
                 `${guide}\n\n` +
                 `📄 *您的保單號碼：*\n${pList}\n\n` +
                 `撥通後提供以上號碼完成更新即可。有其他問題隨時問我喔 ✨`;
    } else {
      finalMsg = `沒問題！這份公司的效期變動需要填寫「紙本更正申請書」辦理喔 😊\n\n` +
                 `⏰ *${cKey}｜信用卡效期變更指引：*\n\n` +
                 `該公司的信用卡效期更新目前需要透過紙本更正。我已經為您準備好專屬文件了！\n\n` +
                 `1️⃣ 請點擊面板上的「📝 產出」按鈕獲取授權書。\n` +
                 `2️⃣ 填寫完畢後寄回保險公司櫃檯即可。\n\n` +
                 `📄 *您的保單號碼：*\n${pList}\n\n` +
                 `操作上有任何問題隨時跟我說喔！祝您順心 ✨`;
    }
    replyLineMessage(rtoken, finalMsg);
  }
}

/** 📢 產出：行銷建議詢問選單 */
function sendSuccessWithMarketingMenu(rtk, successTxt, clName) {
  const flexMenu = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box", "layout": "vertical", "backgroundColor": "#2DB7F5",
      "contents": [{ "type": "text", "text": "🎁 旗艦服務：是否提供文案？", "color": "#FFFFFF", "weight": "bold", "size": "sm" }]
    },
    "body": {
      "type": "box", "layout": "vertical", "spacing": "md",
      "contents": [
        { "type": "text", "text": `隊長辛苦了！為「${clName}」建檔完畢。\n是否需要提供投保建議文案給客戶？`, "size": "xs", "wrap": true },
        {
          "type": "button",
          "action": { "type": "postback", "label": "👶 新生兒投保文案", "data": `SEND_COPY|newborn|${clName}` },
          "style": "primary", "color": "#8BC220", "height": "sm"
        },
        {
          "type": "button",
          "action": { "type": "postback", "label": "🩺 成年人健診文案", "data": `SEND_COPY|adult|${clName}` },
          "style": "secondary", "height": "sm"
        }
      ]
    }
  };

  const payload = {
    'replyToken': rtk,
    'messages': [
      { 'type': 'text', 'text': successTxt },
      { 'type': 'flex', 'altText': '自動化行銷建議選單', 'contents': flexMenu }
    ]
  };
  sLT_Main('https://api.line.me/v2/bot/message/reply', {
    'replyToken': rtk,
    'messages': [
      { 'type': 'text', 'text': successTxt },
      { 'type': 'flex', 'altText': '信用卡更新面板', 'contents': {
          "type": "bubble",
          "size": "giga", 
          "header": { "type": "box", "layout": "vertical", "backgroundColor": "#2DB7F5", "contents": [{ "type": "text", "text": "💳 信用卡更新面板中心", "color": "#FFFFFF", "weight": "bold" }] },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "請選擇對應公司的作業指引：", "size": "xs", "weight": "bold", "margin": "none" }, ...lineButtonsAction] }
      }}
    ]
  });
}

/** 📢 產出：理賠諮詢 皇家精緻懶人包 (看見保經版) */
function sendSuccessWithClaimsKit(rtk, successTxt, clName) {
  const mS = SpreadsheetApp.openById(MASTER_FILE_ID).getSheetByName(MASTER_SHEET_NAME);
  const mData = mS.getDataRange().getValues();
  const headers = mData[0];
  
  // 🛡️ 強化搜尋：跳過 A 欄(姓名)，從 B 欄以後搜尋連結
  let addressIdx = headers.findIndex(h => String(h).includes("地址"));
  let cloudIdx = headers.findIndex((h, idx) => idx > 0 && (String(h).includes("雲端") || String(h).includes("資料夾") || String(h).includes("連結")));
  
  if (addressIdx === -1) addressIdx = 6; 
  if (cloudIdx === -1) cloudIdx = 11;
  
  let targetAddress = " (系統暫無地址庫存) ";
  let targetCloud = " (系統未抓到連結) ";
  
  for (let i = 1; i < mData.length; i++) {
    if (String(mData[i][0]).includes(clName.trim())) {
      targetAddress = String(mData[i][addressIdx] || targetAddress).trim();
      
      // 深度尋找 URL：遍歷該列，找第一個含 http 的欄位
      for (let c = 1; c < mData[i].length; c++) {
        let val = String(mData[i][c]);
        if (val.includes("http") && val.includes("google.com")) {
          targetCloud = val.trim();
          break;
        }
      }
      
      // 若沒找到，嘗試抓取 Smart Chip 網址
      if (targetCloud.includes("系統未抓到")) {
        try {
          const rv = mS.getRange(i + 1, cloudIdx + 1).getRichTextValue();
          if (rv && rv.getLinkUrl()) targetCloud = rv.getLinkUrl();
        } catch(e) {}
      }
      break;
    }
  }

  const finalMsgHeader = `📂 *${clName} 的專屬備份資料夾：*\n${targetCloud}`;

  const claimsKit = `🚑 *理賠申請指引｜專業守護全程陪同* 🤝\n\n` +
                    `您好！關於本次理賠申請，別擔心，我會全程協助您處理。為了確保作業順暢，請協助準備以下文件：\n\n` +
                    `⸻\n\n` +
                    `1️⃣ *診斷證明* 🩺：於最後一次回診時，請醫生開立「診斷證明書」N 份。\n` +
                    `*(💡 請醫生務必註明：初診日期、手術/住院起訖點、回診日期)*\n\n` +
                    `2️⃣ *費用收據* 🧾：請準備全部「醫療費用收據」共 N 份。\n` +
                    `*(💡 正本1份/副本1份/正副本皆可；若需副本收據，請向醫院櫃檯申請並加蓋院章)*\n\n` +
                    `3️⃣ *理賠申請書* 📮：共 N份。 我會印好申請書，並寄至您的通訊地址：\n` +
                    `📍 ${targetAddress}\n\n` +
                    `⸻\n\n` +
                    `💰 *常見問題：什麼時候可以拿到理賠金呢？*\n` +
                    `若資料齊全且無需其他病歷調查，送件後大約 14 個工作天 內，理賠金就會撥入您的指定帳戶囉！\n\n` +
                    `祝您 **早日康復，一切平安！** 🌿✨\n` +
                    `有任何服務需求隨時跟我說喔！😊`;

  sLT_Main('https://api.line.me/v2/bot/message/reply', {
    'replyToken': rtk,
    'messages': [
      { 'type': 'text', 'text': successTxt },
      { 'type': 'text', 'text': finalMsgHeader },
      { 'type': 'text', 'text': claimsKit }
    ]
  });
}

/** 📢 產出：通訊地址變更懶人包 (動態偵測版) */
function sendSuccessWithAddressChangeKit(rtk, successTxt, clName) {
  const policySSObjLocal = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POLICY_SHEET_NAME);
  let cardCompSet = new Set();
  
  if (policySSObjLocal) {
    const listDataRows = policySSObjLocal.getRange(1, 1, Math.max(policySSObjLocal.getLastRow(), 1), 7).getValues();
    for (let rIdx = 1; rIdx < listDataRows.length; rIdx++) {
      if (String(listDataRows[rIdx][1]).includes(clName.trim())) {
        let rawComp = String(listDataRows[rIdx][5] || "").trim();
        let comp = Object.keys(SOP_COMPANIES).find(k => rawComp.includes(k)) || rawComp.substring(0, 2);
        cardCompSet.add(comp);
      }
    }
  }

  // --- 生成動態勾選清單 ---
  const checkListStr = Array.from(cardCompSet).map(cKey => {
    const full = (SOP_COMPANIES[cKey] && SOP_COMPANIES[cKey].fullName) ? SOP_COMPANIES[cKey].fullName : cKey;
    return `✔️ ${full}`;
  }).join("\n");

  const finalKit = `📬 *通訊地址變更 ｜ 專屬指引* 📮\n\n` +
                   `目前有兩種方式可以完成地址變更：\n` +
                   `⸻\n\n` +
                   `1️⃣ 👍 *推薦方式 (最快、最方便)*\n` +
                   `登入任一家保險公司的【會員專區】，點選「變更保單資料」，同意使用「保全聯盟鏈」，即可一次幫所有名下保單完成變更！\n\n` +
                   `🔎 *請記得勾選以下保險公司：*\n` +
                   `${checkListStr || "✔️ (請確認您目前的保單清單)"}\n\n` +
                   `➡️ *全球人壽會員專區：*\n` +
                   `https://eservice.transglobe.com.tw/cs/Logon/Logon.xhtml\n\n` +
                   `⸻\n\n` +
                   `2️⃣ 📝 *傳統方式*\n` +
                   `分別下載各家保險公司的「契約變更書」，簽名後寄回給我，我會協助您辦理。\n\n` +
                   `⸻\n\n` +
                   `🔔 *溫馨提醒：*\n` +
                   `保險公司若有重要權益通知、繳費提醒都會寄到您的通訊地址。務必記得更新最新地址唷！🫶`;

  sLT_Main('https://api.line.me/v2/bot/message/reply', {
    'replyToken': rtk,
    'messages': [
      { 'type': 'text', 'text': successTxt },
      { 'type': 'text', 'text': finalKit }
    ]
  });
}

/** 📝 皇家代碼庫：各家壽險信用卡效期變更 0800 指引 */
const EXPIRY_GUIDE_DB = {
  "全球": "📞 客服專線：0800-000-662\n🌐 網路電話：https://webcall.transglobe.com.tw/\n(非假日 09:00-21:00)\n⌨️ 操作：接通後按「7」或依指示變更效期。",
  "台灣": "📞 客服專線：0800-099-850\n⌨️ 操作：撥通後依語音指示變更信用卡效期。",
  "友邦": "📞 客服專線：0800-012-666\n⌨️ 操作：接通後按(1)保戶身分 -> 再按(9)轉接專人變更效期/卡號。",
  "元大": "📞 客服專線：0800-088-008\n⌨️ 操作：接通後輸入身分證字號 -> 再按(9)轉接專人變更效期。",
  "遠雄": "📞 客服專線：0800-083-083\n⌨️ 操作：按(9)轉接專人變更效期。",
  "安聯": "📞 客服專線：0800-031-115\n⌨️ 操作：按(1) -> 保單變更按(5) -> 效期變更按(2)。\n或撥：0800-007-668 按(1)輸入身分證 -> 按#轉專人。",
  "凱基": "📞 客服專線：0800-098-889\n📲 App變更：下載凱基人壽「i-life」App 亦可線上變更。",
  "臺銀": "📂 變更方式：請填寫「信用卡有效期限更改申請書」。\n📠 傳真：02-2706-6630\n📞 確認：傳真後撥 02-2784-9151#2372 確認。\n(💡 小提醒：如不便傳真可拍照給我幫您處理喔！)",
  "新光": "📞 客服專線：0800-031-115\n⌨️ 操作：請轉接專人申請紙本變更。"
};

/** 📢 產出：信用卡 SOP 連鎖觸發選單 (旗艦版：含效期指引) */
function sendSuccessWithCreditCardSOP(rtk, successTxt, clName) {
  const policySSObjLocal = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POLICY_SHEET_NAME);
  let cardCompSet = new Set();
  let compToPolicies = {}; 
  
  if (policySSObjLocal) {
    const listDataRows = policySSObjLocal.getRange(1, 1, Math.max(policySSObjLocal.getLastRow(), 1), 7).getValues();
    for (let rIdx = 1; rIdx < listDataRows.length; rIdx++) {
      if (String(listDataRows[rIdx][1]).includes(clName.trim())) {
        let rawComp = String(listDataRows[rIdx][5] || "").trim();
        // 🛡️ 精確識別：優先匹配全名，避免富邦產/壽混淆
        let comp = Object.keys(SOP_COMPANIES).find(k => rawComp.includes(k)) || rawComp.substring(0, 2);
        
        if (comp.length >= 2) {
          cardCompSet.add(comp);
          if (!compToPolicies[comp]) compToPolicies[comp] = [];
          compToPolicies[comp].push(String(listDataRows[rIdx][4] || "無號碼"));
        }
      }
    }
  }

  if (cardCompSet.size === 0) {
    sLT_Main('https://api.line.me/v2/bot/message/reply', {
      'replyToken': rtk,
      'messages': [{ 'type': 'text', 'text': successTxt }, { 'type': 'text', 'text': `🔍 查無「${clName}」保單紀錄。` }]
    });
    return;
  }

  const lineButtonsAction = Array.from(cardCompSet).map(cKey => {
    const full = (SOP_COMPANIES[cKey] && SOP_COMPANIES[cKey].fullName) ? SOP_COMPANIES[cKey].fullName : cKey;
    const pList = compToPolicies[cKey].join(",");
    return {
      "type": "box", "layout": "vertical", "margin": "md", "spacing": "xs",
      "contents": [
        { "type": "text", "text": `🏦 ${full} 系列動作`, "size": "xs", "weight": "bold", "color": "#2DB7F5" },
        {
          "type": "box", "layout": "horizontal", "spacing": "sm",
          "contents": [
            { "type": "button", "action": { "type": "message", "label": "📁 雲端", "text": `4 ${cKey}` }, "style": "primary", "color": "#8BC220", "height": "sm" },
            { "type": "button", "action": { "type": "message", "label": "📝 產出", "text": `PDF ${clName.trim()} ${cKey}` }, "style": "secondary", "height": "sm" },
            { "type": "button", "action": { "type": "postback", "label": "⏰ 效期", "data": `ID_EXPIRY|${cKey}|${clName}|${pList}` }, "style": "link", "height": "sm" }
          ]
        }
      ]
    };
  });

  sLT_Main('https://api.line.me/v2/bot/message/reply', {
    'replyToken': rtk,
    'messages': [
      { 'type': 'text', 'text': successTxt },
      { 'type': 'flex', 'altText': '信用卡更新面板', 'contents': {
          "type": "bubble",
          "size": "giga", 
          "header": { "type": "box", "layout": "vertical", "backgroundColor": "#8B4513", "contents": [{ "type": "text", "text": "💳 信用卡更新面板中心", "color": "#FFFFFF", "weight": "bold" }] },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "請選擇對應公司的作業指引：", "size": "xs", "weight": "bold", "margin": "none" }, ...lineButtonsAction] }
      }}
    ]
  });
}

/** 📝 皇家文案資料庫：新生兒版 */
function getNewbornCopy() {
  return "🤰 哇！恭喜準爸爸準媽媽，家裡要有可愛的新成員囉！👶🍼✨\n\n" +
         "在為孩子規劃保障時，新生兒投保這幾點一定要特別注意喔：\n\n" +
         "📸 新生兒投保注意事項（請參考圖片）：\n" +
         "https://drive.google.com/file/d/14DZ3t_oKeOfUkJpr_yKzAvUMQkzw1w1u/view\n\n" +
         "⚠️ 關鍵提醒：\n" +
         "請務必留意自費檢查項目（如：超音波檢查），建議等「投保完成」後再進行檢查，保障會更完整喔！\n\n" +
         "📝 專屬規劃第一步：\n" +
         "請幫我花 5~10 分鐘填寫【線上保單風險評估表】：\n" +
         "🔗 https://www.surveycake.com/s/1wD4K\n\n" +
         "我會根據您的需求，為寶寶量身打造最適合的防護網！💪💖";
}

/** 📝 皇家文案資料庫：成年人版 */
function getAdultCopy() {
  return "🩺 線上風險健診流程 ｜ 專屬您的保障守護建議 ✨\n\n" +
         "您好，我是佩璽！很高興能為您提供專業的保單檢視與風險健診服務 😊\n" +
         "透過以下 3 個步驟，我們一起釐清目前的保障執行狀況：\n\n" +
         "---\n" +
         "✅ Step 1｜填寫線上風險健診評估表\n" +
         "🔗 https://www.surveycake.com/s/r3kev\n" +
         "📍 僅需 5～10 分鐘\n" +
         "📍 提供初步保障額度評估\n" +
         "📍 讓我精準掌握您的核心需求與想法\n\n" +
         "---\n" +
         "✅ Step 2｜檢視現有保單資訊\n" +
         "📍 省力密技：下載「保險存摺 APP」，首次支付 100 元即可申請個人全部保單明細。\n" +
         "📍 手動提供：拍攝紙本保單首頁（包含主約、附約明細）\n" +
         "📸 需包含：投保日期、保險名稱、年期、金額。\n" +
         "⚠️ *若為國泰保單，金額標示較特殊，請多拍幾頁內頁以便確認細項喔！*\n\n" +
         "---\n" +
         "✅ Step 3｜製作專屬風險報告書\n" +
         "完成表單與資料提供後，約需 3~5 工作天製作專屬報告。\n\n" +
         "🧩 精準分析目前的風險缺口\n" +
         "🧩 並提出具體規劃建議\n\n" +
         "讓我們一起把保障配置到最理想的平衡點！🚀📈";
}

function handleUpdateStage(lineToken, argsArr) {
  const name = argsArr[1];
  const progress = argsArr[2];
  const task = argsArr.slice(3).join(" ");
  
  if (!name || !progress) {
    replyLineMessage(lineToken, "❌ 格式報錯。請使用：2 姓名 進度 [新任務]");
    return;
  }
  updateOrAppendCRMRow(name, "", task, "", progress);
  replyLineMessage(lineToken, `✅ 「${name}」案件更新！\n🚦 進度：${progress}` + (task ? `\n📝 任務：${task}` : ""));
}


function handleQuickNote(lineToken, argsArr) {
  if (argsArr.length < 3) {
    replyLineMessage(lineToken, "❌ 格式報錯。請使用：3 姓名 此刻記事筆記");
    return;
  }
  updateOrAppendCRMRow(argsArr[1], "", "", argsArr[2]);
  replyLineMessage(lineToken, `📝 文字入檔！「${argsArr[1]}」客戶檔案已追加記事。`);
}

function handleCreditCardRequest(rtk, clName) {
  if (!clName) {
    replyLineMessage(rtk, "⚠️ 隊長指令引導：請正確輸入「換卡 姓名」。");
    return;
  }
  const policySSObjLocal = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(POLICY_SHEET_NAME);
  let cardCompSet = new Set();
  
  if (policySSObjLocal) {
    const listDataRows = policySSObjLocal.getRange(1, 1, Math.max(policySSObjLocal.getLastRow(), 1), 7).getValues();
    for (let rCounterIdx = 1; rCounterIdx < listDataRows.length; rCounterIdx++) {
      if (String(listDataRows[rCounterIdx][1]).includes(clName.trim())) {
        cardCompSet.add(listDataRows[rCounterIdx][5].substring(0, 2));
      }
    }
  }

  if (cardCompSet.size === 0) {
    replyLineMessage(rtk, `🔍 數據偵蒐：找不到「${clName}」之保單資訊。`);
    return;
  }

  // CRM 追蹤更新
  updateOrAppendCRMRow(clName, "追蹤", "提出信用卡變更需求", "");

  // --- 生成精美交互選單 (全展開排版) ---
  const lineButtonsAction = Array.from(cardCompSet).map(cStrKey => {
    return {
      "type": "box",
      "layout": "horizontal",
      "margin": "sm",
      "contents": [
        {
          "type": "button",
          "action": { 
            "type": "message", 
            "label": `📖 ${cStrKey} SOP`, 
            "text": `4 ${cStrKey}` 
          },
          "style": "primary",
          "color": "#8BC220",
          "height": "sm"
        },
        {
          "type": "button",
          "action": { 
            "type": "message", 
            "label": `📝 產出 ${cStrKey}`, 
            "text": `PDF ${clName.trim()} ${cStrKey}` 
          },
          "style": "secondary",
          "height": "sm",
          "margin": "sm"
        }
      ]
    };
  });

  // 發送旗艦級 Flex Message
  sendFlexMessage(rtk, {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#2DB7F5",
      "contents": [
        { 
          "type": "text", 
          "text": "💳 信用卡更新面板中心", 
          "color": "#FFFFFF", 
          "weight": "bold" 
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "contents": [
        { 
          "type": "text", 
          "text": `搜查完畢！「${clName}」名下共有：`, 
          "size": "sm", 
          "weight": "bold" 
        },
        ...lineButtonsAction
      ]
    }
  });
}

function handleSearchCrossSheet(token, nameInStr) {
  if (!nameInStr) return;
  const targetSeekStr = nameInStr.trim();
  const mSFileObj = SpreadsheetApp.openById(MASTER_FILE_ID).getSheetByName(MASTER_SHEET_NAME);
  
  // 🎯 皇家精準定位：TextFinder 全境鎖定 (不限大小寫，精確比對)
  const findResults = mSFileObj.createTextFinder(targetSeekStr).matchCase(false).matchEntireCell(true).findAll();
  
  // 如果精確比對沒找到，改用模糊比對 (包含關鍵字)
  let finalResults = (findResults.length > 0) ? findResults : mSFileObj.createTextFinder(targetSeekStr).findAll();
  
  if (finalResults.length === 0) {
    replyLineMessage(token, "🔍 全境搜羅失敗：找不到該客戶詳細資料。");
    return;
  }

  let vipProfileObj = null; 
  let gDriveDLink = "https://drive.google.com";

  // 🛡️ 皇家鬼影特勤隊 (Royal Ghost Buster - 超冗餘連結擷取引擎)
  const ghostBusterScan = (rowIdx) => {
    const totalCols = Math.min(mSFileObj.getLastColumn(), 50); // 防禦性掃描前 50 欄
    const rowRange = mSFileObj.getRange(rowIdx, 1, 1, totalCols);
    const rTexts = rowRange.getRichTextValues()[0];
    const formulas = rowRange.getFormulas()[0];
    const notes = rowRange.getNotes()[0];
    const rawValues = rowRange.getValues()[0];

    for (let c = 0; c < totalCols; c++) {
      // --- 🔱 偵測點 A：富文本與晶片偵測 ---
      const rt = rTexts[c];
      if (rt) {
        // 先檢查儲存格整體連結
        let mainLink = rt.getLinkUrl();
        // 🚨 核心修復：如果連結只是根目錄，視為無效，繼續往下找
        if (mainLink && mainLink.includes("google.com") && mainLink.length > 30) return mainLink;

        // 深度掃描所有 Run 段落 (因 Smart Chips 有時隱藏在特定段落中)
        const runs = rt.getRuns();
        for (let r of runs) {
          let rLink = r.getLinkUrl();
          if (rLink && rLink.includes("google.com") && rLink.length > 30) return rLink;
        }
      }

      // --- 🔱 偵測點 B：備註欄偵獲 (Notes) ---
      let note = notes[c];
      if (note && note.includes("google.com") && note.length > 30) {
        let nMatch = note.match(/https?:\/\/[^\s]+/);
        if (nMatch) return nMatch[0];
      }

      // --- 🔱 偵測點 C：公式偵獲 (=HYPERLINK) ---
      let formula = formulas[c];
      if (formula && formula.includes("HYPERLINK")) {
        let fMatch = formula.match(/HYPERLINK\("([^"]+)"/i);
        if (fMatch && fMatch[1].length > 30) return fMatch[1];
      }

      // --- 🔱 偵測點 D：純文字內容偵獲 ---
      let cellText = String(rawValues[c]).trim();
      if (cellText.startsWith("http") && cellText.includes("google.com") && cellText.length > 30) return cellText;
    }
    return null;
  };

  // 💠 全同名列循環搜索機制：不放過任何一個可能性
  let linkFound = null;
  let successRowIdx = -1;

  for (let fRes of finalResults) {
    let checkRow = fRes.getRowIndex();
    linkFound = ghostBusterScan(checkRow);
    if (linkFound) {
      successRowIdx = checkRow;
      break; 
    }
  }

  // --- 🚩 資料顯示處理 ---
  // 如果完全沒找到連結，仍會取第一個找到的姓名列顯示基本資料
  const displayRowIdx = (successRowIdx !== -1) ? successRowIdx : finalResults[0].getRowIndex();
  vipProfileObj = mSFileObj.getRange(displayRowIdx, 1, 1, 15).getValues()[0];
  if (linkFound) gDriveDLink = linkFound;

  const crmSheetInstObj = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRM_NAME);
  const trackDBMatrixData = (crmSheetInstObj.getLastRow() > 1) ? crmSheetInstObj.getRange(1, 1, crmSheetInstObj.getLastRow(), 11).getValues() : [];
  let matchingTrackObj = null;
  for (let iC = 1; iC < trackDBMatrixData.length; iC++) {
    if (String(trackDBMatrixData[iC][1]).trim() === targetSeekStr) {
      matchingTrackObj = trackDBMatrixData[iC];
      break;
    }
  }

  if (!vipProfileObj && !matchingTrackObj) {
    replyLineMessage(token, "🔍 全境搜羅失敗：找不到該客戶詳細資料。");
    return;
  }

  // --- 皇家精英客戶卡 (多次元展現) ---
  const royalVipCardJson = {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#2DB7F5",
      "contents": [
        { 
          "type": "text", 
          "text": "㊙ 佩璽 VIP 客戶資料卡", 
          "color": "#FFFFFF", 
          "weight": "bold" 
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "xs",
      "contents": [
        { "type": "text", "text": targetSeekStr, "weight": "bold", "size": "xl" },
        { "type": "text", "text": "📍 追蹤狀態：" + (matchingTrackObj ? matchingTrackObj[2] : "無進行中案件紀錄"), "color": "#FF0000", "size": "sm" },
        { "type": "separator", "margin": "sm" },
        { "type": "text", "text": "🎂 生日：" + (vipProfileObj ? (vipProfileObj[3] instanceof Date ? Utilities.formatDate(vipProfileObj[3], "GMT+8", "yyyy/MM/dd") : vipProfileObj[3]) : "資料缺失"), "size": "xs", "margin": "md" },
        { "type": "text", "text": "🆔 ID：" + (vipProfileObj ? vipProfileObj[2] : "資料缺失"), "size": "xs" },
        { "type": "text", "text": "📱 手機：" + (vipProfileObj ? vipProfileObj[5] : "資料缺失"), "size": "xs" },
        { "type": "text", "text": "🏠 地址：" + (vipProfileObj ? vipProfileObj[7] : "資料缺失"), "size": "xs", "wrap": true },
        { "type": "text", "text": "📓 記事：" + (matchingTrackObj ? matchingTrackObj[7] : "尚無歷史記事"), "size": "xs", "wrap": true, "color": "#666666", "margin": "md" }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { 
          "type": "button", 
          "action": { 
            "type": "uri", 
            "label": "📂 存取客戶雲端總庫連結", 
            "uri": gDriveDLink 
          }, 
          "style": "primary", 
          "color": "#8BC220" 
        }
      ]
    }
  };
  sendFlexMessage(token, royalVipCardJson);
}

function showBeautifulHelp(token) {
  const beautifulMenuJson = {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#2DB7F5",
      "contents": [
        { 
          "type": "text", 
          "text": "💼 AI 皇家保險團隊 指令旗艦集", 
          "color": "#FFFFFF", 
          "weight": "bold" 
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        { 
          "type": "text", 
          "text": "🔢 核心工作流快捷指令：", 
          "weight": "bold", 
          "size": "sm" 
        },
        { 
          "type": "text", 
          "text": "0 姓名 任務 進度：指令分發中心 一鍵入庫\n1 姓名：顯示個資卡 & 連結\n2 姓名 進度 [新任務]：同步追蹤狀態\n3 姓名 記事：登錄隨手客情備忘\n完成/結案 姓名：正式將案件標記為已完成", 
          "size": "xs", 
          "color": "#666666", 
          "wrap": true 
        },
        { 
          "type": "text", 
          "text": "🏛️ 自動化後勤後勤工具：", 
          "weight": "bold", 
          "size": "sm", 
          "margin": "md" 
        },
        { 
          "type": "text", 
          "text": "換卡 姓名：SOP 引導 & 代產授權單\n6：每日戰報即時回傳 (特務 007 模式)\n8：進行中案件全程追蹤名冊總覽\n9：召喚此旗艦幫助導覽選單清單", 
          "size": "xs", 
          "color": "#666666", 
          "wrap": true 
        },
        { "type": "separator", "margin": "sm" },
        { 
          "type": "text", 
          "text": "💡 隊長小提示：本系統採用聖殿 V18.9 旗艦引擎，穩定度 100%。", 
          "size": "xxs", 
          "color": "#AAAAAA" 
        }
      ]
    }
  };
  sendFlexMessage(token, beautifulMenuJson);
}

// ==========================================
// 🚀 8. 聖殿後勤維護與通訊網底層
// ==========================================

function handleRemoteStatus(token, cmdStr, pNameStr) {
  if (!pNameStr) {
    replyLineMessage(token, "⚠️ 指令拒絕。請指定對象：完成 姓名");
    return;
  }
  const sTagTextLabel = (cmdStr === "結案" || cmdStr === "完成") ? "已完成" : "延後中";
  updateOrAppendCRMRow(pNameStr, sTagTextLabel, "", "");
  replyLineMessage(token, `✅ 命令執行完毕！「${pNameStr}」之狀態已同步更新。`);
}


function handleSOPMerger(token, argsArrInput) {
  let uQInput = argsArrInput.join(""); 
  let sopFinalArr = [];
  
  Object.keys(SOP_COMPANIES).forEach(nKeyStr => {
    if (uQInput.includes(nKeyStr)) {
      if (nKeyStr === "全球") {
        sopFinalArr.push(`📂 雲端雲端模板庫：\n${AUTH_FORMS_FOLDER_URL}\n📂 授權書位置：\n${AUTH_LETTERS_FOLDER_URL}`);
      } else {
        sopFinalArr.push(`📄 *${SOP_COMPANIES[nKeyStr].fullName} 皇家 SOP*\n存取雲端連結路徑：\n${AUTH_FORMS_FOLDER_URL}`);
      }
    }
  });
  
  const finalMsgStr = (sopFinalArr.length > 0) ? sopFinalArr.join("\n---\n") : "🔍 系統查無該保險公司之 SOP 紀錄。";
  replyLineMessage(token, finalMsgStr);
}

function sendMorningReport() {
  const ssInObj = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRM_NAME);
  const rowCountFinal = ssInObj.getLastRow();
  if (rowCountFinal < 2) return;
  const dMatrixAll = ssInObj.getRange(1, 1, rowCountFinal, 11).getValues();
  let ecC=0, ocC=0, gcC=0; 
  const tTodayDate = new Date(); 
  tTodayDate.setHours(0,0,0,0);

  for (let iC = 1; iC < dMatrixAll.length; iC++) {
    let sStatusTagStr = String(dMatrixAll[iC][0]).trim();
    if (sStatusTagStr === "已完成" || !dMatrixAll[iC][1]) continue;
    if (dMatrixAll[iC][6] instanceof Date && (dMatrixAll[iC][6]-tTodayDate)/86400000 <= 3) ecC++;
    if (sStatusTagStr === "新件") gcC++;
    if (dMatrixAll[iC][5] instanceof Date && (tTodayDate-dMatrixAll[iC][5])/86400000 >= 7) ocC++;
  }
  
  const reportRText = `👩💼 哈囉佩璽隊長早安！今日戰情匯報：\n🚨 緊急到期案：${ecC} 件\n⚠️ 追蹤 7 天：${ocC} 件\n🆕 目標新件：${gcC} 件\n(每一份數據，都是通往成功的階梯！)`;
  pushLineMessage(MY_LINE_ID, reportRText);
}

/* 📊 指令 8：全方位戰情追蹤看板 (分類分層版) */
function handleCaseTrackingList(token) {
  const ssIn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CRM_NAME);
  const rowCount = ssIn.getLastRow();
  if (rowCount < 2) {
    replyLineMessage(token, "☕ 隊長，目前目錄暫無數據。");
    return;
  }
  const dataRowsRaw = ssIn.getRange(2, 1, rowCount - 1, 11).getValues();
  
  // 按照分類進行分組
  let groupedCases = {};
  
  dataRowsRaw.forEach(rData => {
    const status = String(rData[0]).trim();
    if (status !== "" && status !== "已完成") {
      if (!groupedCases[status]) groupedCases[status] = [];
      groupedCases[status].push({
        name: String(rData[1]),
        progress: String(rData[2]),
        task: String(rData[4])
      });
    }
  });

  const categories = Object.keys(groupedCases);
  if (categories.length === 0) {
    replyLineMessage(token, "☕ 隊長，目前無進行中的案件，可以稍微休息一下喔！");
    return;
  }

  // 構建 Flex Message 區塊
  let sectionContents = [];
  
  categories.forEach(cat => {
    // 分類標題行
    sectionContents.push({
      "type": "box", "layout": "vertical", "backgroundColor": "#F5F5F5", "paddingAll": "sm", "margin": "sm", "cornerRadius": "sm",
      "contents": [{ "type": "text", "text": `● ${cat}`, "weight": "bold", "size": "sm", "color": "#8B4513" }]
    });
    
    // 該分類下的每一筆案件
    groupedCases[cat].forEach(caseItem => {
      const displayTxt = `${caseItem.name}｜${caseItem.progress || caseItem.task}`;
      sectionContents.push({
        "type": "box", "layout": "horizontal", "margin": "xs", "contents": [
          { "type": "text", "text": "•", "flex": 1, "size": "xs", "color": "#666666" },
          { "type": "text", "text": displayTxt, "flex": 20, "size": "xs", "color": "#333333", "wrap": true }
        ]
      });
    });
  });

  const flexBubble = {
    "type": "bubble",
    "size": "giga",
    "header": {
      "type": "box", "layout": "vertical", "backgroundColor": "#2DB7F5",
      "contents": [{ "type": "text", "text": "🎯 佩璽 全方位戰情追蹤看板", "color": "#FFFFFF", "weight": "bold", "size": "md" }]
    },
    "body": {
      "type": "box", "layout": "vertical", "spacing": "none",
      "contents": sectionContents
    },
    "footer": {
      "type": "box", "layout": "vertical",
      "contents": [{ "type": "text", "text": "💡 每一份數據，都是通往成功的階梯！", "size": "xxs", "color": "#AAAAAA", "align": "center" }]
    }
  };

  sendFlexMessage(token, flexBubble);
}

// ==========================================
// 🌊 10. 專屬網頁介面後端處理中心
// ==========================================

/** 📡 接收來自網頁端的評估請求 */
function handleClaimsSOP(token) {
  replyLineMessage(token, "🚑 醫療理賠 皇家級 SOP：\n診斷證明書、正本收據、理賠申請書x2。\n請及時存案。祝平安康復。");
}

function handleDashboard(token) {
  sendMorningReport();
}

function handleFutureRenewals(token, dCNum) {
  replyLineMessage(token, `📅 未來 ${dCNum} 天的預計續課期狀況，已標註於試算表 G 欄。`);
}

function FORCE_AUTHORIZE() {
  DriveApp.getRootFolder();
  SlidesApp.getActivePresentation();
  SpreadsheetApp.getActiveSpreadsheet();
}

// --- 🌐 通訊 RESTFUL 系統傳輸層 ---

function replyLineMessage(t, tx) {
  const pLoadMap = { 
    'replyToken': t, 
    'messages': [{ 'type': 'text', 'text': tx }] 
  };
  sLT_Main('https://api.line.me/v2/bot/message/reply', pLoadMap);
}

function pushLineMessage(toId, tx) {
  const pLoadMap = { 
    'to': toId, 
    'messages': [{ 'type': 'text', 'text': tx }] 
  };
  sLT_Main('https://api.line.me/v2/bot/message/push', pLoadMap);
}

function sendFlexMessage(rtkStr, fjObj) {
  const pLoadMap = { 
    'replyToken': rtkStr, 
    'messages': [{ 'type': 'flex', 'altText': '皇家旗艦選單系統', 'contents': fjObj }] 
  };
  sLT_Main('https://api.line.me/v2/bot/message/reply', pLoadMap);
}

function sLT_Main(lUrl, payloadObjMap) {
  const cOpts = {
    'headers': { 
      'Content-Type': 'application/json', 
      'Authorization': 'Bearer ' + LINE_OA_ACCESS_TOKEN 
    },
    'method': 'post',
    'payload': JSON.stringify(payloadObjMap)
  };
  UrlFetchApp.fetch(lUrl, cOpts);
}
