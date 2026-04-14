#!/usr/bin/env node
/**
 * 港股數據遷移腳本
 * 將港股路徑數據插入 PostgreSQL
 * 節點 ID 使用 hk 前綴（hka, hkb, ...）避免與美股主鍵衝突
 */

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function runMigration() {
  console.log('🇭🇰 開始港股數據遷移...\n');

  try {
    // 1. 為 macros 表添加 market 欄位（如果尚未添加）
    console.log('📊 檢查 macros 表 market 欄位...');
    const macrosColumnCheck = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'macros' AND column_name = 'market'
    `);
    
    if (macrosColumnCheck.rows.length === 0) {
      await query(`
        ALTER TABLE macros ADD COLUMN market VARCHAR(10) DEFAULT 'US'
      `);
      await query(`UPDATE macros SET market = 'US' WHERE market IS NULL`);
      await query(`CREATE INDEX IF NOT EXISTS idx_macros_market ON macros(market)`);
      console.log('✅ macros 表已添加 market 欄位');
    } else {
      console.log('⏭️ macros 表 market 欄位已存在');
    }

    // 2. 清除舊的港股數據（如果存在）
    console.log('\n🧹 清除舊港股數據...');
    await query("DELETE FROM confirm_signals WHERE switch_id LIKE 'hk%'");
    await query("DELETE FROM allocations WHERE node_id LIKE 'hk%'");
    await query("DELETE FROM news_affects WHERE news_id IN (SELECT id FROM news WHERE market = 'HK')");
    await query("DELETE FROM news_related_paths WHERE news_id IN (SELECT id FROM news WHERE market = 'HK')");
    await query("DELETE FROM news_tags WHERE news_id IN (SELECT id FROM news WHERE market = 'HK')");
    await query("DELETE FROM news WHERE market = 'HK'");
    await query("DELETE FROM threshold_alerts WHERE market = 'HK'");
    await query("DELETE FROM alerts WHERE market = 'HK'");
    await query("DELETE FROM switches WHERE market = 'HK'");
    await query("DELETE FROM nodes WHERE market = 'HK'");
    await query("DELETE FROM macros WHERE market = 'HK'");
    console.log('✅ 舊港股數據已清除');

    // 3. 插入港股宏觀指標
    console.log('\n📈 插入港股宏觀指標...');
    const hkMacros = [
      { name: '恆指', value: '25,893 ↑0.55%', trend: 'up', status: 'warn', note: '突破 HK-B 框架上限 23,000' },
      { name: '進口 YoY', value: '創 4 年最佳 ↑↑', trend: 'up', status: 'hot', note: '內需復甦信號超預期' },
      { name: '出口 YoY', value: '低於預期', trend: 'down', status: 'normal', note: '地緣衝擊影響出口' },
      { name: '南向資金', value: '+73 億連續流入', trend: 'up', status: 'hot', note: '加速流入買入騰訊/美團/小米' },
      { name: 'USD/HKD', value: '7.825', trend: 'stable', status: 'normal', note: '遠離 7.85 弱方保證' },
      { name: 'HIBOR', value: '待追蹤', trend: 'stable', status: 'normal', note: '需追蹤銀行體系結餘' },
      { name: '人民幣', value: '~7.2-7.3', trend: 'stable', status: 'warn', note: '距 HK-E 門檻仍有距離' },
      { name: 'WTI', value: '$98.06', trend: 'up', status: 'normal', note: '中東風險仍存' },
      { name: 'CATL IPO', value: '50 億美元', trend: 'up', status: 'normal', note: '國際資本對港股信心仍在' },
    ];

    for (const macro of hkMacros) {
      await query(`
        INSERT INTO macros (name, value, trend, status, note, market)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [macro.name, macro.value, macro.trend, macro.status, macro.note, 'HK']);
    }
    console.log(`✅ 插入 ${hkMacros.length} 條港股宏觀指標`);

    // 4. 插入港股路徑節點
    console.log('\n🔵 插入港股路徑節點...');
    const hkNodes = [
      { id: 'hka', name: 'HK-A 政策牛市', sub: '大規模財政刺激+LPR 下調', color: '#4ade80', x: 400, y: 55, prob: 8, current: false },
      { id: 'hkb', name: 'HK-B 震盪築底', sub: '內需弱復甦+南向支撐', color: '#fbbf24', x: 400, y: 215, prob: 35, current: true },
      { id: 'hkc', name: 'HK-C 流動性危機', sub: '美加息+港元承壓', color: '#f87171', x: 680, y: 215, prob: 8, current: false },
      { id: 'hkd', name: 'HK-D 地緣黑天鵝', sub: '台海衝突+供應鏈', color: '#a78bfa', x: 120, y: 370, prob: 12, current: false },
      { id: 'hke', name: 'HK-E 中國復甦超預期', sub: '社零>8%+出口>10%', color: '#f472b6', x: 680, y: 370, prob: 37, current: false },
    ];

    for (const node of hkNodes) {
      await query(`
        INSERT INTO nodes (id, name, sub, color, x, y, prob, current, market)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [node.id, node.name, node.sub, node.color, node.x, node.y, node.prob, node.current, 'HK']);
    }
    console.log(`✅ 插入 ${hkNodes.length} 個港股路徑節點`);

    // 5. 插入港股板塊配置
    console.log('\n📊 插入港股板塊配置...');
    const hkAllocations = {
      hka: [
        { name: '互聯網/科技龍頭', tier: 'overweight' },
        { name: '金融/券商板塊', tier: 'overweight' },
        { name: '消費板塊', tier: 'overweight' },
        { name: '地產板塊', tier: 'neutral' },
        { name: '新能源板塊', tier: 'neutral' },
        { name: '電信/公用事業', tier: 'underweight' },
      ],
      hkb: [
        { name: '電信/公用事業', tier: 'overweight' },
        { name: '必需消費板塊', tier: 'overweight' },
        { name: '互聯網龍頭', tier: 'neutral' },
        { name: '醫療板塊', tier: 'neutral' },
        { name: '能源板塊', tier: 'neutral' },
        { name: '地產板塊', tier: 'avoid' },
      ],
      hkc: [
        { name: '現金/短債', tier: 'overweight' },
        { name: '黃金/避險資產', tier: 'overweight' },
        { name: '必需消費+電信', tier: 'overweight' },
        { name: '科技/地產板塊', tier: 'avoid' },
        { name: '新興市場資產', tier: 'avoid' },
      ],
      hkd: [
        { name: '現金', tier: 'overweight' },
        { name: '能源板塊', tier: 'overweight' },
        { name: '國防/航天', tier: 'overweight' },
        { name: '黃金/避險資產', tier: 'overweight' },
        { name: '科技/出口板塊', tier: 'avoid' },
      ],
      hke: [
        { name: '互聯網/科技龍頭', tier: 'overweight' },
        { name: '新能源板塊', tier: 'overweight' },
        { name: '消費板塊', tier: 'overweight' },
        { name: '金融板塊', tier: 'overweight' },
        { name: '能源板塊', tier: 'neutral' },
        { name: '地產板塊', tier: 'avoid' },
      ],
    };

    for (const [nodeId, allocs] of Object.entries(hkAllocations)) {
      for (const alloc of allocs) {
        await query(`
          INSERT INTO allocations (node_id, name, tier)
          VALUES ($1, $2, $3)
        `, [nodeId, alloc.name, alloc.tier]);
      }
    }
    console.log(`✅ 插入 ${Object.values(hkAllocations).flat().length} 條板塊配置`);

    // 6. 插入港股路徑切換
    console.log('\n🔀 插入港股路徑切換...');
    const hkSwitches = [
      {
        id: 'hkbe', from_node: 'hkb', to_node: 'hke', time: '8-12 週',
        trigger: '社零同比>8% 連續 3 月（HK-E 最核心觸發）',
        path: 'M 455,238 C 510,278 570,320 638,358',
        description: '當前最高優先級切換（進度 22%，早期預警階段）。進口創 4 年最佳 + 南向資金 +73 億加速流入 + 恆指 25,893 突破 HK-B 上限，三個信號共同指向 HK-E。但確認條件尚未觸發，目前是「方向信號」而非「確認信號」。若 4 月下旬社零數據超預期，進度將跳升至 35%+。',
        next_check: '4 月下旬中國社零/工業增加值數據',
      },
      {
        id: 'hkbd', from_node: 'hkb', to_node: 'hkd', time: '1-2 週',
        trigger: '台海軍事衝突急速升級',
        path: 'M 358,242 C 285,288 205,328 162,358',
        description: '台海無新信號，中東封鎖對港股僅間接影響。HSBC 警告「中東衝突打擊亞洲信心」是早期預警，但信貸增長放緩尚未確認。路徑 D 概率 12% 為尾部風險。',
        next_check: '4 月 22 日美伊停火到期',
      },
      {
        id: 'hkbc', from_node: 'hkb', to_node: 'hkc', time: '8-16 週',
        trigger: '美聯儲加息+港元承壓（美股路徑 E 傳導）',
        path: 'M 455,208 C 540,208 600,210 642,210',
        description: 'HSBC CEO 警告「亞洲信貸增長放緩」是早期預警信號，但港元債券發行熱潮顯示企業對港元聯繫匯率制度有信心。企業主動降低美元敞口是對美股路徑 E 的對沖行為。',
        next_check: '今日美股 4/15 CPI 數據（最高優先級）',
      },
      {
        id: 'hkba', from_node: 'hkb', to_node: 'hka', time: '4-8 週',
        trigger: '大規模財政刺激+LPR 下調',
        path: 'M 378,196 C 362,148 372,105 388,73',
        description: '無大規模財政刺激信號，LPR 未下調。路徑 A 概率僅 8%，需要政策面大幅轉向。',
        next_check: '月底 PBOC LPR 決議',
      },
      {
        id: 'hkeb', from_node: 'hke', to_node: 'hkb', time: '8-16 週',
        trigger: '復甦放緩（社零回落至<5%）',
        path: 'M 638,365 C 580,332 518,288 458,248',
        description: '從復甦超預期回到震盪築底的退出路徑。路徑 E 尚未觸發，此為遠期情景。',
        next_check: '路徑 E 觸發後才需監控',
      },
      {
        id: 'hkdb', from_node: 'hkd', to_node: 'hkb', time: '4-12 週',
        trigger: '地緣衝突緩和',
        path: 'M 162,365 C 218,332 298,288 358,248',
        description: '地緣衝突緩和的回歸路徑。台海無新信號，但中東局勢仍是變數。',
        next_check: '持續監控台海/中東局勢',
      },
      {
        id: 'hkcb', from_node: 'hkc', to_node: 'hkb', time: '8-16 週',
        trigger: '美聯儲停止加息',
        path: 'M 640,222 C 580,224 520,220 458,222',
        description: '流動性危機觸發後的回歸路徑。路徑 C 尚未觸發。',
        next_check: '路徑 C 觸發後才需監控',
      },
    ];

    for (const sw of hkSwitches) {
      await query(`
        INSERT INTO switches (id, from_node, to_node, time, trigger, path, description, next_check, market)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [sw.id, sw.from_node, sw.to_node, sw.time, sw.trigger, sw.path, sw.description, sw.next_check, 'HK']);
    }
    console.log(`✅ 插入 ${hkSwitches.length} 個港股路徑切換`);

    // 7. 插入港股確認信號
    console.log('\n✅ 插入港股確認信號...');
    const hkConfirmSignals = {
      hkbe: [
        { text: '社零同比>8% 連續 3 月', status: 'no', actual: '需追蹤，進口強勁是間接支撐', note: '最重要信號，尚未確認' },
        { text: '出口同比>10% 連續 3 月', status: 'no', actual: '3 月出口低於預期，方向相反', note: '地緣衝擊導致，非競爭力問題' },
        { text: '人民幣升值至 USD/CNY<7.0', status: 'no', actual: '當前約 7.2-7.3，差 0.2-0.3', note: '需要中國經濟實質性復甦' },
        { text: '南向資金連續 30 日淨流入', status: 'near', actual: '連續流入但未達 30 日，當前 +73 億/日', note: '加速流入中，方向正確' },
        { text: '恆指突破 26,000', status: 'near', actual: '當前 25,893，距 26,000 僅 0.4%', note: '已突破 HK-B 框架上限 23,000' },
      ],
      hkbd: [
        { text: '台海通航中斷>1 週', status: 'no', actual: '台海無新信號，中東封鎖對港股間接影響', note: '尚未觸發' },
        { text: '恆指暴跌>15%', status: 'no', actual: '當前 25,893（+0.55%）', note: '' },
        { text: '南向資金單日流出>100 億', status: 'no', actual: '當前 +73 億流入', note: '資金持續流入而非流出' },
      ],
      hkbc: [
        { text: 'HIBOR 飆升>5%', status: 'no', actual: '需追蹤，銀行體系結餘穩定', note: '美股路徑 E 傳導信號' },
        { text: 'USD/HKD>7.85', status: 'no', actual: '當前 7.825，遠離 7.85 弱方保證', note: '港元穩定' },
        { text: '外匯儲備連續 3 月下降', status: 'no', actual: '需追蹤', note: '' },
      ],
      hkba: [
        { text: '財政刺激規模>1 萬億人民幣', status: 'no', actual: '無大規模財政刺激信號', note: '政策工具箱尚未開啟' },
        { text: 'LPR 下調 10+bps', status: 'no', actual: '月底 PBOC LPR 決議待公佈', note: '' },
        { text: '社融增速>12%', status: 'no', actual: '需追蹤', note: '' },
      ],
      hkeb: [
        { text: '社零同比<5% 連續 2 月', status: 'no', actual: '路徑 E 尚未觸發', note: '' },
        { text: '出口同比<3%', status: 'no', actual: '', note: '' },
        { text: '南向資金轉為淨流出', status: 'no', actual: '當前 +73 億流入', note: '' },
      ],
      hkdb: [
        { text: '台海通航恢復正常', status: 'no', actual: '台海無新信號', note: '' },
        { text: '恆指反彈>10%', status: 'no', actual: '', note: '' },
        { text: '南向資金連續流入', status: 'yes', actual: '當前 +73 億流入', note: '資金信心恢復' },
      ],
      hkcb: [
        { text: 'Fed 停止加息', status: 'no', actual: '路徑 C 尚未觸發', note: '' },
        { text: 'HIBOR 回落', status: 'no', actual: '', note: '' },
        { text: '人民幣企穩', status: 'no', actual: '', note: '' },
      ],
    };

    let totalSignals = 0;
    for (const [switchId, signals] of Object.entries(hkConfirmSignals)) {
      for (const signal of signals) {
        await query(`
          INSERT INTO confirm_signals (switch_id, text, status, actual, note)
          VALUES ($1, $2, $3, $4, $5)
        `, [switchId, signal.text, signal.status, signal.actual, signal.note || null]);
        totalSignals++;
      }
    }
    console.log(`✅ 插入 ${totalSignals} 條確認信號`);

    // 8. 插入港股警報
    console.log('\n⚠️ 插入港股警報...');
    await query(`
      INSERT INTO alerts (active, level, timestamp, title, message, action, market)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      true, 'warning', '2026-04-14T12:30:00+08:00',
      '宏觀研究警報',
      '進口創 4 年最佳 + 南向資金 +73 億加速流入 + 恆指 25,893 突破 HK-B 上限 23,000。HK-E（中國復甦超預期）概率 37% 首次超越 HK-B（35%）。但確認條件（社零>8%、出口>10%、人民幣<7.0）尚未觸發，目前是「方向信號」而非「確認信號」。',
      '當前觀察重點：今日美股 4/15 CPI（傳導至 HK-C）；4/22 美伊停火到期（HK-D）；4 月下旬中國社零數據（HK-E 切換確認）。',
      'HK'
    ]);
    console.log('✅ 港股警報已插入');

    // 9. 插入港股閾值警報
    console.log('\n📊 插入港股閾值警報...');
    await query(`
      INSERT INTO threshold_alerts (switch_id, progress, tier, next_trigger, market)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'hkbe', 0.22, 'early_warning',
      '今日美股 4/15 CPI（傳導至 HK-C）；4 月下旬中國社零數據（HK-E 切換確認）；4/22 美伊停火到期（HK-D）',
      'HK'
    ]);
    console.log('✅ 港股閾值警報已插入');

    // 10. 插入港股新聞
    console.log('\n📰 插入港股新聞...');
    const hkNews = [
      {
        id: 'hk-20260414-001', date: '2026-04-14',
        title: '中國 3 月進口創 4 年最佳，內需復甦信號超預期',
        source: '中國海關總署', severity: 'positive',
        summary: '進口強勁有兩個可能解釋：中國內需真實復甦（消費 + 投資拉動）或企業在地緣不確定性下提前囤積原材料（防禦性進口）。兩個解釋都支持港股，但含義不同。宏觀研究判斷：進口強勁的信號質量高於出口放緩。',
        impact: '支持 HK-B→HK-E 切換方向',
        url: 'https://customs.gov.cn/2026/04/14/import-data',
      },
      {
        id: 'hk-20260414-002', date: '2026-04-14',
        title: '南向資金 +73 億人民幣加速流入，買入騰訊/美團/小米',
        source: '港交所', severity: 'positive',
        summary: '南向資金連續流入且速度加快（5 日均值 +60 億 vs 今日 +73 億）。買入結構：騰訊 +15 億、美團 +8 億、小米 +6 億、中芯 +5 億、比亞迪 +4 億。全部是科技/新能源龍頭，沒有金融/地產。說明南向資金在押注「中國科技 + 新能源」的結構性機會。',
        impact: '支持 HK-B→HK-E 切換方向',
        url: 'https://hkex.com.cn/2026/04/14/southbound-flow',
      },
      {
        id: 'hk-20260414-003', date: '2026-04-14',
        title: '恆指 25,893 突破 HK-B 框架上限 23,000，市場已在向 HK-E 漂移',
        source: 'Bloomberg', severity: 'positive',
        summary: '恆指 25,893（+0.55%）已突破 HK-B 框架定義的震盪上限 23,000。這意味著要麼 HK-B 的定義需要更新，要麼市場已在向 HK-E 漂移。重要發現：恆指突破是 HK-E 概率首次超越 HK-B 的關鍵技術信號。',
        impact: '支持 HK-B→HK-E 切換方向',
        url: 'https://bloomberg.com/2026/04/14/hang-seng-index',
      },
      {
        id: 'hk-20260414-004', date: '2026-04-14',
        title: 'CATL 考慮 50 億美元港股增發，國際資本對港股信心仍在',
        source: 'Reuters', severity: 'positive',
        summary: 'CATL 考慮 50 億美元港股增發，這不只是一個 IPO 消息，有更深的含義：（1）對港股市場的信號：全球最大電池製造商選擇香港融資，說明國際資本對港股市場的信心仍在；（2）對新能源板塊的影響：CATL 在港上市將帶動整個新能源產業鏈的估值重估；（3）對 HK-E 路徑的支撐：大型 IPO 通常在市場預期改善時發生。',
        impact: '支持 HK-B→HK-E 切換方向',
        url: 'https://reuters.com/2026/04/14/catl-hk-ipo',
      },
      {
        id: 'hk-20260414-005', date: '2026-04-14',
        title: 'HSBC CEO 警告「中東衝突打擊亞洲信心，信貸增長放緩」',
        source: 'HSBC', severity: 'medium',
        summary: 'HSBC 是亞洲最大的跨國銀行，CEO 的警告不是情緒表達，而是基於實際信貸數據的前瞻判斷。信貸放緩意味著企業融資成本上升、投資意願下降、經濟增長動能減弱。這是路徑 HK-C（流動性危機）的早期預警信號，雖然概率仍低（8%），但需要持續監控 HIBOR 走勢。',
        impact: '支持 HK-B→HK-C 和 HK-B→HK-D 切換風險',
        url: 'https://hsbc.com/2026/04/14/credit-warning',
      },
      {
        id: 'hk-20260414-006', date: '2026-04-14',
        title: '港元債券發行熱潮，中資企業偏好港元融資規避美元波動',
        source: 'HKMA', severity: 'positive',
        summary: '中資企業偏好港元融資，規避美元波動風險。這說明：（1）企業對港元聯繫匯率制度有信心（USD/HKD 7.825，遠離 7.85 弱方保證）；（2）企業在主動降低美元敞口，這是對美聯儲加息預期（美股路徑 E）的對沖行為。關鍵洞察：港股正在通過南向資金和港元債券兩個機制，主動對沖美股路徑 E 的負面影響。',
        impact: '對沖 HK-B→HK-C 風險，支持 HK-B→HK-E 方向',
        url: 'https://hkma.gov.hk/2026/04/14/hk-bond-issuance',
      },
      {
        id: 'hk-20260413-001', date: '2026-04-13',
        title: '中東封鎖對港股間接影響，地緣風險溢價部分消化',
        source: 'Al Jazeera', severity: 'medium',
        summary: '伊朗封鎖對港股的影響主要是間接的：（1）能源成本上升壓力；（2）亞洲信心受打擊；（3）風險溢價上升。但港股相對美股的韌性更強，因為南向資金和中國政策可以提供對沖。路徑 HK-D 概率 12% 為尾部風險。',
        impact: '支持 HK-B→HK-D 和 HK-B→HK-E 風險/方向',
        url: 'https://aljazeera.com/2026/04/13/middle-east-hk-impact',
      },
      {
        id: 'hk-20260413-002', date: '2026-04-13',
        title: '人民幣匯率 7.2-7.3 區間震盪，距離 HK-E 門檻仍有距離',
        source: 'Bloomberg', severity: 'medium',
        summary: '人民幣匯率當前約 7.2-7.3，距離 HK-E 確認門檻（USD/CNY<7.0）仍有 0.2-0.3 的距離。需要中國經濟實質性復甦才能推動人民幣升值至 7.0 以下。目前人民幣匯率是 HK-B→HK-E 切換的「方向信號」而非「確認信號」。',
        impact: '支持 HK-B→HK-E 方向',
        url: 'https://bloomberg.com/2026/04/13/usd-cny-rate',
      },
    ];

    for (const newsItem of hkNews) {
      await query(`
        INSERT INTO news (id, market, date, title, source, severity, summary, impact, url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [newsItem.id, 'HK', newsItem.date, newsItem.title, newsItem.source,
          newsItem.severity, newsItem.summary, newsItem.impact, newsItem.url]);
    }
    console.log(`✅ 插入 ${hkNews.length} 條港股新聞`);

    // 11. 插入港股新聞影響關聯
    console.log('\n🔗 插入港股新聞影響關聯...');
    const hkNewsAffects = [
      { newsId: 'hk-20260414-001', switchId: 'hkbe' },
      { newsId: 'hk-20260414-002', switchId: 'hkbe' },
      { newsId: 'hk-20260414-003', switchId: 'hkbe' },
      { newsId: 'hk-20260414-004', switchId: 'hkbe' },
      { newsId: 'hk-20260414-005', switchId: 'hkbc' },
      { newsId: 'hk-20260414-005', switchId: 'hkbd' },
      { newsId: 'hk-20260414-006', switchId: 'hkbc' },
      { newsId: 'hk-20260414-006', switchId: 'hkbe' },
      { newsId: 'hk-20260413-001', switchId: 'hkbd' },
      { newsId: 'hk-20260413-001', switchId: 'hkbe' },
      { newsId: 'hk-20260413-002', switchId: 'hkbe' },
    ];

    for (const affect of hkNewsAffects) {
      await query(`
        INSERT INTO news_affects (news_id, switch_id)
        VALUES ($1, $2)
      `, [affect.newsId, affect.switchId]);
    }
    console.log(`✅ 插入 ${hkNewsAffects.length} 條新聞影響關聯`);

    // 12. 插入港股新聞路徑關聯
    console.log('\n🔗 插入港股新聞路徑關聯...');
    const hkNewsRelatedPaths = [
      { newsId: 'hk-20260414-001', pathId: 'hke' },
      { newsId: 'hk-20260414-001', pathId: 'hkb' },
      { newsId: 'hk-20260414-002', pathId: 'hke' },
      { newsId: 'hk-20260414-003', pathId: 'hke' },
      { newsId: 'hk-20260414-003', pathId: 'hkb' },
      { newsId: 'hk-20260414-004', pathId: 'hke' },
      { newsId: 'hk-20260414-005', pathId: 'hkc' },
      { newsId: 'hk-20260414-005', pathId: 'hkd' },
      { newsId: 'hk-20260414-006', pathId: 'hkc' },
      { newsId: 'hk-20260414-006', pathId: 'hke' },
      { newsId: 'hk-20260413-001', pathId: 'hkd' },
      { newsId: 'hk-20260413-001', pathId: 'hkb' },
      { newsId: 'hk-20260413-002', pathId: 'hke' },
    ];

    for (const rp of hkNewsRelatedPaths) {
      await query(`
        INSERT INTO news_related_paths (news_id, path_id)
        VALUES ($1, $2)
      `, [rp.newsId, rp.pathId]);
    }
    console.log(`✅ 插入 ${hkNewsRelatedPaths.length} 條新聞路徑關聯`);

    // 13. 插入港股新聞標籤
    console.log('\n🏷️ 插入港股新聞標籤...');
    const hkNewsTags = [
      { newsId: 'hk-20260414-001', tag: '宏觀經濟' },
      { newsId: 'hk-20260414-001', tag: '貿易' },
      { newsId: 'hk-20260414-002', tag: '資金流向' },
      { newsId: 'hk-20260414-002', tag: '科技' },
      { newsId: 'hk-20260414-003', tag: '市場動態' },
      { newsId: 'hk-20260414-004', tag: 'IPO' },
      { newsId: 'hk-20260414-004', tag: '新能源' },
      { newsId: 'hk-20260414-005', tag: '銀行' },
      { newsId: 'hk-20260414-005', tag: '信貸' },
      { newsId: 'hk-20260414-006', tag: '債券' },
      { newsId: 'hk-20260414-006', tag: '匯率' },
      { newsId: 'hk-20260413-001', tag: '地緣政治' },
      { newsId: 'hk-20260413-001', tag: '能源' },
      { newsId: 'hk-20260413-002', tag: '匯率' },
      { newsId: 'hk-20260413-002', tag: '宏觀經濟' },
    ];

    for (const tag of hkNewsTags) {
      await query(`
        INSERT INTO news_tags (news_id, tag)
        VALUES ($1, $2)
      `, [tag.newsId, tag.tag]);
    }
    console.log(`✅ 插入 ${hkNewsTags.length} 條新聞標籤`);

    // 統計信息
    console.log('\n📊 港股數據統計:');
    const hkTables = [
      { name: 'nodes', market: 'HK' },
      { name: 'switches', market: 'HK' },
      { name: 'news', market: 'HK' },
      { name: 'macros', market: 'HK' },
      { name: 'alerts', market: 'HK' },
      { name: 'threshold_alerts', market: 'HK' },
    ];
    for (const t of hkTables) {
      const result = await query(`SELECT COUNT(*) FROM ${t.name} WHERE market = $1`, [t.market]);
      console.log(`   - ${t.name} (HK): ${result.rows[0].count} 條記錄`);
    }

    const allocResult = await query(`SELECT COUNT(*) FROM allocations WHERE node_id LIKE 'hk%'`);
    console.log(`   - allocations (HK): ${allocResult.rows[0].count} 條記錄`);

    const confirmResult = await query(`SELECT COUNT(*) FROM confirm_signals WHERE switch_id LIKE 'hk%'`);
    console.log(`   - confirm_signals (HK): ${confirmResult.rows[0].count} 條記錄`);

    console.log('\n🎉 港股數據遷移完成！\n');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();