/**
 * c3h3-energy-hub-card v2.0 — C3H3 Energy Hub Card
 * Multi-source energy hub: Electricity / Gas / Water
 * Charts, budgets, alerts, filter, export, i18n, responsive
 * 
 * v2.0: Config-driven architecture, multi-account support
 * v3.0: Multi-year switching, gas/water drill-down, yearly summary,
 *        CSV/JSON export, fullscreen mode, print styles
 */

// ──── Helpers ────
const _niceStep = (mv) => { if (mv<5) return 1; if (mv<20) return 5; if (mv<50) return 10; if (mv<100) return 20; if (mv<200) return 50; if (mv<500) return 100; if (mv<1000) return 200; if (mv<5000) return 500; return Math.round(mv/20/100)*100; };
const CC = { el:'#1565C0', ga:'#E65100', wa:'#00838F', y1:'#1565C0', y2:'#64B5F6', pk:'#D32F2F', fl:'#F57F17', vl:'#2E7D32', gp:'#1B5E20', el2:'#42A5F5', wa2:'#4DB6AC', ga2:'#FF8A65' };

// i18n
const I18N={'zh-CN':{year:'本年',month:'本月',ele:'用电',gas:'燃气',water:'用水',total:'总账单',thisYr:'本年',lastYr:'去年',details:'点击查看详情',balance:'余额',lastMo:'上月',yrFee:'年费',cum:'累计',bill:'本期',loading:'加载中...',moKwh:'本月kWh',moM3:'本月m3',yrM3:'年m3',moFee:'本月费',peak:'峰',flat:'平',valley:'谷',estBill:'预估账单',avgMo:'历史月均',cumCost:'累计费用',tier1:'一阶',tier2:'二阶',tier3:'三阶',sum:'合计',t1Usage:'一阶累计',left:'剩',daily:'近30日日用电',yest:'昨日',ele2:'电',gas2:'气',water2:'水',export:'导出',alert1:'!',alert2:'!!',vsAvg:'vs月均',cost:'费用',yrCost:'年费',csv:'CSV',json:'JSON',full:'全屏',summary:'年度总结',print:'打印'},'en':{year:'Year',month:'Month',ele:'Elec',gas:'Gas',water:'Water',total:'Total',thisYr:'This Yr',lastYr:'Last Yr',details:'Details',balance:'Bal',lastMo:'Last',yrFee:'Yr',cum:'Cum',bill:'Bill',loading:'Loading...',moKwh:'/mo kWh',moM3:'/mo m3',yrM3:'/yr m3',moFee:'Cost',peak:'Peak',flat:'Flat',valley:'Valley',estBill:'Est Bill',avgMo:'Avg/mo',cumCost:'Total',tier1:'T1',tier2:'T2',tier3:'T3',sum:'Sum',t1Usage:'T1 used',left:'left',daily:'30d daily',yest:'Yest',ele2:'E',gas2:'G',water2:'W',export:'Export',alert1:'!!',alert2:'!!!',vsAvg:'vs avg',cost:'Cost',yrCost:'Yr Cost',csv:'CSV',json:'JSON',full:'Full',summary:'Summary',print:'Print'}};
function _T(h,k){let l='zh-CN';if(h&&h.language)l=h.language;else if(document&&document.documentElement&&document.documentElement.lang)l=document.documentElement.lang;if(!I18N[l])l=l.indexOf('zh')>=0?'zh-CN':'en';return I18N[l][k]||k;}
function _cK(p,id,y){return'eh4_'+p+'_'+id.replace(/[^a-z0-9]/g,'_')+'_'+y;}
function _cG(k){try{let d=JSON.parse(localStorage.getItem(k));if(d&&d.ts>Date.now()-7200000)return d.data;}catch(e){}return null;}
function _cS(k,d){try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}));}catch(e){}}

// ──── Account Type Definitions ────
const ACCOUNT_TYPES = {
  electricity: { group:'ele', unit:'kWh', icon:'⚡', defaultColor:CC.el },
  gas: { group:'gas', unit:'m³', icon:'🔥', defaultColor:CC.ga },
  water: { group:'water', unit:'m³', icon:'💧', defaultColor:CC.wa },
};

function _ring(vals, colors) {
  const t=vals.reduce((s,v)=>s+v,0); if (t<=0) return '<svg></svg>';
  const pi=Math.PI, cx=36, cy=36, r=32; let start=-pi/2, sv='';
  for (let i=0;i<vals.length;i++) { if (vals[i]<=0) continue; const ang=(vals[i]/t)*pi*2, end=start+ang; sv+=`<path d="M${cx} ${cy} L${(cx+r*Math.cos(start)).toFixed(1)} ${(cy+r*Math.sin(start)).toFixed(1)} A${r} ${r} 0 ${ang>pi?1:0} 1 ${(cx+r*Math.cos(end)).toFixed(1)} ${(cy+r*Math.sin(end)).toFixed(1)} Z" fill="${colors[i]}" opacity="0.85"/>`; start=end; }
  const ir=r*0.58;
  return `<svg width="72" height="72" viewBox="0 0 72 72">${sv}<circle cx="${cx}" cy="${cy}" r="${ir}" fill="var(--card-background-color,#fff)"/><text x="${cx}" y="${cy+1}" text-anchor="middle" fill="var(--primary-text-color)" font-size="12" font-weight="700">${t.toFixed(0)}</text><text x="${cx}" y="${cy+11}" text-anchor="middle" fill="var(--secondary-text-color)" font-size="7">kWh</text></svg>`;
}
function _tip(m, d1, d2, u, PL, SX, H, W, pos, mode, acct) {
  const s1 = d1 && d1[m]; if (!s1) return '';
  const s2 = d2 && d2[m];
  const y1v = Math.max(0, s1.change || 0);
  const y1c = s1.cost || 0;
  const y2v = s2 ? Math.max(0, s2.change || 0) : 0;
  const y2c = s2 ? (s2.cost || 0) : 0;
  const hasCost = y1c > 0 || y2c > 0;
  const TH = hasCost ? 62 : 50, TW = 150;
  let tx = pos ? Math.max(2, Math.min(W - TW - 2, pos.x - TW / 2)) : 2;
  let ty = pos ? pos.y - TH - 10 : 2;
  // Flip below if above would overflow
  if (ty < 2 && pos) ty = pos.y + 12;
  // Clamp horizontal
  tx = Math.max(2, Math.min(W - TW - 2, tx));

  const unit = u || (acct && acct.unit) || '';
  const color1 = CC.y1, color2 = CC.y2;

  let rows = '';
  // This year row
  rows += `<text x="${tx + 8}" y="${ty + 16}" fill="${color1}" font-size="11" font-weight="600">${m+1}月</text>`;
  rows += `<text x="${tx + 48}" y="${ty + 16}" fill="var(--primary-text-color)" font-size="11" font-weight="600">${y1v.toFixed(1)}${unit}</text>`;
  if (hasCost) rows += `<text x="${tx + 115}" y="${ty + 16}" fill="var(--secondary-text-color)" font-size="10">¥${y1c.toFixed(0)}</text>`;
  // Last year row
  rows += `<text x="${tx + 8}" y="${ty + 32}" fill="${color2}" font-size="10">去年</text>`;
  rows += `<text x="${tx + 48}" y="${ty + 32}" fill="var(--primary-text-color)" font-size="10">${y2v.toFixed(1)}${unit}</text>`;
  if (hasCost) rows += `<text x="${tx + 115}" y="${ty + 32}" fill="var(--secondary-text-color)" font-size="9">¥${y2c.toFixed(0)}</text>`;
  // YoY
  if (y2v > 0 && y1v > 0) {
    const yoy = ((y1v - y2v) / y2v * 100);
    const yoyStr = (yoy > 0 ? '+' : '') + yoy.toFixed(1) + '%';
    const yoyClr = yoy > 0 ? '#ef4444' : (yoy < 0 ? '#10b981' : 'var(--secondary-text-color)');
    rows += `<text x="${tx + 8}" y="${ty + 48}" fill="${yoyClr}" font-size="10" font-weight="600">同比 ${yoyStr}</text>`;
    // Show diff
    const diff = y1v - y2v;
    rows += `<text x="${tx + 100}" y="${ty + 48}" fill="var(--secondary-text-color)" font-size="9">${diff > 0 ? '+' : ''}${diff.toFixed(1)}${unit}</text>`;
  }

  const ht = hasCost ? 48 : 40;
  return `<g style="pointer-events:none;opacity:0.95">
    <rect x="${tx}" y="${ty}" width="${TW}" height="${ht}" rx="8" fill="var(--card-background-color)" stroke="var(--divider-color)" stroke-width="0.5" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.15))"/>
    ${rows}
  </g>`;
}
function _pct(v,t){return t>0?((v/t)*100).toFixed(0):'0'}
function _yoy(cur,prev){if(!prev||prev<=0)return '';const d=((cur-prev)/prev)*100;return(d>0?'+':'-')+Math.abs(d).toFixed(1)+'%';}
function _cum(arr,m){const r=[];let s=0;for(let i=0;i<m;i++){s+=(arr[i]||0);r.push(s);}return r;}
function _fc(arr,m){const n=new Date().getMonth()+1;if(n>=m||n<=0)return 0;return n<m?Math.round((arr[n-1]||0)/n*m):(arr[m-1]||0);}
function _pp(v){return v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0);}
function _colorForType(type, idx) {
  const colors = { electricity: [CC.el, CC.el2], gas: [CC.ga, CC.ga2], water: [CC.wa, CC.wa2] };
  const arr = colors[type] || [CC.el, CC.el2];
  return arr[idx % arr.length];
}

// ──── Default Auto-Detection (legacy compatibility) ────
function _defaultAccounts() {
  return {
    electricity: [
      { name:'用电合计', icon:'⚡', consNo:'total', type:'electricity', color:CC.el,
        entities:{ month:null, year:null, cost:null, balance:null, peak:null, valley:null } },
      { name:'202室', icon:'⚡', consNo:'3305820502430', type:'electricity', color:CC.el,
        entities:{ month:'sensor.state_grid_3305820502430_month_ele_num', year:'sensor.state_grid_3305820502430_year_ele_num', cost:'sensor.state_grid_3305820502430_last_month_ele_cost', balance:'sensor.state_grid_3305820502430_balance', peak:'sensor.state_grid_3305820502430_month_p_ele_num', valley:'sensor.state_grid_3305820502430_month_v_ele_num' },
        statistics:{ energy:'sg_inject:3305820502430_monthly_ele', cost:'sg_inject:3305820502430_monthly_cost' } },
      { name:'充电桩', icon:'🔌', consNo:'3309947582705', type:'electricity', color:CC.el2,
        entities:{ month:'sensor.state_grid_3309947582705_month_ele_num', year:'sensor.state_grid_3309947582705_year_ele_num', cost:'sensor.state_grid_3309947582705_last_month_ele_cost', balance:'sensor.state_grid_3309947582705_balance' },
        statistics:{ energy:'sg_inject:3309947582705_monthly_ele', cost:'sg_inject:3309947582705_monthly_cost' } },
    ],
    gas: [
      { name:'燃气', icon:'🔥', consNo:'gas', type:'gas', color:CC.ga,
        entities:{ month:'sensor.chu_fang_hua_run_ran_qi_ben_yue_lei_ji_yong_qi_liang', year:'sensor.hua_run_ran_qi_yi_jie_ti_lei_ji_yi_yong', cost:'sensor.hua_run_ran_qi_lei_ji_ran_qi_fei_yong', balance:'sensor.chu_fang_hua_run_ran_qi_ran_qi_zhang_hu_yu_e', bill:'sensor.chu_fang_hua_run_ran_qi_zhang_dan_jin_e' },
        statistics:{ usage:'crcgas:monthly_gas_usage', cost:'crcgas:monthly_bill_amount' } },
    ],
    water: [
      { name:'倪*州', icon:'💧', consNo:'water', type:'water', color:CC.wa,
        entities:{ month:'sensor.wen_zhou_shui_wu_ni_zhou_5', year:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yi_yong_liang', bill:'sensor.wen_zhou_shui_wu_ni_zhou_6', cost:'sensor.shi_wai_wen_zhou_shui_wu_ni_zhou_lei_ji_shui_fei', tier1:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yong_shui_liang', tier2:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_er_jie_yong_shui_liang', tier3:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_san_jie_yong_shui_liang', avg:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_li_shi_yue_jun_yong_shui', est_bill:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yu_gu_ben_yue_zhang_dan', tier_remain:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_jie_ti_sheng_yu_liang', year_t1:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yi_yong_liang', tier_cap:'sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_shang_xian' },
        statistics:{ usage:'wenzhou_water:82011020337_monthly_water_usage', cost:'wenzhou_water:82011020337_monthly_water_cost' } },
    ],
  };
}

