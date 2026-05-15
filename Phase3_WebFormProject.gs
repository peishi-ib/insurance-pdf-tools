/** 📡 處理網頁端提交的所有數據 (雙效分流版) */
function handleWebIntakeSubmission(fullData) {
  try {
    const flowType = fullData.flowType || 'child';
    const basic = fullData.basicInfo || {};
    const med = fullData.medical || {};
    const disease = fullData.majorDisease || {};
    const resp = fullData.responsibility || {};
    const fin = fullData.final || {};

    const clientName = (basic.nickname || "匿名客戶").trim();
    const lineId = (fin.lineid || "未提供").trim();
    const timeNow = new Date().toLocaleString('zh-TW', { hour12: false });
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 💎 分流 A：大人風險評估 (存入新 Sheet)
    if (flowType === 'adult') {
      const adultSheetName = SHEET_ADULT_INTAKE;
      let adultSheet = ss.getSheetByName(adultSheetName);
      if (!adultSheet) {
        adultSheet = ss.insertSheet(adultSheetName);
        const headers = [
          "時間", "回填人", "性別", "生日", "LINE ID", "每月預算", "優先權重", "規劃動機", 
          "最在意的事情", "期盼醫院", "病房等級", "住院照顧", "薪資補償/日", "醫療雜費", 
          "重疾準備金", "癌症標靶加強", "交通工具", "職務危險程度", "失能月補償", 
          "扶養對象/歲數", "債務餘額", "既有保單資料"
        ];
        adultSheet.appendRow(headers).setFontWeight("bold").setBackground("#D9EAD3").setFrozenRows(1);
      }
      
      const rank = resp.r_priorityRank || "未排序";
      const adultRow = [
        timeNow, clientName, basic.b_gender_adult || "", fin.birth || "", lineId, fin.bud_ad || "", 
        rank, fin.ad_motivation_step4 || "", fin.ad_features || fin.ad_memo || "", med.m_hospital || "", 
        med.m_ward || "", med.m_caregiver || "", med.m_salary || "", med.m_miscellaneous || "", 
        disease.d_major || "", resp.ad_cancer || "", fin.ad_transport || "", resp.ad_job || "", 
        resp.ad_dis_m || "", resp.ad_life_detail || "", resp.ad_debt || "", fin.ad_existing_policy || ""
      ];
      adultSheet.appendRow(adultRow);
      
      // 🚀 同步到評估工作清單 (讓後續能一鍵產出報告書)
      syncToAdultWorksheet(fullData); 
      
      // 大人版戰報推送
      pushLineMessage(MY_LINE_ID, `💼 大人版戰報！「${clientName}」資料已入庫！\n⸻⸻⸻\n📊 優先：${rank}\n💰 預算：${fin.bud_ad}\n🏠 責任：${resp.ad_life_detail || "無"}\n⸻⸻⸻\n🚦 詳情請查閱【${SHEET_ADULT_INTAKE}】表格。`);
    } 
    
    // 👶 分流 B：小孩風險評估 (原本的「問卷自動入庫」)
    else {
      const intakeSheetName = SHEET_CHILD_INTAKE;
      let intakeSheet = ss.getSheetByName(intakeSheetName);
      if (!intakeSheet) intakeSheet = ss.insertSheet(intakeSheetName);
      
      // 初始化標題 (維持您 P3 的 23 欄位)
      if (intakeSheet.getLastRow() === 0) {
        const headers = ["時間", "回填人(暱稱)", "寶寶暱稱", "性別", "生日/預產期", "LINE ID", "推薦人", "每月預算", "優先權重(1>2>3)", "父母健診意願", "最在意或擔心的事", "期盼醫院", "病房等級", "住院照顧者", "薪資補償/日", "醫療雜費額度", "重大傷病金", "防癌強化需求", "失能準備金", "燒燙傷強化", "規劃動機", "期待商品條件", "既有保單資料"];
        intakeSheet.appendRow(headers).setFontWeight("bold").setBackground("#D9EAD3").setFrozenRows(1);
      }
      
      const childName = (basic.childNick || "新手寶寶").trim();
      const rank = resp.r_priorityRank || "未排序";
      const childRow = [
        timeNow, clientName, childName, basic.b_gender || "", fin.birth || "", lineId, basic.referrer || "無", 
        resp.bud_ch || "", rank, resp.r_healthCheck || "", fin.memo || "無", 
        med.m_hospital || "", med.m_ward || "", med.m_caregiver || "", med.m_salary || "", med.m_miscellaneous || "", 
        disease.d_major || "", disease.d_cancer || "", disease.d_disability || "", disease.d_burn || "", 
        fin.final_motivation || "", fin.final_features || "", fin.final_existing || ""
      ];
      intakeSheet.appendRow(childRow);
      
      // 自動連動 CRM
      const taskDetails = `[小孩] 預算：${resp.bud_ch} | 優先：${rank}`;
      updateOrAppendCRMRow(clientName, "報告製作", taskDetails, `寶寶：${childName}`, "進度中");
 
      // 小孩版戰報推送
      pushLineMessage(MY_LINE_ID, `👑 皇家戰報！「${clientName}」資料全拆解入庫！\n⸻⸻⸻\n👶 寶寶：${childName}\n💰 預算：${resp.bud_ch}\n📈 優先：${rank}\n⸻⸻⸻\n🚦 詳情請查閱【問卷自動入庫】表格。`);
    }

    return { success: true, message: "資料已分流存入試算表！" };
  } catch (err) {
    console.error("❌ 報錯內容：", err);
    return { success: false, message: "後台系統報警： " + err.toString() };
  }
}