// ──── Styles ────
const STYLE = '<style>.eh{font-family:var(--paper-font-body1_-_font-family);font-size:14px}.eh ha-card{border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)}' +
'.eh .b{padding:12px}.eh .ht{font-size:15px;font-weight:600;color:var(--primary-text-color);letter-spacing:-0.2px}' +
'.eh .ha{display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
'.eh .nb{background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;color:var(--primary-text-color);line-height:1.5;transition:all 0.15s;min-height:32px;white-space:nowrap}' +
'.eh .nb:hover{opacity:0.8}.eh .nb.a{background:var(--primary-color);color:#fff;border-color:var(--primary-color)}' +
'.eh .nb.ng{opacity:0.4}.eh .sc{flex:1;min-width:0;background:var(--secondary-background-color);border-radius:10px;padding:6px 3px;text-align:center}' +
'.eh .sv{font-size:14px;font-weight:700;color:var(--primary-text-color);letter-spacing:-0.2px}' +
'.eh .sl{font-size:9px;color:var(--secondary-text-color);margin-top:1px;white-space:nowrap}' +
'.eh .cl{display:flex;justify-content:center;gap:12px;font-size:10px;color:var(--secondary-text-color);flex-wrap:wrap}' +
'.eh .ca{position:relative;width:100%}.eh .sd2{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px}.eh .sd2>.sc{padding:6px 3px}' +
'.eh .sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px}' +
'.eh .enr{display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--divider-color);gap:6px;cursor:pointer;transition:background 0.15s;min-height:44px}' +
'.eh .enr:hover{background:var(--secondary-background-color)}' +
'.eh .ic{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px}' +
'.eh .vl{font-size:13px;font-weight:700;color:var(--primary-text-color);letter-spacing:-0.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}' +
'.eh .ar{font-size:16px;color:var(--secondary-text-color);transition:transform 0.2s;opacity:0.7;padding:4px;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--divider-color);flex-shrink:0}' +
'.eh .dsec{border-bottom:1px solid var(--divider-color)}.eh .dsec:last-child{border-bottom:none}' +
'.eh .yt{font-size:13px;font-weight:500;min-width:28px;text-align:center;color:var(--primary-text-color)}' +
'.eh .tp{display:flex;align-items:center;gap:12px;margin-bottom:10px}' +
'.eh .tl{flex:1;min-width:0;display:grid;grid-template-columns:1fr;gap:6px}.eh .tl>.sc{padding:6px 8px;text-align:left;display:flex;justify-content:space-between;align-items:center}' +
'.eh .tl .sv{font-size:15px;font-weight:700}.eh .tl .sl{font-size:11px;margin-top:0}' +
'.eh .rs{border-radius:12px;border:1px solid var(--divider-color);overflow:hidden}' +
'.eh .pr{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:11px}.eh .pb{flex:1;height:6px;border-radius:3px;background:var(--divider-color);overflow:hidden}' +
'.eh .pf{height:100%;border-radius:3px;transition:width 0.4s ease}' +
'.eh .fl{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}' +
// New overview layout: ring chart left, cost cards right
'.eh .ov{display:flex;align-items:stretch;gap:12px;margin-bottom:8px}' +
'.eh .ov .dw{width:100px;height:100px;flex-shrink:0;display:flex;align-items:center;justify-content:center}' +
'.eh .ov .dw svg{width:100px;height:100px}' +
'.eh .ov .or{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;justify-content:center}' +
'.eh .oi{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:8px;background:var(--secondary-background-color);gap:6px}' +
'.eh .oi .od{width:8px;height:8px;border-radius:4px;flex-shrink:0}' +
'.eh .oi .on{font-size:12px;color:var(--primary-text-color);flex:1}' +
'.eh .oi .ovl{font-size:14px;font-weight:700}' +
'.eh .oi .op{font-size:10px;color:var(--secondary-text-color);min-width:36px;text-align:right}' +
'.eh .ot{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:var(--primary-color);color:#fff;font-weight:600;font-size:13px}' +
// New account row layout
'.eh .er2{display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--divider-color);gap:8px;cursor:pointer;transition:background 0.15s;min-height:48px}' +
'.eh .er2:hover{background:var(--secondary-background-color)}' +
'.eh .er2 .ic{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}' +
'.eh .er2 .eb{flex:1;min-width:0}' +
'.eh .er2 .en{font-size:14px;font-weight:500;color:var(--primary-text-color)}' +
'.eh .er2 .es{font-size:11px;color:var(--secondary-text-color);margin-top:1px}' +
'.eh .er2 .ev{text-align:right}' +
'.eh .er2 .ev .evv{font-size:15px;font-weight:700;color:var(--primary-text-color);letter-spacing:-0.3px}' +
'.eh .er2 .ev .evu{font-size:10px;color:var(--secondary-text-color);margin-left:2px}' +
'.eh .er2 .ev .es2{font-size:10px;color:var(--secondary-text-color);display:block;margin-top:1px}' +
// Desktop: account grid + expanded side-by-side + ring chart
'@media(min-width:800px){.eh .eg{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:10px;margin-top:4px}' +
'.eh .eg>.ea{border:1px solid var(--divider-color);border-radius:12px;overflow:hidden;height:fit-content;background:var(--card-background-color)}' +
'.eh .eg>.ea>.er2{border:none;min-height:52px;padding:12px}.eh .eg>.ea>.dsec:last-child{border-radius:0 0 12px 12px}' +
'.eh .eg>.ea.ef{grid-column:1/-1}' +
'.eh .ov .dw{width:130px;height:130px;flex-shrink:0}.eh .ov .dw svg{width:130px;height:130px}' +
'.eh .ed{display:grid;grid-template-columns:1fr 1fr;gap:12px}}' +
// Mobile: expanded detail stacked
'.eh .ed{display:flex;flex-direction:column;gap:10px}' +
// Desktop 4-column layout (hide overview, filters)
'@media(min-width:800px){.eh .dg{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px}' +
'.eh .dc{border:1px solid var(--divider-color);border-radius:12px;overflow:hidden}' +
'.eh .dc-hd{padding:10px 12px 8px;font-size:13px;font-weight:600;border-bottom:1px solid var(--divider-color);display:flex;align-items:center;gap:6px}' +
'.eh .dc-bd{padding:8px 12px 10px}' +
'.eh .dc-it{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--divider-color);font-size:12px}' +
'.eh .dc-it:last-child{border-bottom:none}' +
'.eh .dc-it .dv{font-size:14px;font-weight:700;color:var(--primary-text-color)}' +
'.eh .dc-it .dl{font-size:10px;color:var(--secondary-text-color)}' +
'.eh .dc-bud{height:4px;border-radius:2px;background:var(--divider-color);overflow:hidden;margin:2px 0}' +
'.eh .dc-bud>div{height:100%;border-radius:2px;transition:width .3s}' +
// Hide overview section on desktop (covered by column 1)
'.eh .ov, .eh .bls, .eh .fb{display:none}}' +
'@media (min-width:600px){.eh .tl{grid-template-columns:1fr}.eh .b{padding:14px}}' +
'@media (min-width:1024px){.eh .tl{grid-template-columns:1fr}.eh .b{padding:20px}}' +
'@media print{.eh .nb,.eh .ar{display:none!important}.eh .b{padding:8px}.eh .rs{border:none;border-radius:0}.eh .en{break-inside:avoid}}' +
'.eh .fs{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:var(--card-background-color,#fff);display:flex;align-items:center;justify-content:center;padding:20px;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}.eh .fs>.ca{max-width:800px;max-height:600px}.eh .fs .fs-close{position:absolute;top:16px;right:16px;z-index:10000}' +
'.eh .ys{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:10px}' +
'.eh .ys>.sc{padding:8px 4px}' +
'@media (max-width:399px){.eh .ov{flex-direction:column;align-items:stretch}.eh .ov .dw{width:80px;height:80px;align-self:center}.eh .ov .dw svg{width:80px;height:80px}.eh .enr{padding:8px}.eh .enr>.ar{display:none}.eh .bls{flex-wrap:wrap;gap:4px;font-size:11px!important}.eh .ha.htr{flex-direction:column;align-items:stretch;gap:4px}.eh .sv{font-size:12px}.eh .vl{max-width:80px;font-size:12px}}' +
'@media (min-width:400px) and (max-width:599px){.eh .ov .dw{width:80px;height:80px}.eh .ov .dw svg{width:80px;height:80px}.eh .sd2{grid-template-columns:repeat(2,1fr)}.eh .tl .sv{font-size:13px}}' +
// Balance display
'.eh .bl{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--secondary-text-color);white-space:nowrap;margin-left:auto}' +
'.eh .bl .bv{font-weight:600;color:var(--primary-color)}' +
// Tier visualization
'.eh .ti{display:flex;align-items:stretch;margin:4px 0;position:relative;height:22px}' +
'.eh .tb{flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#fff;position:relative}' +
'.eh .tb-1{background:#55c593;border-radius:4px 0 0 4px}.eh .tb-2{background:#f8c337;margin:0 -2px;clip-path:polygon(0% 0%,calc(100% - 6px) 0%,100% 50%,calc(100% - 6px) 100%,0% 100%,6px 50%)}.eh .tb-3{background:#f79335;border-radius:0 4px 4px 0;margin-left:-2px}' +
'.eh .tb.active{box-shadow:inset 0 0 0 2px rgba(255,255,255,0.6);filter:brightness(1.1)}' +
'.eh .tci{position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:#ff5722;color:#fff;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:600;white-space:nowrap;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,0.2)}' +
'.eh .tci::after{content:"";position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid #ff5722}' +
'.eh .tci.t1{background:#55c593}.eh .tci.t1::after{border-top-color:#55c593}' +
'.eh .tci.t2{background:#f8c337}.eh .tci.t2::after{border-top-color:#f8c337}' +
'.eh .tci.t3{background:#f79335}.eh .tci.t3::after{border-top-color:#f79335}' +
'.eh .tc2{display:flex;gap:6px;margin:2px 0;font-size:9px;color:var(--secondary-text-color);justify-content:space-between}' +
// Distribution bar
'.eh .db{height:14px;border-radius:3px;overflow:hidden;display:flex;margin:2px 0;gap:1px}' +
'.eh .ds{height:100%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:600;color:#fff;min-width:18px}' +
'.eh .ds-pk{background:linear-gradient(90deg,#F44336,#D32F2F)}.eh .ds-fl{background:linear-gradient(90deg,#2196F3,#1976D2)}.eh .ds-vl{background:linear-gradient(90deg,#4CAF50,#388E3C)}.eh .ds-tp{background:linear-gradient(90deg,#FF9800,#F57C00)}' +
'.eh .dlb{display:flex;justify-content:space-between;font-size:8px;color:var(--secondary-text-color);margin-bottom:2px}' +
'</style>';

// ──── Card Class ────
class C3h3EnergyHubCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('c3h3-energy-hub-card-editor');
  }
  static getStubConfig() {
    return { filters:['ele','gas','water'], budgets:{}, alertThreshold:1.3 };
  }

  setConfig(config) {
    this._config = config || {};
    this._year = new Date().getFullYear();
    this._hoverYear = this._year;
    this._expanded = null;
    this._hoverMonth = null; this._hoverPos = null;
    this._chartModes = {}; this._chartTypes = {};
    this._detailCache = {}; this._dailyCache = {};
    this._loadingDetails = {}; this._liveData = {};
    this._showYear = false; this._showSummary = false; this._drillMonth = null;
    this._fullscreen = false; this._calMonth = new Date().getMonth();

    // Parse config: build account list
    this._accounts = this._buildAccounts();
    // Derive filter groups from accounts
    let groups = {};
    for (let i=0;i<this._accounts.length;i++) { groups[this._accounts[i].group] = true; }
    this._filter = (config.filters || []).length ? config.filters : Object.keys(groups);
    this._budgets = config.budgets || {};
    this._alertThreshold = config.alertThreshold || 1.3;

    // Render shell
    this.innerHTML = STYLE + '<div class="eh"><ha-card><div class="b">' +
    '<div class="ha htr" style="justify-content:space-between;margin-bottom:6px">' +
    '<div class="ha"><button class="nb" data-action="cy" data-dir="-1" style="font-size:11px;padding:2px 8px;min-height:28px"><</button>' +
    '<span class="yt yr" style="font-size:14px;min-width:44px;cursor:default;color:var(--primary-text-color);font-weight:600">2026</span>' +
    '<button class="nb" data-action="cy" data-dir="1" style="font-size:11px;padding:2px 8px;min-height:28px">></button>' +
    '<span style="width:1px;height:14px;background:var(--divider-color);margin:0 4px"></span>' +
    '<button class="nb tb" data-action="switchMode" style="font-size:11px;padding:2px 10px">本月</button>' +
    '<button class="nb" data-action="summary" style="font-size:11px;padding:2px 10px">总结</button></div>' +
    '<span class="tc" style="font-size:14px;font-weight:700;color:#e65100;white-space:nowrap">--</span></div>' +
    // Balance row
    '<div class="bls" style="display:flex;gap:10px;margin-bottom:6px;font-size:13px;align-items:center"></div>' +
    // Overview: ring chart left, cost cards right
    '<div class="ov"><div class="dw"><svg></svg></div><div class="or"></div></div>' +
    '<div class="fl fb"></div>' +
    '<div class="rs"><div class="rc"></div></div>'
    '</div></ha-card></div>';

    const root = this.querySelector('.eh');
    this._el = { root: root, dw: root.querySelector('.dw'), ye: root.querySelector('.yr'), te: root.querySelector('.te'),
      gv: root.querySelector('.gv'), wv: root.querySelector('.wv'), dl: root.querySelector('.dl'),
      rc: root.querySelector('.rc'), tc: root.querySelector('.tc'), tb: root.querySelector('.tb'),
      fb: root.querySelector('.fb'), yv: root.querySelector('.ye'), bls: root.querySelector('.bls'),
      or: root.querySelector('.or') };

    if (this._hass) { this._load(); }
  }

  // ──── Build Accounts from Config ────
  _buildAccounts() {
    let cfg = this._config;
    let defaults = _defaultAccounts();
    let result = [];
    let idx = { electricity: 0, gas: 0, water: 0 };

    // Check if config provides custom entities
    let hasCustomEle = cfg.electricity && cfg.electricity.length > 0;
    let hasCustomGas = cfg.gas && cfg.gas.length > 0;
    let hasCustomWater = cfg.water && cfg.water.length > 0;

    // Electricity
    if (hasCustomEle) {
      for (let i=0;i<cfg.electricity.length;i++) {
        result.push(this._normalizeAccount(cfg.electricity[i], 'electricity', i));
      }
    } else {
      for (let i=0;i<defaults.electricity.length;i++) {
        result.push(this._normalizeAccount(defaults.electricity[i], 'electricity', i));
      }
    }

    // Gas
    if (hasCustomGas) {
      for (let i=0;i<cfg.gas.length;i++) {
        result.push(this._normalizeAccount(cfg.gas[i], 'gas', i));
      }
    } else {
      for (let i=0;i<defaults.gas.length;i++) {
        result.push(this._normalizeAccount(defaults.gas[i], 'gas', i));
      }
    }

    // Water
    if (hasCustomWater) {
      for (let i=0;i<cfg.water.length;i++) {
        result.push(this._normalizeAccount(cfg.water[i], 'water', i));
      }
    } else {
      for (let i=0;i<defaults.water.length;i++) {
        result.push(this._normalizeAccount(defaults.water[i], 'water', i));
      }
    }

    return result;
  }

  _normalizeAccount(acct, type, idx) {
    let tInfo = ACCOUNT_TYPES[type] || { group:type, unit:'', icon:'📊', defaultColor:'#666' };
    let id = (type === 'electricity' ? 'ele' : type) + ':' + (acct.consNo || idx);
    let color = acct.color || _colorForType(type, idx);
    return {
      id: id,
      type: type,
      group: tInfo.group,
      name: acct.name || type + ' ' + idx,
      icon: acct.icon || tInfo.icon,
      color: color,
      unit: acct.unit || tInfo.unit,
      consNo: acct.consNo || '',
      entities: acct.entities || {},
      statistics: acct.statistics || {},
      // Keep original config for water detail etc.
      acct: acct,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) { this._load(); return; }
    this._debouncedRefresh();
  }

  _debouncedRefresh() {
    if (this._rt) clearTimeout(this._rt);
    this._rt = setTimeout(function(self) { self._rt=null; self._load(); }, 1000, this);
  }

  connectedCallback() {
    if (this._hass && !this._loaded) { this._load(); }
    if (!this._bound) {
      this._bound = true;
      let self = this;
      this.addEventListener('click', function(e) {
        let btn = e.target.closest('[data-action]');
        if (!btn) return;
        let a = btn.dataset.action;
        let id = btn.dataset.id;
        if (a === 'toggle') {
          self._expanded = (self._expanded === id) ? null : id;
          self._renderRows();
          if (self._expanded) { self._loadDetail(self._expanded); }
        } else if (a === 'sw') {
          let swTarget = btn.dataset.target || self._expanded;
          self._chartModes[swTarget] = btn.dataset.mode;
          self._renderRows();
        } else if (a === 'ct') {
          let ctTarget = btn.dataset.target || self._expanded;
          self._chartTypes[ctTarget] = btn.dataset.ct;
          self._renderRows();
        } else if (a === 'cy') {
          self._hoverYear += Number(btn.dataset.dir);
          self._onYearChange();
        } else if (a === 'year') {
          self._hoverYear += Number(btn.dataset.dir);
          self._onYearChange();
        } else if (a === 'switchMode') {
          self._showYear = !self._showYear;
          self._updateHeader();
        } else if (a === 'summary') {
          // Desktop layout: all info visible, summary not needed
          if (self._el.rc && self._el.rc.clientWidth >= 800) return;
          self._showSummary = !self._showSummary;
          if (self._showSummary) {
            // Load details for all accounts for summary data
            for (let si=0;si<self._accounts.length;si++) {
              self._loadDetail(self._accounts[si].id);
            }
          }
          self._renderRows();
        } else if (a === 'filter') {
          let g = btn.dataset.group;
          if (self._filter.indexOf(g) >= 0) { self._filter = self._filter.filter(function(f) { return f !== g; }); }
          else { self._filter.push(g); }
          self._renderFilterBtns();
          self._renderRows();
        } else if (a === 'export') {
          self._exportPNG();
        } else if (a === 'exportCSV') {
          self._exportCSV();
        } else if (a === 'exportJSON') {
          self._exportJSON();
        } else if (a === 'fullscreen') {
          self._fullscreen = !self._fullscreen;
          self._renderRows();
        } else if (a === 'drill') {
          self._drillMonth = Number(btn.dataset.month);
          self._renderRows();
        } else if (a === 'drillClose') {
          self._drillMonth = null;
          self._renderRows();
        } else if (a === 'calPrev') {
          self._calMonth = self._calMonth > 0 ? self._calMonth - 1 : 11;
          self._renderRows();
        } else if (a === 'calNext') {
          self._calMonth = self._calMonth < 11 ? self._calMonth + 1 : 0;
          self._renderRows();
        }
      });
      this.addEventListener('mouseover', function(e) {
        let btn = e.target.closest('[data-action="month"],[data-action="drill"]');
        if (!btn) return;
        let m = Number(btn.dataset.month);
        let day = btn.dataset.day ? Number(btn.dataset.day) : null;
        if (!self._hoverMonth || self._hoverMonth.month !== m || self._hoverMonth.day !== day) {
          self._hoverMonth = { year: Number(btn.dataset.year), month: m, day: day };
          if (self._ht) clearTimeout(self._ht);
          self._ht = setTimeout(function() { self._ht=null; self._renderRows(); }, 80);
        }
      });
      this.addEventListener('mouseout', function(e) {
        if (!e.target.closest('[data-action="month"],[data-action="drill"]')) return;
        // Delay hide to allow moving between adjacent bars
        if (self._ht) clearTimeout(self._ht);
        self._ht = setTimeout(function() {
          self._ht=null; self._hoverMonth=null; self._renderRows();
        }, 300);
      });
      this.addEventListener('mousemove', function(e) {
        let s = e.target.closest('svg');
        if (!s) return;
        let r = s.getBoundingClientRect();
        let nx = e.clientX - r.left, ny = e.clientY - r.top;
        if (self._hoverMonth && (Math.abs(nx - (self._hoverPos?.x || -999)) > 3 || Math.abs(ny - (self._hoverPos?.y || -999)) > 3)) {
          self._hoverPos = { x: nx, y: ny };
          if (self._mt) clearTimeout(self._mt);
          self._mt = setTimeout(function() { self._mt=null; self._renderRows(); }, 40);
        } else {
          self._hoverPos = { x: nx, y: ny };
        }
      });
      // ESC to exit fullscreen
      this._keyHandler = function(e) { if (e.key === 'Escape' && self._fullscreen) { self._fullscreen = false; self._renderRows(); } };
      document.addEventListener('keydown', this._keyHandler);
    }
  }

  disconnectedCallback() {
    if (this._rt) clearTimeout(this._rt);
    if (this._ht) clearTimeout(this._ht);
    if (this._dt) clearTimeout(this._dt);
    if (this._mt) clearTimeout(this._mt);
    if (this._keyHandler) { document.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; }
    this._bound = false;
  }

  _onYearChange() {
    this._detailCache = {};
    this._costCache = null;
    this._preloadCostStats();
    if (this._expanded) {
      this._loadDetail(this._expanded);
    } else {
      this._renderRows();
      this._updateHeader();
    }
  }

  // ──── Load Live Data ────
  _load() {
    if (!this._hass) return;
    try {
    this._loaded = true;
    this._el.ye.textContent = String(this._year);
    let st = this._hass.states;
    let _v = function(id, d) { if (d === undefined) d = 0; let s = st[id]; if (!s) return null; let v = s.state; if (v === 'unavailable' || v === 'unknown' || v === 'none') return null; return Number(v) || d; };

    this._liveData = {};
    let self = this;

    // Load each account's live data from config entities
    for (let ai=0; ai<this._accounts.length; ai++) {
      let acct = this._accounts[ai];
      let ents = acct.entities;
      let ld = {};
      for (let key in ents) {
        if (ents[key]) {
          ld[key] = _v(ents[key]);
        }
      }
      this._liveData[acct.id] = ld;
    }

    // Second pass: compute totals for electricity sum account
    for (let ai=0; ai<this._accounts.length; ai++) {
      let acct = this._accounts[ai];
      if (acct.type === 'electricity' && acct.consNo === 'total') {
        let totalMonth = 0, totalYear = 0, totalCost = 0, totalBalance = 0, totalP = 0, totalV = 0, totalLastCost = 0;
        for (let j=0; j<this._accounts.length; j++) {
          let sub = this._accounts[j];
          if (sub.type === 'electricity' && sub.consNo !== 'total') {
            let sd = this._liveData[sub.id] || {};
            totalMonth += sd.month || 0;
            totalYear += sd.year || 0;
            totalCost += sd.cost || sd.yearCost || 0;
            totalBalance += sd.balance || 0;
            totalP += sd.peak || 0;
            totalV += sd.valley || 0;
            totalLastCost += sd.cost || 0;
          }
        }
        this._liveData[acct.id] = {
          month: totalMonth, year: totalYear, cost: totalCost,
          balance: totalBalance, peak: totalP, valley: totalV, lastCost: totalLastCost
        };
      }
    }

    // Load daily caches for electricity accounts (from state_grid attributes)
    for (let ai=0; ai<this._accounts.length; ai++) {
      let acct = this._accounts[ai];
      if (acct.type === 'electricity' && acct.consNo && acct.consNo !== 'total') {
        let ds = st['sensor.state_grid_' + acct.consNo + '_recent_30_daily_ele_list'];
        if (ds && ds.attributes && ds.attributes.graph) { this._dailyCache[acct.consNo] = ds.attributes.graph; }
        let ms = st['sensor.state_grid_' + acct.consNo + '_recent_12_monthly_ele_list'];
        if (ms && ms.attributes && ms.attributes.graph) {
          // Store monthly_ele_list for peak/valley enrichment
          this._monthlyEleList = this._monthlyEleList || {};
          this._monthlyEleList[acct.consNo] = ms.attributes.graph;
        }
      }
    }

    this._renderFilterBtns();
    this._preloadCostStats();
    this._updateHeader();
    this._renderRows();
    } catch(e) { console.error('C3H3 Energy Hub: _load error', e); }
  }

  _preloadCostStats() {
    let self = this;
    let year = this._hoverYear;
    let statIds = [];

    for (let i=0;i<this._accounts.length;i++) {
      let acct = this._accounts[i];
      let s = acct.statistics || {};
      for (let k in s) {
        if (k === 'cost' && s[k] && statIds.indexOf(s[k]) === -1) {
          statIds.push(s[k]);
        }
      }
    }

    if (statIds.length === 0) return;

    let cacheKey = 'cost:' + year;
    if (this._costCache && this._costCache[cacheKey]) return;

    this._hass.callWS({
      type:'recorder/statistics_during_period',
      start_time: new Date(year,0,1).toISOString(),
      end_time: new Date(year+1,0,1).toISOString(),
      statistic_ids: statIds,
      period: 'month'
    }).then(function(resp) {
      if (!resp) return;
      self._costCache = self._costCache || {};
      let cc = {};
      for (let si=0;si<statIds.length;si++) {
        let sid = statIds[si];
        let items = resp[sid] || [];
        let total = 0;
        for (let ii=0;ii<items.length;ii++) {
          total += items[ii].change || 0;
        }
        cc[sid] = total;
      }
      self._costCache[cacheKey] = cc;
      self._updateHeader();
    }).catch(function(err) {
      console.warn('C3H3 Energy Hub: preloadCostStats error:', err);
    });
  }

  // ──── Detail Loading ────
  _loadDetail(id) {
    if (!id) return;
    let self = this;
    let year = this._hoverYear;
    let ck = id + ':' + year;
    let ck2 = id + ':' + (year-1);

    // Find the account
    let acct = null;
    for (let i=0;i<this._accounts.length;i++) {
      if (this._accounts[i].id === id) { acct = this._accounts[i]; break; }
    }
    if (!acct) { this._loadingDetails[id] = false; return; }

    // Check cache first
    if (this._detailCache[ck] && this._detailCache[ck2]) { this._renderRows(); this._updateHeader(); return; }
    let cached1 = _cG(_cK('dc',id,year));
    let cached2 = _cG(_cK('dc',id,year-1));
    if (cached1 && cached2) {
      this._detailCache[ck] = cached1;
      this._detailCache[ck2] = cached2;
      this._renderRows();
      this._updateHeader();
      return;
    }

    this._loadingDetails[id] = true;
    this._renderRows();

    // Build statistic IDs from account config
    let statIds = [];
    if (acct.statistics) {
      if (acct.type === 'electricity') {
        if (acct.statistics.energy) statIds.push(acct.statistics.energy);
        if (acct.statistics.cost) statIds.push(acct.statistics.cost);
      } else if (acct.type === 'gas') {
        if (acct.statistics.usage) statIds.push(acct.statistics.usage);
        if (acct.statistics.cost) statIds.push(acct.statistics.cost);
      } else if (acct.type === 'water') {
        if (acct.statistics.usage) statIds.push(acct.statistics.usage);
        if (acct.statistics.cost) statIds.push(acct.statistics.cost);
      }
    }

    // For ele:total, collect sub-account stat IDs instead
    if (acct.type === 'electricity' && acct.consNo === 'total') {
      let allStats = [];
      for (let i=0;i<this._accounts.length;i++) {
        let sa = this._accounts[i];
        if (sa.type === 'electricity' && sa.consNo !== 'total' && sa.statistics) {
          if (sa.statistics.energy) allStats.push(sa.statistics.energy);
          if (sa.statistics.cost) allStats.push(sa.statistics.cost);
        }
      }
      if (allStats.length > 0) { statIds = allStats; }
    }

    if (statIds.length === 0) {
      this._loadingDetails[id] = false;
      this._renderRows();
      return;
    }

    function _fetchStats(y) {
      return self._hass.callWS({
        type:'recorder/statistics_during_period',
        start_time: new Date(y,0,1).toISOString(),
        end_time: new Date(y+1,0,1).toISOString(),
        statistic_ids: statIds,
        period: 'month'
      });
    }

    function _mergeCostAndUsage(response, statIds) {
      let result = {};
      if (!response) return result;
      let costSuffix = ['_cost', '_bill', '_amount'];
      for (let si=0;si<statIds.length;si++) {
        let sid = statIds[si];
        let isCost = costSuffix.some(function(s) { return sid.indexOf(s) >= 0; });
        let items = response[sid] || [];
        for (let ii=0;ii<items.length;ii++) {
          let mo = new Date(items[ii].start).getMonth();
          if (!result[mo]) result[mo] = {change:0, sum:0, cost:0, state:0};
          if (isCost) {
            result[mo].cost = (result[mo].cost || 0) + (items[ii].change || 0);
          } else {
            result[mo].change = (result[mo].change || 0) + (items[ii].change || 0);
            result[mo].sum = (result[mo].sum || 0) + (items[ii].sum || 0);
            result[mo].state = (result[mo].state || 0) + (items[ii].state || 0);
          }
        }
      }
      return result;
    }

    Promise.all([
      _fetchStats(year),
      _fetchStats(year-1)
    ]).then(function(results) {
      self._detailCache[ck] = _mergeCostAndUsage(results[0], statIds);
      self._detailCache[ck2] = _mergeCostAndUsage(results[1], statIds);
      _cS(_cK('dc',id,year), self._detailCache[ck]);
      _cS(_cK('dc',id,year-1), self._detailCache[ck2]);
      self._enrichPeakValley(id, year);
      self._enrichPeakValley(id, year-1);
      self._loadingDetails[id] = false;
      self._renderRows();
      self._updateHeader();
    }).catch(function(err) {
      console.warn('C3H3 Energy Hub: loadDetail error for ' + id + ': ' + err);
      self._loadingDetails[id] = false;
      self._updateHeader();
      // Don't render again to avoid flash
    });
  }

  _enrichPeakValley(id, year) {
    // Enrich electricity accounts with peak/valley data from monthly_ele_list
    if (!this._monthlyEleList) return;
    let acct = null;
    for (let i=0;i<this._accounts.length;i++) {
      if (this._accounts[i].id === id) { acct = this._accounts[i]; break; }
    }
    if (!acct || acct.type !== 'electricity' || !acct.consNo) return;
    let list = this._monthlyEleList[acct.consNo];
    if (!list) return;
    let dk = this._detailCache[id+':'+year];
    if (!dk) return;
    for (let mi=0;mi<list.length;mi++) {
      let m = list[mi];
      let y = parseInt(m.month.substring(0,4), 10);
      if (y !== year) continue;
      let mo = parseInt(m.month.substring(4,6), 10) - 1;
      if (dk[mo]) {
        dk[mo].p_ele = m.p_ele || 0;
        dk[mo].v_ele = m.v_ele || 0;
        dk[mo].n_ele = m.n_ele || 0;
        if (m.cost) { dk[mo].cost = m.cost; }
      }
    }
  }

  // ──── Render Methods ────
  _renderFilterBtns() {
    let groups = [{g:'ele',l:'电'},{g:'gas',l:'气'},{g:'water',l:'水'}];
    let self = this;
    this._el.fb.innerHTML = groups.map(function(g) {
      let active = self._filter.indexOf(g.g) >= 0;
      return '<button class="nb' + (active ? ' a' : ' ng') + '" data-action="filter" data-group="' + g.g + '" style="font-size:11px;padding:2px 10px">' + g.l + '</button>';
    }).join('');
  }

  _updateHeader() {
    let ld = this._liveData;
    let isY = this._showYear;
    this._el.ye.textContent = String(this._year);
    this._el.tb.textContent = isY ? '本年' : '本月';

    // Aggregate totals from live data (skip virtual total accounts)
    let eleTotal = 0, gasMonth = null, waterMonth = null;
    let lastCost = 0, gasBill = 0, waterBill = 0;

    for (let ai=0; ai<this._accounts.length; ai++) {
      let acct = this._accounts[ai];
      if (acct.consNo === 'total') continue;
      let d = ld[acct.id];
      if (!d) continue;
      if (acct.type === 'electricity') {
        eleTotal += isY ? (d.year || d.month || 0) : (d.month || 0);
        lastCost += d.cost || 0;
      } else if (acct.type === 'gas') {
        gasMonth = (gasMonth || 0) + (isY ? (d.year || d.month || 0) : (d.month || 0));
        gasBill = (gasBill || 0) + (d.bill || 0);
      } else if (acct.type === 'water') {
        if (isY) {
          let wc = this._detailCache[acct.id+':'+this._year];
          if (wc && Object.keys(wc).length > 0) {
            let wTot = 0;
            for (let wk in wc) { wTot += Math.max(0, wc[wk].state || 0); }
            waterMonth = (waterMonth || 0) + wTot;
          } else {
            waterMonth = (waterMonth || 0) + (d.month || 0);
          }
        } else {
          waterMonth = (waterMonth || 0) + (d.month || 0);
        }
        waterBill = (waterBill || 0) + (d.bill || 0);
      }
    }

    let ringEle = lastCost||0, ringGas = gasBill||0, ringWater = waterBill||0;
    if (isY && this._costCache) {
      let ccKey = 'cost:' + this._year;
      let cc = this._costCache[ccKey];
      if (cc) {
        ringEle = 0; ringGas = 0; ringWater = 0;
        for (let ci=0;ci<this._accounts.length;ci++) {
          let ca = this._accounts[ci];
          if (ca.consNo === 'total' || !ca.statistics) continue;
          let csid = ca.statistics.cost;
          if (!csid || cc[csid] == null) continue;
          if (ca.type === 'electricity') ringEle += cc[csid];
          else if (ca.type === 'gas') ringGas += cc[csid];
          else if (ca.type === 'water') ringWater += cc[csid];
        }
      }
    }
    let tot = ringEle + ringGas + ringWater;
    this._el.tc.textContent = tot > 0 ? String(tot.toFixed(0)) : '--';

    // Balance row
    let blsEl = this._el.bls;
    if (blsEl) {
      let balParts = [];
      let balTypes = [
        { type:'electricity', icon:'⚡', label:'用电' },
        { type:'gas', icon:'🔥', label:'燃气' },
        { type:'water', icon:'💧', label:'用水' }
      ];
      for (let bt=0;bt<balTypes.length;bt++) {
        let btInfo = balTypes[bt];
        let totalBal = 0;
        let hasBal = false;
        for (let bi=0;bi<this._accounts.length;bi++) {
          let a2 = this._accounts[bi];
          if (a2.type !== btInfo.type || a2.consNo === 'total') continue;
          let d2 = ld[a2.id];
          if (d2 && d2.balance != null) {
            totalBal += d2.balance;
            hasBal = true;
          }
        }
        if (hasBal) {
          balParts.push('<span style="display:inline-flex;align-items:center;gap:3px;color:var(--secondary-text-color)">' + btInfo.icon + ' ' + btInfo.label + ': <b style="color:var(--primary-color);font-weight:600">¥' + totalBal.toFixed(2) + '</b></span>');
        }
      }
      if (balParts.length > 0) {
        blsEl.innerHTML = balParts.join('<span style="color:var(--divider-color)">|</span>');
        blsEl.style.display = '';
      } else {
        blsEl.innerHTML = '';
        blsEl.style.display = 'none';
      }
    }

    // Ring chart + right-side cost cards (use type map to avoid index shifts)
    let cMap = [ {v:ringEle, c:CC.el, l:'用电'}, {v:ringGas, c:CC.ga, l:'燃气'}, {v:ringWater, c:CC.wa, l:'用水'} ];
    let cVals = [], cCols = [], cLabels = [];
    for (let ci=0;ci<cMap.length;ci++) { if (cMap[ci].v > 0) { cVals.push(cMap[ci].v); cCols.push(cMap[ci].c); cLabels.push(cMap[ci].l); } }
    this._el.dw.innerHTML = _ring(cVals, cCols);

    // Cost cards on the right
    let orArr = [];
    if (cVals.length > 0) {
      let cTotal = cVals.reduce(function(a,b){return a+b;}, 0);
      for (let i=0;i<cLabels.length;i++) {
        orArr.push('<div class="oi"><span class="od" style="background:' + cCols[i] + '"></span><span class="on">' + cLabels[i] + '</span><span class="ovl" style="color:' + cCols[i] + '">¥' + cVals[i].toFixed(0) + '</span><span class="op">' + _pct(cVals[i], cTotal) + '%</span></div>');
      }
      orArr.push('<div class="ot"><span>合计</span><span>¥' + cTotal.toFixed(0) + '</span></div>');
    }
    this._el.or.innerHTML = orArr.join('');
  }

  // Desktop 4-column layout for wide screens
  _renderDesktopLayout(ld, y1, y2) {
    let groups = [
      { key:'electricity', icon:'⚡', label:'用电', color:CC.el, unit:'kWh', accounts:[] },
      { key:'gas', icon:'🔥', label:'燃气', color:CC.ga, unit:'m³', accounts:[] },
      { key:'water', icon:'💧', label:'用水', color:CC.wa, unit:'m³', accounts:[] }
    ];
    for (let ai=0;ai<this._accounts.length;ai++) {
      let a = this._accounts[ai];
      if (a.consNo === 'total') continue;
      for (let gi=0;gi<groups.length;gi++) {
        if (groups[gi].key === a.type) { groups[gi].accounts.push(a); break; }
      }
    }

    let html = '<div class="dg">';

    // Column 1: Overall
    let ringEle = 0, ringGas = 0, ringWater = 0;
    for (let ai=0;ai<this._accounts.length;ai++) {
      let a = this._accounts[ai]; if (a.consNo==='total') continue;
      let d = ld[a.id]; if (!d) continue;
      if (a.type==='electricity') ringEle += d.cost || 0;
      else if (a.type==='gas') ringGas += d.bill || 0;
      else if (a.type==='water') ringWater += d.bill || 0;
    }
    let cVals = [], cCols = [], cLabels = [];
    let cm = [{v:ringEle,c:CC.el,l:'用电'},{v:ringGas,c:CC.ga,l:'燃气'},{v:ringWater,c:CC.wa,l:'用水'}];
    for (let ci=0;ci<cm.length;ci++) { if (cm[ci].v>0) { cVals.push(cm[ci].v); cCols.push(cm[ci].c); cLabels.push(cm[ci].l); } }
    let cTotal = cVals.length>0 ? cVals.reduce((a,b)=>a+b,0) : 0;
    let ovItems = '';
    for (let i=0;i<cLabels.length;i++) {
      ovItems += '<div class="dc-it"><span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:4px;background:' + cCols[i] + '"></span>' + cLabels[i] + '</span><span class="dv" style="color:' + cCols[i] + '">¥' + cVals[i].toFixed(0) + '</span></div>';
    }
    html += '<div class="dc"><div class="dc-hd">📊 总览</div><div class="dc-bd"><div class="dw" style="width:120px;height:120px;margin:0 auto 6px">' +
      _ring(cVals, cCols) + '</div>' + ovItems +
      (cTotal>0?'<div class="dc-it" style="font-weight:600;border-bottom:none"><span>合计</span><span class="dv">¥' + cTotal.toFixed(0) + '</span></div>':'') +
      '</div></div>';

    // Columns 2-4: Electricity, Gas, Water
    for (let gi=0;gi<groups.length;gi++) {
      let grp = groups[gi];
      let accs = grp.accounts;
      if (accs.length === 0) { html += '<div class="dc"><div class="dc-hd" style="color:' + grp.color + '">' + grp.icon + ' ' + grp.label + '</div><div class="dc-bd" style="text-align:center;color:var(--secondary-text-color);font-size:12px;padding:20px">无数据</div></div>'; continue; }

      let colHtml = '';
      for (let ai=0;ai<accs.length;ai++) {
        let a = accs[ai], d = ld[a.id];
        if (!d || d.month == null) continue;
        let costStr = '';
        if (a.type==='electricity') costStr = d.cost != null ? '上月 ¥' + d.cost.toFixed(0) : '';
        else if (a.type==='gas') costStr = d.cost != null ? '累计 ¥' + d.cost.toFixed(0) : (d.bill != null ? '账单 ¥' + d.bill.toFixed(0) : '');
        else if (a.type==='water') costStr = d.cost != null ? '累计 ¥' + d.cost.toFixed(0) : (d.bill != null ? '账单 ¥' + d.bill.toFixed(0) : '');

        colHtml += '<div class="dc-it">' +
          '<span style="display:flex;align-items:center;gap:4px"><span class="ic" style="width:20px;height:20px;border-radius:50%;background:' + a.color + '15;display:inline-flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">' + a.icon + '</span>' + a.name + '</span>' +
          '<span class="dv">' + d.month.toFixed(1) + ' <span class="dl">' + grp.unit + '</span></span></div>';
        if (costStr) colHtml += '<div style="font-size:10px;color:var(--secondary-text-color);text-align:right;margin-top:-3px;margin-bottom:2px">' + costStr + '</div>';

        // Budget bar
        let budget = this._budgets[a.group];
        if (budget && d.month != null) {
          let pct = Math.min(100, (d.month/budget)*100);
          let bc = pct>100?'#ef4444':(pct>80?'#f59e0b':'#10b981');
          colHtml += '<div class="dc-bud"><div style="width:' + pct.toFixed(0) + '%;background:' + bc + '"></div></div>';
        }
        // Balance
        if (d.balance != null) colHtml += '<div style="font-size:10px;color:var(--secondary-text-color);margin-top:2px">余额 ¥' + d.balance.toFixed(2) + '</div>';
      }

      // Chart for this group (use first account's detail cache)
      let firstAcc = accs[0];
      let ca1 = this._detailCache[firstAcc.id+':'+y1] || {};
      let ca2 = this._detailCache[firstAcc.id+':'+y2] || {};
      let mode = this._chartModes[firstAcc.id] || (firstAcc.type==='water'?'cost':'usage');
      let chartHtml = '';
      if (Object.keys(ca1).length > 0) {
        chartHtml += '<div class="ha" style="justify-content:space-between;margin:4px 0 2px"><div class="ha">' + this._btnGroup(firstAcc, firstAcc.id) + '</div>' +
          '<div class="ha"><button class="nb" data-action="cy" data-dir="-1"><</button><span class="yt" style="font-size:11px;min-width:24px">' + y1 + '</span><button class="nb" data-action="cy" data-dir="1">></button></div></div>' +
          '<div style="font-size:9px;display:flex;gap:8px;margin-bottom:2px"><span style="display:flex;align-items:center;gap:2px"><span style="width:6px;height:6px;border-radius:50%;background:' + CC.y1 + '"></span>本年</span><span style="display:flex;align-items:center;gap:2px"><span style="width:6px;height:6px;border-radius:50%;background:' + CC.y2 + '"></span>去年</span></div>' +
          '<div class="ca">' + this._chartSVG(firstAcc.id, ca1, ca2, mode, this._chartTypes[firstAcc.id]||'bar', firstAcc.name) + '</div>';
      }

      html += '<div class="dc"><div class="dc-hd" style="color:' + grp.color + '">' + grp.icon + ' ' + grp.label + '</div><div class="dc-bd">' + colHtml + chartHtml + '</div></div>';
    }

    html += '</div>';
    this._el.rc.innerHTML = html;
  }

  _renderRows() {
    let ld = this._liveData;
    let y1 = this._hoverYear;
    let y2 = y1 - 1;

    // Yearly summary view
    if (this._showSummary) {
      this._el.rc.innerHTML = this._renderYearSummary(ld, y1, y2);
      return;
    }

    // Desktop 4-column layout for wide containers
    if (this._el.rc && this._el.rc.clientWidth >= 800) {
      this._renderDesktopLayout(ld, y1, y2);
      return;
    }

    let visible = this._accounts.filter(function(a) {
      for (let fi=0;fi<this._filter.length;fi++) { if (a.group === this._filter[fi]) return true; }
      return false;
    }.bind(this));

    let html = '<div class="eg">';
    for (let ai=0;ai<visible.length;ai++) {
      let a = visible[ai];
      let d = ld[a.id];
      if (!d || d.month == null) continue;
      let sub = ''; let costDisplay = '';
      let color = a.color || '#3b82f6';

      // Build sub/cost display based on account type
      if (a.type === 'electricity') {
        let yc = d.cost || d.yearCost || null;
        if (d.balance != null) { sub = '余额 ' + d.balance.toFixed(1); }
        costDisplay = d.cost != null ? '上月 ' + d.cost.toFixed(0) : (yc != null ? '年费 ' + yc.toFixed(0) : '');
      } else if (a.type === 'gas') {
        // Fallback: live sensor may be unavailable, use stats cache
        if (d.cost != null) { costDisplay = '累计 ' + d.cost.toFixed(0); }
        else {
          let dk = this._detailCache[a.id+':'+this._hoverYear];
          if (dk) {
            let totalCost = 0; let cnt = 0;
            for (let mk in dk) { if (dk[mk].cost) { totalCost += dk[mk].cost; cnt++; } }
            if (cnt > 0) costDisplay = '累计 ' + totalCost.toFixed(0);
          }
        }
        if (d.balance != null) { sub = '余额 ' + d.balance.toFixed(1); }
      } else if (a.type === 'water') {
        if (d.cost != null) { costDisplay = '累计 ' + d.cost.toFixed(0); }
        else {
          let dk = this._detailCache[a.id+':'+this._hoverYear];
          if (dk) {
            let totalCost = 0; let cnt = 0;
            for (let mk in dk) { if (dk[mk].cost) { totalCost += dk[mk].cost; cnt++; } }
            if (cnt > 0) costDisplay = '累计 ' + totalCost.toFixed(0);
          }
        }
        if (d.bill != null) { sub = 'bill ' + d.bill.toFixed(0); }
      }

      let isOpen = (this._expanded === a.id);
      let yoyLabel = '';
      let dk1 = this._detailCache[a.id+':'+y1];
      let dk2 = this._detailCache[a.id+':'+y2];
      if (dk1 && dk2) {
        let cur = 0; let prev = 0;
        let keys = Object.keys(dk1);
        for (let ki=0;ki<keys.length;ki++) { cur += Math.max(0, dk1[keys[ki]].change||0); }
        keys = Object.keys(dk2);
        for (let ki=0;ki<keys.length;ki++) { prev += Math.max(0, dk2[keys[ki]].change||0); }
        if (cur > 0 && prev > 0) { yoyLabel = _yoy(cur, prev); }
      }

      // Budget progress & alert
      let budgetVal = null;
      let budgetColor = '';
      let budgetLabel = '';
      let alertMsg = '';
      let budget = this._budgets[a.group];
      if (budget && d.month != null) {
        budgetVal = Math.min(100, (d.month / budget) * 100);
        budgetColor = budgetVal > 100 ? '#ef4444' : (budgetVal > 80 ? '#f59e0b' : '#10b981');
        budgetLabel = (budgetVal > 100 ? '+' : '') + (d.month - budget).toFixed(1);
      }

      // Usage alert
      if (dk1 && dk2) {
        let curTotal = 0; let prevTotal = 0; let curCount = 0; let prevCount = 0;
        for (let ki=0;ki<12;ki++) {
          if (dk1[ki]) { curTotal += dk1[ki].change||0; curCount++; }
          if (dk2[ki]) { prevTotal += dk2[ki].change||0; prevCount++; }
        }
        let curAvg = curCount > 0 ? curTotal / curCount : 0;
        let prevAvg = prevCount > 0 ? prevTotal / prevCount : 0;
        if (prevAvg > 0 && curAvg > prevAvg * this._alertThreshold) {
          alertMsg = curAvg > prevAvg * 1.5 ? '!!' : '!';
        }
      }

      // Build secondary info line
      let secLine = sub || '点击查看详情';
      if (costDisplay) secLine = costDisplay + (secLine !== '点击查看详情' ? ' · ' + secLine : '');
      if (yoyLabel) secLine = (secLine !== '点击查看详情' ? secLine + ' · ' : '') + '<span style="color:' + (yoyLabel[0]==='+'?'#ef4444':'#10b981') + '">' + yoyLabel + '</span>';

      html += '<div class="ea' + (isOpen?' ef':'') + '"><div class="er2"' + (isOpen?'':' data-action="toggle" data-id="' + a.id + '"') + '>' +
        '<div class="ic" style="background:' + color + '15">' + a.icon + '</div>' +
        '<div class="eb"><div class="en">' + a.name + (alertMsg ? '<span style="margin-left:6px;color:#ef4444;font-size:10px">' + alertMsg + '</span>' : '') + '</div><div class="es">' + secLine + '</div></div>' +
        '<div class="ev"><div class="evv">' + d.month.toFixed(1) + '<span class="evu">' + a.unit + '</span></div><div class="es2">' +
        (budgetVal != null ? '<span style="color:' + budgetColor + '">预算' + budgetLabel + '</span>' : '') +
        '</div></div>' +
        '<div class="ar" style="transform:rotate(' + (isOpen?'90':'0') + 'deg)"></div></div>';

      if (isOpen) {
        if (a.type === 'water') {
          // Water: show detail + chart
          let ca1 = this._detailCache[a.id+':'+y1] || {};
          let ca2 = this._detailCache[a.id+':'+y2] || {};
          html += '<div class="dsec"><div style="padding:10px 12px 12px">' + this._waterDetail(d, a) + '</div></div>';
          let tierHtml = this._tierHTML(a);
          if (tierHtml) {
            html += '<div class="dsec"><div style="padding:4px 12px 8px">' + tierHtml + '</div></div>';
          }
          if (Object.keys(ca1).length > 0) {
            html += '<div class="dsec"><div style="padding:8px 12px 10px">' +
              '<div class="ha" style="justify-content:space-between;margin-bottom:4px">' +
              '<div class="ha">' + this._btnGroup(a) + '</div>' +
              '<div class="ha"><button class="nb" data-action="cy" data-dir="-1"><</button><span class="yt" style="font-size:12px;min-width:28px">' + y1 + '</span><button class="nb" data-action="cy" data-dir="1">></button></div></div>' +
              this._extraCards(a, d, ca1) +
              '<div class="cl" style="margin-bottom:2px;font-size:10px;gap:14px"><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:' + CC.y1 + '"></span>本年</span><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:' + CC.y2 + '"></span>去年</span></div>' +
              '<div class="ca">' + this._chartSVG(a.id, ca1, ca2, this._chartModes[a.id]||(a.type==='water'?'cost':'usage'), this._chartTypes[a.id]||'bar', a.name) + '</div>' +
              this._bottomCards(ca1, ca2, this._chartModes[a.id]||(a.type==='water'?'cost':'usage'), a.unit) +
              '</div></div>';
          }
          html += '</div>'; continue;
        }
        let isLoading = this._loadingDetails[a.id];
        let ca1 = this._detailCache[a.id+':'+y1] || {};
        let ca2 = this._detailCache[a.id+':'+y2] || {};
        if (isLoading && Object.keys(ca1).length === 0) {
          html += '<div class="dsec"><div style="padding:24px;text-align:center;color:var(--secondary-text-color);font-size:13px">加载中...</div></div>';
          html += '</div>'; continue;
        }
        html += '<div class="dsec"><div style="padding:8px 12px 10px">' +
          this._tierHTML(a) +
          this._distBarHTML(a) +
          '<div class="ha" style="justify-content:space-between;margin-bottom:4px">' +
          '<div class="ha">' + this._btnGroup(a) + '</div>' +
          '<div class="ha"><button class="nb" data-action="cy" data-dir="-1"><</button><span class="yt" style="font-size:12px;min-width:28px">' + y1 + '</span><button class="nb" data-action="cy" data-dir="1">></button></div></div>' +
          this._extraCards(a, d, ca1) +
          '<div class="cl" style="margin-bottom:2px;font-size:10px;gap:14px"><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:' + CC.y1 + '"></span>本年</span><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:' + CC.y2 + '"></span>去年</span></div>' +
          (this._fullscreen ? '<div class="fs"><div class="fs-close"><button class="nb" data-action="fullscreen" style="font-size:12px">✕</button></div>' : '') +
          '<div class="ed"><div class="ed-l">' +
          '<div class="ca">' + this._chartSVG(a.id, ca1, ca2, this._chartModes[a.id]||(a.type==='water'?'cost':'usage'), this._chartTypes[a.id]||'bar', a.name) + '</div>' +
          (this._fullscreen ? '</div>' : '') +
          (this._drillMonth != null && a.type==='electricity' ? this._drillDaily(a.consNo, this._drillMonth, y1) : '') +
          this._bottomCards(ca1, ca2, this._chartModes[a.id]||(a.type==='water'?'cost':'usage'), a.unit) +
          '</div><div class="ed-r">' +
          (a.type==='electricity' ? this._dailyCalendar(a.consNo) : '') +
          // Day tooltip for calendar hover
          (this._hoverMonth && this._hoverMonth.day != null ? this._dayTipHTML(a, this._hoverMonth) : '') +
          '</div></div>' +
          '<div class="ha" style="margin-top:4px;gap:4px">' +
          '<button class="nb" data-action="fullscreen" style="font-size:10px;padding:2px 8px">全屏</button>' +
          '</div></div></div>';
      }
      html += '</div>';
    }
    this._el.rc.innerHTML = html + '</div>';
  }

  _drillDaily(consNo, monthIdx, year) {
    let d = this._dailyCache[consNo];
    if (!d || d.length === 0) return '';
    let prefix = String(year) + (monthIdx+1).toString().padStart(2,'0');
    let days = d.filter(function(x) { return x.day.indexOf(prefix) === 0; });
    if (days.length === 0) {
      return '<div style="padding:6px 12px 8px;font-size:10px;color:var(--secondary-text-color);display:flex;justify-content:space-between"><span>day ' + (monthIdx+1) + ' ele</span><button class="nb" data-action="drillClose" style="font-size:10px;padding:1px 6px">X</button></div>';
    }
    let W = 280; let H = 50; let PT = 4; let PB = 12; let CH = H - PT - PB;
    let maxV = 1;
    for (let i=0;i<days.length;i++) { if (days[i].ele > maxV) maxV = days[i].ele; }
    let bw = Math.max(1, W / days.length - 1);
    let bars = '';
    for (let i=0;i<days.length;i++) {
      let h = (days[i].ele / maxV) * CH;
      let x = i * (bw + 1);
      let y = H - PB - h;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + CC.el + '" opacity="0.5" rx="1"/>';
    }
    return '<div style="padding:4px 12px 8px"><div style="font-size:10px;color:var(--secondary-text-color);display:flex;justify-content:space-between;margin-bottom:2px"><span>day ' + (monthIdx+1) + ' ele</span><button class="nb" data-action="drillClose" style="font-size:10px;padding:1px 6px">X</button></div><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:50px;display:block">' + bars + '</svg></div>';
  }

  _dayTipHTML(acct, hm) {
    if (!hm || hm.day == null) return '';
    let days = this._dailyCache[acct.consNo];
    if (!days) return '';
    let prefix = String(hm.year) + (hm.month+1).toString().padStart(2,'0') + (hm.day).toString().padStart(2,'0');
    let entry = null;
    for (let i=0;i<days.length;i++) { if (days[i].day === prefix) { entry = days[i]; break; } }
    if (!entry) return '';
    const val = entry.ele || 0;
    return '<div style="padding:8px 12px;background:var(--card-background-color);border-radius:8px;border:1px solid var(--divider-color);margin-top:4px;font-size:12px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.1)">' +
      '<span style="font-weight:600;color:var(--primary-text-color)">' + hm.month+1 + '月' + hm.day + '日</span>' +
      '<span style="color:' + CC.el + ';font-weight:700">' + val.toFixed(1) + ' kWh</span>' +
      (entry.cost ? '<span style="color:var(--secondary-text-color)">¥' + entry.cost.toFixed(0) + '</span>' : '') +
      '</div>';
  }

  _btnGroup(a, targetId) {
    let m = this._chartModes[a.id]||(a.type==='water'?'cost':'usage');
    let ct = this._chartTypes[a.id]||'bar';
    let isCum = (ct === 'cum');
    let tAttr = targetId ? ' data-target="' + targetId + '"' : '';
    return '<button class="nb' + (m==='usage'?' a':'') + '" data-action="sw" data-mode="usage"' + tAttr + '>' + a.unit + '</button><button class="nb' + (m==='cost'?' a':'') + '" data-action="sw" data-mode="cost"' + tAttr + '>$</button>' +
      '<span style="width:1px;height:16px;background:var(--divider-color);margin:0 4px"></span>' +
      '<button class="nb' + (!isCum&&ct==='line'?' a':'') + '" data-action="ct" data-ct="line"' + tAttr + ' style="font-size:12px;padding:4px 8px;line-height:1"><svg width="14" height="14" viewBox="0 0 14 14"><polyline points="1,12 5,8 9,10 13,2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<button class="nb' + (!isCum&&ct==='bar'?' a':'') + '" data-action="ct" data-ct="bar"' + tAttr + ' style="font-size:12px;padding:4px 8px;line-height:1"><svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="7" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="5.5" y="4" width="3" height="9" rx="0.5" fill="currentColor"/><rect x="10" y="1" width="3" height="12" rx="0.5" fill="currentColor"/></svg></button>' +
      '<button class="nb' + (isCum?' a':'') + '" data-action="ct" data-ct="cum"' + tAttr + ' style="font-size:12px;padding:4px 8px;line-height:1"><svg width="14" height="14" viewBox="0 0 14 14"><polyline points="1,12 4,12 4,8 7,8 7,5 10,5 10,2 13,2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  }

  _extraCards(a, d, d1) {
    let cur = new Date().getMonth();
    let curCost = (d1[cur]&&d1[cur].cost) || (d1[cur-1]&&d1[cur-1].cost) || null;
    if (a.type === 'electricity') {
      return '<div class="sd2" style="margin-bottom:4px">' +
        '<div class="sc"><div class="sv">' + (d.month!=null?d.month.toFixed(1):'--') + '</div><div class="sl">本月 kWh</div></div>' +
        '<div class="sc"><div class="sv">' + (curCost!=null?''+curCost.toFixed(0):(d.cost!=null?'~'+d.cost.toFixed(0):'--')) + '</div><div class="sl">' + (curCost!=null?'本月费':'上月费') + '</div></div>' +
        '<div class="sc"><div class="sv" style="color:' + (d.balance!=null&&d.balance<0?'#ef4444':'inherit') + '">' + (d.balance!=null?''+d.balance.toFixed(1):'--') + '</div><div class="sl">余额</div></div>' +
        '<div class="sc"><div class="sv">' + (d.peak!=null?'峰'+d.peak.toFixed(0):'--') + '</div><div class="sl">峰</div></div></div>';
    }
    if (a.type === 'gas') {
      return '<div class="sd2" style="margin-bottom:4px">' +
        '<div class="sc"><div class="sv">' + (d.month!=null?d.month.toFixed(1):'--') + '</div><div class="sl">本月 m³</div></div>' +
        '<div class="sc"><div class="sv">' + (curCost!=null?''+curCost.toFixed(0):(d.cost!=null?''+d.cost.toFixed(0):'--')) + '</div><div class="sl">' + (curCost!=null?'费用':'累计') + '</div></div>' +
        '<div class="sc"><div class="sv">' + (d.year!=null?d.year.toFixed(0):'--') + '</div><div class="sl">年 m³</div></div>' +
        '<div class="sc"><div class="sv">' + (d.balance!=null?''+d.balance.toFixed(1):'--') + '</div><div class="sl">余额</div></div></div>';
    }
    if (a.type === 'water') {
      return '<div class="sd2" style="margin-bottom:4px">' +
        '<div class="sc"><div class="sv">' + (d.month!=null?d.month.toFixed(1):'--') + '</div><div class="sl">本月 m³</div></div>' +
        '<div class="sc"><div class="sv">' + (curCost!=null?''+curCost.toFixed(0):(d.cost!=null?''+d.cost.toFixed(0):'--')) + '</div><div class="sl">' + (curCost!=null?'费用':'累计') + '</div></div>' +
        '<div class="sc"><div class="sv">' + (d.bill!=null?d.bill.toFixed(0):'--') + '</div><div class="sl">账单</div></div>' +
        '<div class="sc"><div class="sv">' + (d.avg!=null?d.avg.toFixed(1):'--') + '</div><div class="sl">月均</div></div></div>';
    }
    return '';
  }

  _waterDetail(d, acct) {
    let t1=d.tier1||0; let t2=d.tier2||0; let t3=d.tier3||0; let tot=t1+t2+t3;
    let eb=d.est_bill||d.bill||null;
    let cap=d.tier_cap||180;
    let used=d.year_t1||0;
    let pct=Math.min(100, _pct(used, cap));
    let rm=d.tier_remain!=null?d.tier_remain:Math.max(0,cap-used);
    let avg=d.avg||0;
    let vsAvg = '';
    if (avg>0) {
      let p = d.month > avg ? ((d.month/avg-1)*100).toFixed(0) : ((1-d.month/avg)*100).toFixed(0);
      let sym = d.month > avg ? '+' : '-';
      let clr = d.month > avg ? '#ef4444' : CC.wa;
      vsAvg = '<div style="font-size:10px;color:var(--secondary-text-color);margin-top:4px">vs avg: <span style="color:' + clr + ';font-weight:500">' + sym + p + '%</span></div>';
    }
    let tierHtml = '';
    if (tot>0) {
      tierHtml = '<div style="font-size:11px;color:var(--secondary-text-color);margin-bottom:2px">阶梯</div>' +
        '<div class="sd2" style="margin-bottom:4px">' +
        '<div class="sc"><div class="sv" style="color:' + CC.wa + '">' + t1.toFixed(1) + '</div><div class="sl">一阶</div></div>' +
        '<div class="sc"><div class="sv" style="color:#f59e0b">' + t2.toFixed(1) + '</div><div class="sl">二阶</div></div>' +
        '<div class="sc"><div class="sv" style="color:#ef4444">' + t3.toFixed(1) + '</div><div class="sl">三阶</div></div>' +
        '<div class="sc"><div class="sv">' + tot.toFixed(1) + '</div><div class="sl">合计</div></div></div>';
    }
    let progHtml = '';
    if (cap>0) {
      let barClr = pct>80?'#ef4444':pct>60?'#f59e0b':CC.wa;
      progHtml = '<div style="font-size:10px;color:var(--secondary-text-color);margin-bottom:2px">一阶累计 ' + used.toFixed(0) + '/' + cap.toFixed(0) + ' m3</div>' +
        '<div class="pr"><div class="pb"><div class="pf" style="width:' + pct + '%;background:' + barClr + '"></div></div><span style="font-size:10px;color:var(--secondary-text-color);min-width:32px;text-align:right">' + rm.toFixed(0) + ' 剩</span></div>';
    }
    return '<div class="sd2" style="margin-bottom:6px">' +
      '<div class="sc"><div class="sv">' + (d.month!=null?d.month.toFixed(1):'--') + '</div><div class="sl">本月 m³</div></div>' +
      '<div class="sc"><div class="sv">' + (eb!=null?''+eb.toFixed(0):'--') + '</div><div class="sl">预估账单</div></div>' +
      '<div class="sc"><div class="sv">' + (avg>0?avg.toFixed(1):'--') + '</div><div class="sl">历史月均</div></div>' +
      '<div class="sc"><div class="sv">' + (d.cost!=null?''+d.cost.toFixed(0):'--') + '</div><div class="sl">累计费用</div></div></div>' +
      tierHtml + progHtml + vsAvg;
  }

  _renderYearSummary(ld, y1, y2) {
    let html = '<div style="padding:12px"><div class="ha" style="justify-content:space-between;margin-bottom:10px"><span style="font-size:13px;font-weight:600;color:var(--primary-text-color)">年度总结 · ' + y1 + '</span><button class="nb" data-action="summary" style="font-size:10px;padding:2px 8px">✕ 关闭</button></div>';

    // Per-type summary
    let types = [{group:'ele', label:'用电', icon:'⚡', unit:'kWh', color:CC.el, budget:this._budgets.ele},
                 {group:'gas', label:'燃气', icon:'🔥', unit:'m³', color:CC.ga, budget:this._budgets.gas},
                 {group:'water', label:'用水', icon:'💧', unit:'m³', color:CC.wa, budget:this._budgets.water}];

    for (let ti=0;ti<types.length;ti++) {
      let t = types[ti];
      let yearTotal = 0; let yearCost = 0; let prevTotal = 0; let monthCount = 0; let maxMonth = null; let maxV = 0;
      let accs = this._accounts.filter(function(a) { return a.group === t.group; });
      for (let ai=0;ai<accs.length;ai++) {
        // Use detail cache for per-month breakdown (source of truth)
        let dk = this._detailCache[accs[ai].id+':'+y1];
        if (dk) {
          for (let mi=0;mi<12;mi++) {
            if (dk[mi] && dk[mi].change > 0) {
              yearTotal += dk[mi].change || 0;
              yearCost += dk[mi].cost || 0;
              monthCount++;
              if (dk[mi].change > maxV) { maxV = dk[mi].change; maxMonth = mi; }
            }
          }
        } else {
          // Fallback: use live data when detail cache not loaded
          let d = ld[accs[ai].id];
          if (d) { yearTotal += d.month || 0; yearCost += d.cost || d.lastCost || 0; monthCount++; }
        }
        let pk = this._detailCache[accs[ai].id+':'+y2];
        if (pk) {
          for (let mi=0;mi<12;mi++) {
            if (pk[mi] && pk[mi].change > 0) { prevTotal += pk[mi].change || 0; }
          }
        }
      }
      if (yearTotal <= 0) continue;

      let avgM = monthCount > 0 ? (yearTotal / monthCount).toFixed(1) : '-';
      let yoy = prevTotal > 0 ? ((yearTotal - prevTotal) / prevTotal * 100).toFixed(1) : 'N/A';
      let yoyClr = parseFloat(yoy) > 0 ? '#ef4444' : (parseFloat(yoy) < 0 ? '#10b981' : 'var(--secondary-text-color)');
      let maxStr = maxMonth != null ? (maxMonth+1)+'月' : '-';
      let budgetStr = t.budget ? '（预算 ' + t.budget + ' ' + t.unit + '）' : '';

      html += '<div class="rs" style="margin-bottom:8px;padding:10px"><div style="font-size:13px;font-weight:600;color:' + t.color + ';margin-bottom:6px">' + t.icon + ' ' + t.label + budgetStr + '</div>' +
        '<div class="sg">' +
        '<div class="sc"><div class="sv">' + yearTotal.toFixed(1) + '</div><div class="sl">年总计 ' + t.unit + '</div></div>' +
        '<div class="sc"><div class="sv">' + avgM + '</div><div class="sl">月均 ' + t.unit + '</div></div>' +
        '<div class="sc"><div class="sv" style="color:' + yoyClr + '">' + (yoy !== 'N/A' ? yoy + '%' : 'N/A') + '</div><div class="sl">vs 去年</div></div>' +
        '<div class="sc"><div class="sv">' + maxStr + '</div><div class="sl">峰值月</div></div>' +
        (yearCost > 0 ? '<div class="sc"><div class="sv">' + yearCost.toFixed(0) + '</div><div class="sl">费用</div></div>' : '') +
        '</div></div>';
    }

    // Overall summary
    let totalCost = 0; let totalUsage = 0;
    for (let ai=0;ai<this._accounts.length;ai++) {
      let d = ld[this._accounts[ai].id];
      if (d) { totalCost += d.cost || d.lastCost || 0; totalUsage += d.month || 0; }
    }
    html += '<div class="rs" style="padding:10px"><div style="font-size:13px;font-weight:600;color:var(--primary-text-color);margin-bottom:6px">📊 综合</div>' +
      '<div class="sg">' +
      '<div class="sc"><div class="sv">' + totalCost.toFixed(0) + '</div><div class="sl">总费用</div></div>' +
      '<div class="sc"><div class="sv">' + this._accounts.length + '</div><div class="sl">账户数</div></div>' +
      '</div></div>';

    html += '</div>';
    return html;
  }

  // ──── Balance / Tier / Distribution Helpers ────
  _getEntityValue(entityId) {
    if (!entityId || !this._hass) return null;
    let state = this._hass.states[entityId];
    return state ? parseFloat(state.state) : null;
  }

  _balanceHTML(acct) {
    if (!acct.entities || !acct.entities.balance) return '';
    let bal = this._getEntityValue(acct.entities.balance);
    if (bal === null || isNaN(bal)) return '';
    return '<span class="bl"><span class="bv">¥' + bal.toFixed(2) + '</span></span>';
  }

  _tierHTML(acct) {
    if (!acct.entities || !acct.entities.tier_cap) return '';
    let t1 = this._getEntityValue(acct.entities.tier1) || 0;
    let t2 = this._getEntityValue(acct.entities.tier2) || 0;
    let t3 = this._getEntityValue(acct.entities.tier3) || 0;
    let cap = this._getEntityValue(acct.entities.tier_cap) || 2160;
    let remain = this._getEntityValue(acct.entities.tier_remain);
    // Calculate tier capacity boundaries
    // tier_cap = first tier capacity; second tier default = cap * 1.5 (can be overridden by config)
    let tier2Cap = acct.entities.tier2_cap ? (this._getEntityValue(acct.entities.tier2_cap) || cap * 1.5) : cap * 1.5;
    let total = t1 + t2 + t3;
    // Determine current tier
    let curTier = 1;
    if (total > cap + tier2Cap) curTier = 3;
    else if (total > cap) curTier = 2;
    let curTierUsage = total;
    let tierNames = ['一阶梯','二阶梯','三阶梯'];
    let tierColors = ['#55c593','#f8c337','#f79335'];
    let tierRanges = ['0-' + cap, cap + '-' + (cap + tier2Cap), cap + tier2Cap + '+'];
    let unit = acct.type === 'electricity' ? '度' : (acct.type === 'gas' ? 'm³' : 'm³');
    let html = '<div class="ti">';
    for (let i=0;i<3;i++) {
      let active = (curTier === i+1) ? ' active' : '';
      html += '<div class="tb tb-' + (i+1) + active + '">' + tierNames[i] + '</div>';
    }
    html += '<div class="tci t' + curTier + '">第' + curTier + '阶梯 ' + curTierUsage.toFixed(0) + unit + '</div>';
    html += '</div><div class="tc2">';
    for (let i=0;i<3;i++) {
      html += '<span>' + tierNames[i] + ': ' + tierRanges[i] + unit + '</span>';
    }
    html += '</div>';
    return html;
  }

  _distBarHTML(acct) {
    if (!acct.entities || !acct.entities.month || acct.type !== 'electricity') return '';
    let peak = this._getEntityValue(acct.entities.peak) || 0;
    let valley = this._getEntityValue(acct.entities.valley) || 0;
    let month = this._getEntityValue(acct.entities.month) || 0;
    let flat = Math.max(0, month - peak - valley);
    if (month <= 0) return '';
    let pPct = (peak/month*100).toFixed(0);
    let fPct = (flat/month*100).toFixed(0);
    let vPct = (valley/month*100).toFixed(0);
    let html = '<div class="dlb"><span>⚡ 分时用电</span><span>' + month.toFixed(1) + 'kWh</span></div>';
    html += '<div class="db">';
    if (peak > 0) html += '<div class="ds ds-pk" style="flex:' + pPct + '">峰' + peak.toFixed(0) + '</div>';
    if (flat > 0) html += '<div class="ds ds-fl" style="flex:' + fPct + '">平' + flat.toFixed(0) + '</div>';
    if (valley > 0) html += '<div class="ds ds-vl" style="flex:' + vPct + '">谷' + valley.toFixed(0) + '</div>';
    html += '</div>';
    return html;
  }

  _bottomCards(d1, d2, mode, unit) {
    let maxM = new Date().getMonth();
    let y1t = 0; let y2t = 0; let y1c = 0; let y2c = 0;
    let keys = Object.keys(d1);
    for (let i=0;i<keys.length;i++) {
      if (Number(keys[i]) <= maxM) { y1t += Math.max(0, d1[keys[i]].change||0); }
      y1c += d1[keys[i]].cost||0;
    }
    keys = Object.keys(d2);
    for (let i=0;i<keys.length;i++) {
      if (Number(keys[i]) <= maxM) { y2t += Math.max(0, d2[keys[i]].change||0); }
      y2c += d2[keys[i]].cost||0;
    }
    let vv = mode==='usage' ? y1t.toFixed(1) : '' + y1c.toFixed(0);
    let vv2 = mode==='usage' ? y2t.toFixed(1) : '' + y2c.toFixed(0);
    let diff = mode==='usage' ? y1t - y2t : y1c - y2c;
    let diffStr = diff>0 ? '+' : (diff<0 ? '' : '=');
    let diffClr = diff>0?'#ef4444':diff<0?'#10b981':'var(--secondary-text-color)';
    return '<div class="sd2" style="margin-top:4px"><div class="sc"><div class="sv">' + vv + '</div><div class="sl">本年</div><div style="font-size:9px;margin-top:1px;color:' + diffClr + '">' + diffStr + Math.abs(diff).toFixed(mode==='usage'?1:0) + (mode==='usage'?unit:'') + '</div></div><div class="sc"><div class="sv">' + vv2 + '</div><div class="sl">去年</div></div></div>';
  }

  // ──── Chart ────
  _chartSVG(id, d1, d2, mode, ct, name) {
    let months = 12;
    let u = '';
    for (let ai=0;ai<this._accounts.length;ai++) { if (this._accounts[ai].id === id) { u = this._accounts[ai].unit; break; } }
    let isEle = (id.indexOf('ele:') === 0);
    let p = 0.5;
    let v1 = []; let v2 = [];
    for (let m=0;m<months;m++) {
      let a = d1[m] ? d1[m].change : 0;
      let b = d2[m] ? d2[m].change : 0;
      if (mode === 'cost') {
        a = d1[m] ? (d1[m].cost || a * p) : 0;
        b = d2[m] ? (d2[m].cost || b * p) : 0;
      }
      v1.push(Math.max(0, a));
      v2.push(Math.max(0, b));
    }
    let mv = Math.max.apply(null, v1.concat(v2).concat([1]));
    let W = 280; let H = 130; let PT = 14; let PB = 20; let PL = 28; let PR = 8;
    let CH = H - PT - PB; let CW = W - PL - PR;
    let SX = CW / (months > 1 ? months - 1 : 1);
    let BW = months > 1 ? CW / months * 0.22 : 8;
    function py(v) { return PT + CH - (v/mv) * CH * 0.85; }

    if (ct === 'cum') {
      let c1 = _cum(v1, months); let c2 = _cum(v2, months);
      let mc = Math.max.apply(null, c1.concat(c2).concat([1]));
      let fv = _fc(c1, months);
      let now = new Date().getMonth();
      let grid = ''; let labels = ''; let hl = ''; let tip = '';
      let stp = _niceStep(mc);
      for (let i=0;i<4;i++) {
        let y = PT + (CH/3)*i;
        let val = stp * (3-i);
        grid += '<line x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W-PR) + '" y2="' + y.toFixed(1) + '" stroke="var(--divider-color)" stroke-width="0.5"/>' +
          '<text x="' + (PL-4) + '" y="' + (y.toFixed(1)+3) + '" text-anchor="end" fill="var(--secondary-text-color)" font-size="8">' + _pp(val) + '</text>';
      }
      for (let i=0;i<months;i+=2) {
        labels += '<text x="' + (PL+i*SX).toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" fill="var(--secondary-text-color)" font-size="9">' + (i+1) + '</text>';
      }
      let hm = this._hoverMonth;
      if (hm != null) {
        hl = '<rect x="' + Math.max(PL, PL+hm.month*SX-SX*0.45).toFixed(1) + '" y="' + PT + '" width="' + (SX*0.9).toFixed(1) + '" height="' + CH.toFixed(1) + '" class="crh" rx="4"/>';
      }
      let lines1 = ''; let dots1 = '';
      for (let i=0;i<months;i++) {
        let x = PL + i*SX;
        let y = Math.max(PT, Math.min(H-PB, PT+CH-(c1[i]/mc)*CH*0.85));
        lines1 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        dots1 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2" fill="' + CC.y1 + '" cursor="pointer" data-action="month" data-year="' + this._hoverYear + '" data-month="' + i + '"/>';
      }
      let line2 = ''; let dots2 = '';
      for (let i=0;i<months;i++) {
        let x = PL + i*SX;
        let y = Math.max(PT, Math.min(H-PB, PT+CH-(c2[i]/mc)*CH*0.85));
        line2 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        dots2 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2" fill="' + CC.y2 + '" cursor="pointer" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '"/>';
      }
      let fl = '';
      if (fv > 0 && now < months-1) {
        let fx1 = PL + now*SX;
        let fy1 = Math.max(PT, Math.min(H-PB, PT+CH-(c1[now]/mc)*CH*0.85));
        let fx2 = PL + (months-1)*SX;
        let fy2 = Math.max(PT, Math.min(H-PB, PT+CH-(fv/mc)*CH*0.85));
        fl = '<path d="M' + fx1.toFixed(1) + ',' + fy1.toFixed(1) + 'L' + fx2.toFixed(1) + ',' + fy2.toFixed(1) + '" fill="none" stroke="' + CC.gp + '" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>' +
          '<text x="' + (fx2-4).toFixed(1) + '" y="' + (fy2-4).toFixed(1) + '" text-anchor="end" fill="' + CC.gp + '" font-size="8" opacity="0.7">~' + _pp(fv) + '</text>';
      }
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%;display:block;pointer-events:auto;cursor:crosshair"><style>.crh{fill:var(--primary-color);opacity:0.08;pointer-events:none}</style>' + grid + hl + '<path d="' + lines1 + '" fill="none" stroke="' + CC.y1 + '" stroke-width="2" opacity="0.85"/>' + dots1 + '<path d="' + line2 + '" fill="none" stroke="' + CC.y2 + '" stroke-width="2" opacity="0.85"/>' + dots2 + labels + fl + tip + '</svg>';
    }

    let pvBars = ''; let pvLeg = '';
    if (ct === 'bar' && mode === 'usage' && isEle) {
      for (let i=0;i<months;i++) {
        let dd = d1[i]; if (!dd || !dd.p_ele) continue;
        let tt = dd.p_ele + dd.v_ele + (dd.n_ele||0); if (tt<=0) continue;
        let hh = (tt/mv)*CH*0.85; let hp = (dd.p_ele/tt)*hh; let hv = (dd.v_ele/tt)*hh; let hn = ((dd.n_ele||0)/tt)*hh;
        let cx = PL + i*SX; let yb = H-PB; let cy = yb;
        if (hv>1){cy-=hv;pvBars+='<rect x="'+(cx-BW).toFixed(1)+'" y="'+cy.toFixed(1)+'" width="'+(BW*2).toFixed(1)+'" height="'+hv.toFixed(1)+'" fill="'+CC.vl+'" opacity="0.35" rx="1"/>';}
        if (hn>1){cy-=hn;pvBars+='<rect x="'+(cx-BW).toFixed(1)+'" y="'+cy.toFixed(1)+'" width="'+(BW*2).toFixed(1)+'" height="'+hn.toFixed(1)+'" fill="'+CC.fl+'" opacity="0.35" rx="1"/>';}
        if (hp>1){cy-=hp;pvBars+='<rect x="'+(cx-BW).toFixed(1)+'" y="'+cy.toFixed(1)+'" width="'+(BW*2).toFixed(1)+'" height="'+hp.toFixed(1)+'" fill="'+CC.pk+'" opacity="0.35" rx="1"/>';}
      }
      if (pvBars) { pvLeg = '<div class="cl" style="font-size:10px;gap:12px;margin-top:2px"><span>峰</span><span>平</span><span>谷</span></div>'; }
    }

    let svg = ''; let hm = this._hoverMonth;
    if (ct === 'bar') {
      let bars = ''; let labels = ''; let grid = ''; let hl = ''; let tip = ''; let dbtns = '';
      for (let i=0;i<months;i++) {
        let cx = PL + i*SX;
        let h1 = v1[i]>0 ? (v1[i]/mv)*CH*0.85 : 0;
        let h2 = v2[i]>0 ? (v2[i]/mv)*CH*0.85 : 0;
        let yb = H-PB;
        if (h1>0 && !pvBars) {
          bars += '<rect x="' + (cx-BW).toFixed(1) + '" y="' + (yb-h1).toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + h1.toFixed(1) + '" fill="' + CC.y1 + '" rx="2" cursor="pointer" data-action="month" data-year="' + this._hoverYear + '" data-month="' + i + '" opacity="0.85"/>' +
            '<rect x="' + (cx-BW).toFixed(1) + '" y="' + PT.toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + (CH*0.85).toFixed(1) + '" fill="transparent" data-action="drill" data-month="' + i + '" cursor="pointer"/>';
        }
        if (h2>0) {
          bars += '<rect x="' + cx.toFixed(1) + '" y="' + (yb-h2).toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + h2.toFixed(1) + '" fill="' + CC.y2 + '" rx="2" cursor="pointer" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '" opacity="0.85"/>' +
            '<rect x="' + cx.toFixed(1) + '" y="' + PT.toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + (CH*0.85).toFixed(1) + '" fill="transparent" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '" cursor="pointer"/>';
        }
        if (i%2===0) { labels += '<text x="' + cx.toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" fill="var(--secondary-text-color)" font-size="9">' + (i+1) + '</text>'; }
      }
      let stp = _niceStep(mv);
      for (let i=0;i<4;i++) {
        let y = PT + (CH/3)*i;
        let val = stp * (3-i);
        grid += '<line x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W-PR) + '" y2="' + y.toFixed(1) + '" stroke="var(--divider-color)" stroke-width="0.5"/>' +
          '<text x="' + (PL-4) + '" y="' + (y.toFixed(1)+3) + '" text-anchor="end" fill="var(--secondary-text-color)" font-size="8">' + _pp(val) + '</text>';
      }
      if (hm != null) {
        hl = '<rect x="' + Math.max(PL, PL+hm.month*SX-SX*0.45).toFixed(1) + '" y="' + PT + '" width="' + (SX*0.9).toFixed(1) + '" height="' + CH.toFixed(1) + '" class="crh" rx="4"/>';
      }
      tip = hm != null ? _tip(hm.month, d1, d2, u, PL, SX, H, W, this._hoverPos, mode, this._accounts.find(function(a){return a.id===id;})) : '';
      svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%;display:block"><style>.crh{fill:var(--primary-color);opacity:0.08;pointer-events:none}</style>' + grid + hl + pvBars + bars + labels + dbtns + tip + '</svg>' + pvLeg;
    } else {
      let lines1 = ''; let dots1 = '';
      for (let i=0;i<months;i++) {
        let x = PL + i*SX;
        let y = Math.max(PT, Math.min(H-PB, py(v1[i])));
        lines1 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        if (v1[i] > 0) {
          dots1 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="' + CC.y1 + '" cursor="pointer" data-action="month" data-year="' + this._hoverYear + '" data-month="' + i + '"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" fill="transparent" cursor="pointer"/>';
        }
      }
      let line2 = ''; let dots2 = '';
      for (let i=0;i<months;i++) {
        let x = PL + i*SX;
        let y = Math.max(PT, Math.min(H-PB, py(v2[i])));
        line2 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        if (v2[i] > 0) {
          dots2 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="' + CC.y2 + '" cursor="pointer" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" fill="transparent" cursor="pointer"/>';
        }
      }
      let grid = ''; let labels = ''; let hl = ''; let tip = '';
      let stp = _niceStep(mv);
      for (let i=0;i<4;i++) {
        let y = PT + (CH/3)*i;
        let val = stp * (3-i);
        grid += '<line x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W-PR) + '" y2="' + y.toFixed(1) + '" stroke="var(--divider-color)" stroke-width="0.5"/>' +
          '<text x="' + (PL-4) + '" y="' + (y.toFixed(1)+3) + '" text-anchor="end" fill="var(--secondary-text-color)" font-size="8">' + _pp(val) + '</text>';
      }
      for (let i=0;i<months;i+=2) {
        labels += '<text x="' + (PL+i*SX).toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" fill="var(--secondary-text-color)" font-size="9">' + (i+1) + '</text>';
      }
      if (hm != null) {
        hl = '<rect x="' + Math.max(PL, PL+hm.month*SX-SX*0.45).toFixed(1) + '" y="' + PT + '" width="' + (SX*0.9).toFixed(1) + '" height="' + CH.toFixed(1) + '" class="crh" rx="4"/>';
      }
      tip = hm != null ? _tip(hm.month, d1, d2, u, PL, SX, H, W, this._hoverPos, mode, this._accounts.find(function(a){return a.id===id;})) : '';
      let area1 = lines1 + ' L' + (PL+(months-1)*SX).toFixed(1) + ',' + (H-PB) + ' L' + PL + ',' + (H-PB) + ' Z';
      svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%;display:block;pointer-events:auto"><style>.crh{fill:var(--primary-color);opacity:0.08;pointer-events:none}</style>' + grid + hl +
        '<path d="' + lines1 + '" fill="none" stroke="' + CC.y1 + '" stroke-width="1.5" opacity="0.85"/>' +
        '<path d="' + area1 + '" fill="' + CC.y1 + '" opacity="0.06"/>' + dots1 +
        '<path d="' + line2 + '" fill="none" stroke="' + CC.y2 + '" stroke-width="1.5" opacity="0.85"/>' +
        '<path d="' + line2 + ' L' + (PL+(months-1)*SX).toFixed(1) + ',' + (H-PB) + ' L' + PL + ',' + (H-PB) + ' Z" fill="' + CC.y2 + '" opacity="0.06"/>' + dots2 +
        labels + tip + '</svg>';
    }
    return svg;
  }

  _dailyCalendar(consNo) {
    if (!consNo) return '';
    let allDays = this._dailyCache[consNo];
    if (!allDays || allDays.length === 0) return '';

    // Filter to selected calendar month
    const now = new Date();
    const cy = now.getFullYear();
    const cm = this._calMonth;
    const prefix = String(cy) + (cm+1).toString().padStart(2,'0');
    let days = allDays.filter(function(x) { return x.day && x.day.indexOf(prefix) === 0; });
    if (days.length === 0) return '';

    // Build day map
    let dayMap = {};
    for (let i=0;i<days.length;i++) { let d = parseInt(days[i].day.substring(6,8),10); dayMap[d] = days[i]; }

    // Calendar grid
    const firstDay = new Date(cy, cm, 1).getDay(); // 0=Sun
    const lastDate = new Date(cy, cm+1, 0).getDate();
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const maxV = Math.max.apply(null, days.map(function(d){return d.ele||0;}).concat([1]));

    let cells = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:10px">';
    // Weekday headers
    const wd = ['日','一','二','三','四','五','六'];
    for (let wi=0;wi<7;wi++) { cells += '<div style="padding:3px 0;color:var(--secondary-text-color);font-weight:500">' + wd[wi] + '</div>'; }
    // Empty cells before first day
    for (let ei=0;ei<firstDay;ei++) { cells += '<div></div>'; }
    // Day cells
    for (let d=1;d<=lastDate;d++) {
      const dd = dayMap[d];
      const val = dd ? (dd.ele||0) : 0;
      const pct = maxV > 0 ? (val/maxV) : 0;
      const opacity = val > 0 ? (0.25 + pct * 0.65) : 0.08;
      const isToday = (d === now.getDate() && cm === now.getMonth());
      const border = isToday ? '2px solid var(--primary-color)' : '1px solid var(--divider-color)';
      cells += '<div style="position:relative;padding:4px 2px;border-radius:6px;background:var(--primary-color);opacity:' + opacity + ';border:' + border + ';cursor:pointer" data-action="month" data-year="' + cy + '" data-month="' + cm + '" data-day="' + d + '">' +
        '<div style="font-size:9px;font-weight:600;color:' + (opacity>0.5?'#fff':'var(--primary-text-color)') + '">' + d + '</div>' +
        (val > 0 ? '<div style="font-size:7px;color:' + (opacity>0.5?'rgba(255,255,255,0.8)':'var(--secondary-text-color)') + '">' + val.toFixed(1) + '</div>' : '') +
        '</div>';
    }
    cells += '</div>';

    return '<div style="margin-top:8px;border-top:1px solid var(--divider-color);padding-top:8px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<span style="font-size:11px;font-weight:600;color:var(--primary-text-color)">📅 ' + monthNames[cm] + ' 日用电</span>' +
      '<div class="ha"><button class="nb" data-action="calPrev" style="font-size:10px;padding:1px 6px;min-height:24px"><</button>' +
      '<span style="font-size:11px;min-width:32px;text-align:center">' + monthNames[cm] + '</span>' +
      '<button class="nb" data-action="calNext" style="font-size:10px;padding:1px 6px;min-height:24px">></button></div></div>' +
      cells + '</div>';
  }

  // ──── Export Methods ────
  _exportPNG() {
    let svg = this._el.rc.querySelector('svg');
    if (!svg) return;
    let s = new XMLSerializer().serializeToString(svg);
    let c = document.createElement('canvas');
    c.width = 560; c.height = 260;
    let ctx = c.getContext('2d');
    let i = new Image();
    i.onload = function() {
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(i, 0, 0, c.width, c.height);
      let a = document.createElement('a');
      a.download = 'energy-chart.png';
      a.href = c.toDataURL('image/png');
      a.click();
    };
    i.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
  }

  _exportCSV() {
    // Collect all detail data and export as CSV
    let rows = [['月份', '用量', '费用', '年份', '来源']];
    for (let key in this._detailCache) {
      let parts = key.split(':');
      let acctId = parts[0] + ':' + parts[1];
      let year = parts[2];
      let d = this._detailCache[key];
      if (!d) continue;
      let acctName = acctId;
      for (let ai=0;ai<this._accounts.length;ai++) {
        if (this._accounts[ai].id === acctId) { acctName = this._accounts[ai].name; break; }
      }
      for (let mo in d) {
        rows.push([(parseInt(mo)+1)+'月', (d[mo].change||0).toFixed(1), (d[mo].cost||0).toFixed(2), year, acctName]);
      }
    }
    let csv = rows.map(function(r) { return r.join(','); }).join('\n');
    let a = document.createElement('a');
    a.download = 'energy-data.csv';
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    a.click();
  }

  _exportJSON() {
    let data = { accounts: [], detail: {} };
    for (let ai=0;ai<this._accounts.length;ai++) {
      let acct = this._accounts[ai];
      let d = this._liveData[acct.id];
      data.accounts.push({ id:acct.id, name:acct.name, type:acct.type, liveData:d });
    }
    for (let key in this._detailCache) {
      data.detail[key] = this._detailCache[key];
    }
    let json = JSON.stringify(data, null, 2);
    let a = document.createElement('a');
    a.download = 'energy-data.json';
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    a.click();
  }

  getCardSize() { return 7; }
}

customElements.define('c3h3-energy-hub-card', C3h3EnergyHubCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'c3h3-energy-hub-card', name: 'C3H3 Energy Hub', description: 'Configurable energy hub with multi-account, drill-down, export, fullscreen' });