/**
 * c3h3-energy-hub-card v1.0 — C3H3 Energy Hub Card
 * Multi-source energy hub: Electricity / Gas / Water
 * Charts, budgets, alerts, filter, export, i18n, responsive
 */

const _niceStep = (mv) => { if (mv<5) return 1; if (mv<20) return 5; if (mv<50) return 10; if (mv<100) return 20; if (mv<200) return 50; if (mv<500) return 100; if (mv<1000) return 200; if (mv<5000) return 500; return Math.round(mv/20/100)*100; };
const CC = { el:'#1565C0', ga:'#E65100', wa:'#00838F', y1:'#1565C0', y2:'#64B5F6', pk:'#D32F2F', fl:'#F57F17', vl:'#2E7D32', gp:'#1B5E20', el2:'#42A5F5' };

// i18n
var I18N={'zh-CN':{year:'本年',month:'本月',ele:'用电',gas:'燃气',water:'用水',total:'总账单',thisYr:'本年',lastYr:'去年',details:'点击查看详情',balance:'余额',lastMo:'上月',yrFee:'年费',cum:'累计',bill:'本期',loading:'加载中...',moKwh:'本月kWh',moM3:'本月m3',yrM3:'年m3',moFee:'本月费',peak:'峰',flat:'平',valley:'谷',estBill:'预估账单',avgMo:'历史月均',cumCost:'累计费用',tier1:'一阶',tier2:'二阶',tier3:'三阶',sum:'合计',t1Usage:'一阶累计',left:'剩',daily:'近30日日用电',yest:'昨日',ele2:'电',gas2:'气',water2:'水',export:'导出',alert1:'!',alert2:'!!',vsAvg:'vs月均',cost:'费用',yrCost:'年费'},'en':{year:'Year',month:'Month',ele:'Elec',gas:'Gas',water:'Water',total:'Total',thisYr:'This Yr',lastYr:'Last Yr',details:'Details',balance:'Bal',lastMo:'Last',yrFee:'Yr',cum:'Cum',bill:'Bill',loading:'Loading...',moKwh:'/mo kWh',moM3:'/mo m3',yrM3:'/yr m3',moFee:'Cost',peak:'Peak',flat:'Flat',valley:'Valley',estBill:'Est Bill',avgMo:'Avg/mo',cumCost:'Total',tier1:'T1',tier2:'T2',tier3:'T3',sum:'Sum',t1Usage:'T1 used',left:'left',daily:'30d daily',yest:'Yest',ele2:'E',gas2:'G',water2:'W',export:'Export',alert1:'!!',alert2:'!!!',vsAvg:'vs avg',cost:'Cost',yrCost:'Yr Cost'}};
function _T(h,k){var l='zh-CN';if(h&&h.language)l=h.language;else if(document&&document.documentElement&&document.documentElement.lang)l=document.documentElement.lang;if(!I18N[l])l=l.indexOf('zh')>=0?'zh-CN':'en';return I18N[l][k]||k;}
// localStorage cache
function _cK(p,id,y){return'eh4_'+p+'_'+id.replace(/[^a-z0-9]/g,'_')+'_'+y;}
function _cG(k){try{var d=JSON.parse(localStorage.getItem(k));if(d&&d.ts>Date.now()-1800000)return d.data;}catch(e){}return null;}
function _cS(k,d){try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}));}catch(e){}}

const DA = [
  {id:'ele:total', icon:'⚡', name:'用电合计', unit:'kWh', color:CC.el, group:'ele'},
  {id:'ele:3305820502430', icon:'⚡', name:'202室', unit:'kWh', color:CC.el, group:'ele'},
  {id:'ele:3309947582705', icon:'🔌', name:'充电桩', unit:'kWh', color:CC.el, group:'ele'},
  {id:'gas', icon:'🔥', name:'燃气', unit:'m3', color:CC.ga, group:'gas'},
  {id:'water', icon:'💧', name:'用水', unit:'m3', color:CC.wa, group:'water'},
];

function _ring(vals, colors) {
  const t=vals.reduce((s,v)=>s+v,0); if (t<=0) return '<svg></svg>';
  const pi=Math.PI, cx=36, cy=36, r=32; let start=-pi/2, sv='';
  for (let i=0;i<vals.length;i++) { if (vals[i]<=0) continue; const ang=(vals[i]/t)*pi*2, end=start+ang; sv+=`<path d="M${cx} ${cy} L${(cx+r*Math.cos(start)).toFixed(1)} ${(cy+r*Math.sin(start)).toFixed(1)} A${r} ${r} 0 ${ang>pi?1:0} 1 ${(cx+r*Math.cos(end)).toFixed(1)} ${(cy+r*Math.sin(end)).toFixed(1)} Z" fill="${colors[i]}" opacity="0.85"/>`; start=end; }
  const ir=r*0.58;
  return `<svg width="72" height="72" viewBox="0 0 72 72">${sv}<circle cx="${cx}" cy="${cy}" r="${ir}" fill="var(--card-background-color,#fff)"/><text x="${cx}" y="${cy+1}" text-anchor="middle" fill="var(--primary-text-color)" font-size="12" font-weight="700">${t.toFixed(0)}</text><text x="${cx}" y="${cy+11}" text-anchor="middle" fill="var(--secondary-text-color)" font-size="7">kWh</text></svg>`;
}
function _tip(m,d1,d2,u,PL,SX,H,W,pos) { const s1=d1[m],s2=d2[m]; if (!s1&&!s2) return ''; const g1=s1?Math.max(0,s1.change).toFixed(1):'0.0', g2=s2?Math.max(0,s2.change).toFixed(1):'0.0'; const TW=96,TH=30; let tx=pos?Math.max(2,Math.min(W-TW-2,pos.x-TW/2)):2, ty=pos?Math.max(2,Math.min(H-TH-2,pos.y-TH-8)):2; if (ty<2) ty=pos?Math.min(H-TH-2,pos.y+10):2; return `<g style="pointer-events:none;opacity:0.92"><rect x="${tx}" y="${ty}" width="${TW}" height="${TH}" rx="6" fill="var(--card-background-color)" stroke="var(--divider-color)" stroke-width="0.5" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.12))"/><text x="${tx+6}" y="${ty+13}" fill="var(--primary-text-color)" font-size="10" font-weight="600">${m+1}月</text><text x="${tx+6}" y="${ty+24}" fill="${CC.y1}" font-size="9">@ ${g1}${u}</text><text x="${tx+52}" y="${ty+24}" fill="${CC.y2}" font-size="9">@ ${g2}${u}</text></g>`; }
function _pct(v,t){return t>0?((v/t)*100).toFixed(0):'0'}
function _yoy(cur,prev){if(!prev||prev<=0)return '';const d=((cur-prev)/prev)*100;return(d>0?'+':'-')+Math.abs(d).toFixed(1)+'%';}
function _cum(arr,m){const r=[];let s=0;for(let i=0;i<m;i++){s+=(arr[i]||0);r.push(s);}return r;}
function _fc(arr,m){const n=new Date().getMonth()+1;if(n>=m||n<=0)return 0;return n<m?Math.round((arr[n-1]||0)/n*m):(arr[m-1]||0);}
function _pp(v){return v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0);}

class C3h3EnergyHubCard extends HTMLElement {
  static getConfigElement() { return null; }
  static getStubConfig() { return { filters:['ele','gas','water'], budgets:{}, alertThreshold:1.3 }; }
  setConfig(config) {
    this._config = config || {};
    this._year = new Date().getFullYear();
    this._hoverYear = this._year;
    this._expanded = null;
    this._hoverMonth = null; this._hoverPos = null;
    this._chartModes = {}; this._chartTypes = {};
    this._detailCache = {}; this._dailyCache = {};
    this._loadingDetails = {}; this._liveData = {};
    this._showYear = false; this._drillMonth = null;
    this._filter = (config.filters || []).length ? config.filters : ['ele','gas','water'];
    this._budgets = config.budgets || {};
    this._alertThreshold = config.alertThreshold || 1.3;

    this.innerHTML = '<style>.eh{font-family:var(--paper-font-body1_-_font-family)}.eh ha-card{border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)}' +
'.eh .b{padding:16px}.eh .ht{font-size:15px;font-weight:600;color:var(--primary-text-color);letter-spacing:-0.2px}' +
'.eh .ha{display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
'.eh .nb{background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;color:var(--primary-text-color);line-height:1.5;transition:all 0.15s;min-height:32px;white-space:nowrap}' +
'.eh .nb:hover{opacity:0.8}.eh .nb.a{background:var(--primary-color);color:#fff;border-color:var(--primary-color)}' +
'.eh .nb.ng{opacity:0.4}.eh .sc{flex:1;min-width:0;background:var(--secondary-background-color);border-radius:10px;padding:6px 3px;text-align:center}' +
'.eh .sv{font-size:14px;font-weight:700;color:var(--primary-text-color);letter-spacing:-0.2px}' +
'.eh .sl{font-size:9px;color:var(--secondary-text-color);margin-top:1px;white-space:nowrap}' +
'.eh .cl{display:flex;justify-content:center;gap:12px;font-size:10px;color:var(--secondary-text-color);flex-wrap:wrap}' +
'.eh .ca{position:relative;width:100%}.eh .sd2{display:flex;gap:6px;flex-wrap:wrap}' +
'.eh .sd2>.sc{min-width:60px;flex:1 0 calc(50% - 6px)}' +
'.eh .enr{display:flex;align-items:center;padding:10px;border-bottom:1px solid var(--divider-color);gap:6px;cursor:pointer;transition:background 0.15s;min-height:40px}' +
'.eh .enr:hover{background:var(--secondary-background-color)}' +
'.eh .ic{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px}' +
'.eh .vl{font-size:13px;font-weight:700;color:var(--primary-text-color);letter-spacing:-0.2px;white-space:nowrap}' +
'.eh .ar{font-size:16px;color:var(--secondary-text-color);transition:transform 0.2s;opacity:0.4;padding:4px}' +
'.eh .dsec{border-bottom:1px solid var(--divider-color)}.eh .dsec:last-child{border-bottom:none}' +
'.eh .yt{font-size:13px;font-weight:500;min-width:28px;text-align:center;color:var(--primary-text-color)}' +
'.eh .tp{display:flex;align-items:center;gap:10px;margin-bottom:10px}' +
'.eh .tl{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px}.eh .tl>.sc{flex:1 0 calc(33% - 4px);min-width:0}' +
'.eh .rs{border-radius:12px;border:1px solid var(--divider-color);overflow:hidden}' +
'.eh .pr{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:11px}.eh .pb{flex:1;height:6px;border-radius:3px;background:var(--divider-color);overflow:hidden}' +
'.eh .pf{height:100%;border-radius:3px;transition:width 0.4s ease}' +
'.eh .fl{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}' +
'@media (min-width:600px){.eh .tl>.sc{flex:1;min-width:0}.eh .sd2>.sc{flex:1;min-width:0}.eh .enr{padding:10px 12px}}' +
'@media (min-width:1024px){.eh .b{padding:20px}}' +
'</style><div class="eh"><ha-card><div class="b">' +
'<div class="ha" style="justify-content:space-between;margin-bottom:8px">' +
'<div class="ha"><button class="nb yr" data-action="year" data-dir="-1" style="font-size:11px;padding:2px 6px">&lt;</button><span class="yt yv" style="margin:0 4px">2026</span><button class="nb yr" data-action="year" data-dir="1" style="font-size:11px;padding:2px 6px">&gt;</button></div>' +
'<div class="ha"><button class="nb ex" data-action="export" style="font-size:10px;padding:2px 8px">img</button><button class="nb tb" data-action="switchMode" style="font-size:11px;padding:2px 12px">month</button></div></div>' +
'<div class="tp"><div class="dw" style="width:72px;height:72px;flex-shrink:0"><svg></svg></div><div class="tl">' +
'<div class="sc"><div class="sv ye">--</div><div class="sl">year</div></div>' +
'<div class="sc"><div class="sv te">--</div><div class="sl">用电 kWh</div></div>' +
'<div class="sc"><div class="sv gv">--</div><div class="sl">燃气 m³</div></div>' +
'<div class="sc"><div class="sv wv">--</div><div class="sl">用水 m³</div></div>' +
'<div class="sc"><div class="sv tc" style="color:#e65100">--</div><div class="sl">总账单</div></div>' +
'</div></div>' +
'<div class="cl dl" style="font-size:10px;gap:14px;margin-bottom:6px"></div>' +
'<div class="fl fb"></div>' +
'<div class="rs"><div class="rc"></div></div>' +
'</div></ha-card></div>';

    const root = this.querySelector('.eh');
    this._el = { root: root, dw: root.querySelector('.dw'), ye: root.querySelector('.ye'), te: root.querySelector('.te'),
      gv: root.querySelector('.gv'), wv: root.querySelector('.wv'), dl: root.querySelector('.dl'),
      rc: root.querySelector('.rc'), tc: root.querySelector('.tc'), tb: root.querySelector('.tb'),
      fb: root.querySelector('.fb'), ex: root.querySelector('.ex'), yv: root.querySelector('.yv') };
    if (this._hass) { this._load(); }
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
      var self = this;
      this.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var a = btn.dataset.action;
        var id = btn.dataset.id;
        if (a === 'toggle') {
          self._expanded = (self._expanded === id) ? null : id;
          self._renderRows();
          if (self._expanded) { self._loadDetail(self._expanded); }
        } else if (a === 'sw') {
          self._chartModes[self._expanded] = btn.dataset.mode;
          self._renderRows();
        } else if (a === 'ct') {
          self._chartTypes[self._expanded] = btn.dataset.ct;
          self._renderRows();
        } else if (a === 'cy') {
          self._hoverYear += Number(btn.dataset.dir);
          self._detailCache = {};
          self._el.yv.textContent = String(self._hoverYear);
          var p = self._loadDetail(self._expanded);
          if (p && p.then) { p.then(function() { self._renderRows(); }); } else { self._renderRows(); }
        } else if (a === 'year') {
          self._hoverYear += Number(btn.dataset.dir);
          self._detailCache = {};
          self._el.yv.textContent = String(self._hoverYear);
          self._expanded = null;
          self._renderRows();
        } else if (a === 'switchMode') {
          self._showYear = !self._showYear;
          self._updateHeader();
        } else if (a === 'filter') {
          var g = btn.dataset.group;
          if (self._filter.indexOf(g) >= 0) { self._filter = self._filter.filter(function(f) { return f !== g; }); }
          else { self._filter.push(g); }
          self._renderFilterBtns();
          self._renderRows();
        } else if (a === 'export') {
          var svg = self._el.rc.querySelector('svg');
          if (svg) {
            var s = new XMLSerializer().serializeToString(svg);
            var c = document.createElement('canvas');
            c.width = 560; c.height = 260;
            var ctx = c.getContext('2d');
            var i = new Image();
            i.onload = function() {
              ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
              ctx.drawImage(i, 0, 0, c.width, c.height);
              var a = document.createElement('a');
              a.download = 'energy-chart.png';
              a.href = c.toDataURL('image/png');
              a.click();
            };
            i.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
          }
        } else if (a === 'drill') {
          self._drillMonth = Number(btn.dataset.month);
          self._renderRows();
        } else if (a === 'drillClose') {
          self._drillMonth = null;
          self._renderRows();
        }
      });
      this.addEventListener('mouseover', function(e) {
        var btn = e.target.closest('[data-action="month"]');
        if (!btn) return;
        var m = Number(btn.dataset.month);
        if (!self._hoverMonth || self._hoverMonth.month !== m) {
          self._hoverMonth = { year: Number(btn.dataset.year), month: m };
          if (self._ht) clearTimeout(self._ht);
          self._ht = setTimeout(function() { self._ht=null; self._renderRows(); }, 200);
        }
      });
      this.addEventListener('mouseout', function(e) {
        if (!e.target.closest('[data-action="month"]')) return;
        self._hoverMonth = null;
        if (self._ht) clearTimeout(self._ht);
        self._ht = setTimeout(function() { self._ht=null; self._renderRows(); }, 200);
      });
      this.addEventListener('mousemove', function(e) {
        var s = e.target.closest('svg');
        if (!s) return;
        var r = s.getBoundingClientRect();
        self._hoverPos = { x: e.clientX - r.left, y: e.clientY - r.top };
      });
    }
  }

  _load() {
    if (!this._hass) return;
    this._loaded = true;
    if (this._el.yv) { this._el.yv.textContent = String(this._hoverYear); }
    var st = this._hass.states;
    var _v = function(id, d) { if (d === undefined) d = 0; return st[id] ? Number(st[id].state) || d : null; };
    this._liveData = {};
    this._liveData['ele:3305820502430'] = { month:_v('sensor.state_grid_3305820502430_month_ele_num'), year:_v('sensor.state_grid_3305820502430_year_ele_num'), cost:_v('sensor.state_grid_3305820502430_year_ele_cost'), balance:_v('sensor.state_grid_3305820502430_balance'), p:_v('sensor.state_grid_3305820502430_month_p_ele_num'), v:_v('sensor.state_grid_3305820502430_month_v_ele_num'), lastCost:_v('sensor.state_grid_3305820502430_last_month_ele_cost'), lastMonth:_v('sensor.state_grid_3305820502430_last_month_ele_num') };
    this._liveData['ele:3309947582705'] = { month:_v('sensor.state_grid_3309947582705_month_ele_num'), year:_v('sensor.state_grid_3309947582705_year_ele_num'), yearCost:_v('sensor.state_grid_3309947582705_year_ele_cost'), balance:_v('sensor.state_grid_3309947582705_balance') };
    // Compute ele:总账单 as sum of both
    var d202 = this._liveData['ele:3305820502430'];
    var dChg = this._liveData['ele:3309947582705'];
    this._liveData['ele:total'] = {
      month: (d202?d202.month:0||0) + (dChg?dChg.month:0||0),
      year: (d202?d202.year:0||0) + (dChg?dChg.year:0||0),
      cost: (d202?d202.cost:0||0) + (dChg?dChg.yearCost:0||0),
      balance: (d202?d202.balance:0||0) + (dChg?dChg.balance:0||0),
      p: (d202?d202.p:0||0) + (dChg?dChg.p:0||0),
      v: (d202?d202.v:0||0) + (dChg?dChg.v:0||0),
      lastCost: (d202?d202.lastCost:0||0) + (dChg?dChg.lastCost:0||0),
    };
    this._liveData['gas'] = { month:_v('sensor.chu_fang_hua_run_ran_qi_ben_yue_lei_ji_yong_qi_liang'), year:_v('sensor.hua_run_ran_qi_yi_jie_ti_lei_ji_yi_yong'), cost:_v('sensor.hua_run_ran_qi_lei_ji_ran_qi_fei_yong'), balance:_v('sensor.chu_fang_hua_run_ran_qi_ran_qi_zhang_hu_yu_e'), bill:_v('sensor.chu_fang_hua_run_ran_qi_zhang_dan_jin_e') };
    this._liveData['water'] = { month:_v('sensor.wen_zhou_shui_wu_ni_zhou_5'), bill:_v('sensor.wen_zhou_shui_wu_ni_zhou_6'), cost:_v('sensor.shi_wai_wen_zhou_shui_wu_ni_zhou_lei_ji_shui_fei'), y1:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yong_shui_liang'), y2:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_er_jie_yong_shui_liang'), y3:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_san_jie_yong_shui_liang'), avg:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_li_shi_yue_jun_yong_shui'), estBill:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yu_gu_ben_yue_zhang_dan'), tierRemain:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_jie_ti_sheng_yu_liang'), yearT1:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yi_yong_liang'), tierCap:_v('sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_shang_xian') };
    this._renderFilterBtns();
    this._updateHeader();
    this._renderRows();
  }

  _loadDetail(id) {
    if (!id) return;
    if (id === 'water') { this._renderRows(); return; }
    var self = this;
    var year = this._hoverYear;
    var ck = id + ':' + year;
    var ck2 = id + ':' + (year-1);
    // Check cache first
    if (this._detailCache[ck] && this._detailCache[ck2]) { this._renderRows(); return; }
    var cached1 = _cG(_cK('dc',id,year));
    var cached2 = _cG(_cK('dc',id,year-1));
    if (cached1 && cached2) {
      this._detailCache[ck] = cached1;
      this._detailCache[ck2] = cached2;
      this._renderRows();
      return;
    }
    this._loadingDetails[id] = true;
    this._renderRows();
    if (id === 'ele:total') {
      // Load both accounts and combine
      var c1 = '3305820502430';
      var c2 = '3309947582705';
      var s1 = ['sg_inject:' + c1 + '_monthly_ele', 'sg_inject:' + c1 + '_monthly_cost'];
      var s2 = ['sg_inject:' + c2 + '_monthly_ele', 'sg_inject:' + c2 + '_monthly_cost'];
      var self2 = self;
      Promise.all([
        self._hass.callWS({type:'recorder/statistics_during_period', start_time:new Date(year,0,1).toISOString(), end_time:new Date(year+1,0,1).toISOString(), statistic_ids:s1, period:'month'}),
        self._hass.callWS({type:'recorder/statistics_during_period', start_time:new Date(year-1,0,1).toISOString(), end_time:new Date(year,0,1).toISOString(), statistic_ids:s1, period:'month'}),
        self._hass.callWS({type:'recorder/statistics_during_period', start_time:new Date(year,0,1).toISOString(), end_time:new Date(year+1,0,1).toISOString(), statistic_ids:s2, period:'month'}),
        self._hass.callWS({type:'recorder/statistics_during_period', start_time:new Date(year-1,0,1).toISOString(), end_time:new Date(year,0,1).toISOString(), statistic_ids:s2, period:'month'})
      ]).then(function(results) {
        var ky1 = id + ':' + year;
        var ky2 = id + ':' + (year-1);
        var by1 = {}; var by2 = {};
        // Combine results[0] (year, acct1) + results[2] (year, acct2)
        var yearResults = [results[0], results[2]];
        for (var ri=0; ri<yearResults.length; ri++) {
          var r = yearResults[ri];
          var stats = r ? (r[s1[0]] || r[s2[0]] || []) : [];
          var costs = r ? (r[s1[1]] || r[s2[1]] || []) : [];
          var cb = {}; for (var si=0;si<costs.length;si++) { cb[new Date(costs[si].start).getMonth()] = costs[si].change || 0; }
          for (var si=0;si<stats.length;si++) {
            var mo = new Date(stats[si].start).getMonth();
            if (!by1[mo]) by1[mo] = {change:0, sum:0, cost:0};
            by1[mo].change += stats[si].change || 0;
            by1[mo].sum += stats[si].sum || 0;
            if (cb[mo]) by1[mo].cost += cb[mo];
          }
        }
        // Combine results[1] (year-1, acct1) + results[3] (year-1, acct2)
        var prevResults = [results[1], results[3]];
        for (var ri=0; ri<prevResults.length; ri++) {
          var r = prevResults[ri];
          var stats = r ? (r[s1[0]] || r[s2[0]] || []) : [];
          var costs = r ? (r[s1[1]] || r[s2[1]] || []) : [];
          var cb = {}; for (var si=0;si<costs.length;si++) { cb[new Date(costs[si].start).getMonth()] = costs[si].change || 0; }
          for (var si=0;si<stats.length;si++) {
            var mo = new Date(stats[si].start).getMonth();
            if (!by2[mo]) by2[mo] = {change:0, sum:0, cost:0};
            by2[mo].change += stats[si].change || 0;
            by2[mo].sum += stats[si].sum || 0;
            if (cb[mo]) by2[mo].cost += cb[mo];
          }
        }
        self2._detailCache[ky1] = by1;
        self2._detailCache[ky2] = by2;
        self2._loadingDetails[id] = false;
        self2._renderRows();
      });
      return;
    }
    var statIds = [];
    if (id.indexOf('ele:') === 0) { var c = id.split(':')[1]; statIds = ['sg_inject:' + c + '_monthly_ele', 'sg_inject:' + c + '_monthly_cost']; }
    else if (id === 'gas') { statIds = ['crcgas:monthly_gas_usage', 'crcgas:monthly_bill_amount']; }
    else { this._loadingDetails[id] = false; return; }
    this._hass.callWS({type:'recorder/statistics_during_period', start_time:new Date(year,0,1).toISOString(), end_time:new Date(year+1,0,1).toISOString(), statistic_ids:statIds, period:'month'}).then(function(r1) {
      self._hass.callWS({type:'recorder/statistics_during_period', start_time:new Date(year-1,0,1).toISOString(), end_time:new Date(year,0,1).toISOString(), statistic_ids:statIds, period:'month'}).then(function(r2) {
        var m1 = r1 ? (r1[statIds[0]] || []) : [];
        var m2 = r2 ? (r2[statIds[0]] || []) : [];
        var c1 = r1 ? (r1[statIds[1]] || []) : [];
        var c2 = r2 ? (r2[statIds[1]] || []) : [];
        var cb = {}; for (var si=0;si<c1.length;si++) { cb[new Date(c1[si].start).getMonth()] = c1[si].change || 0; }
        var bm = {}; for (var si=0;si<m1.length;si++) { var mo=new Date(m1[si].start).getMonth(); bm[mo] = {change:m1[si].change||0, sum:m1[si].sum||0, cost:cb[mo]||0}; }
        self._detailCache[id+':'+year] = bm;
        _cS(_cK('dc',id,year),bm);
        var cb2 = {}; for (var si=0;si<c2.length;si++) { cb2[new Date(c2[si].start).getMonth()] = c2[si].change || 0; }
        var bm2 = {}; for (var si=0;si<m2.length;si++) { var mo2=new Date(m2[si].start).getMonth(); bm2[mo2] = {change:m2[si].change||0, sum:m2[si].sum||0, cost:cb2[mo2]||0}; }
        self._detailCache[id+':'+(year-1)] = bm2;
        _cS(_cK('dc',id,year-1),bm2);
        if (id.indexOf('ele:') === 0) {
          var c = id.split(':')[1];
          var ds = self._hass.states['sensor.state_grid_' + c + '_recent_30_daily_ele_list'];
          if (ds && ds.attributes && ds.attributes.graph) { self._dailyCache[c] = ds.attributes.graph; }
          var ms = self._hass.states['sensor.state_grid_' + c + '_recent_12_monthly_ele_list'];
          if (ms && ms.attributes && ms.attributes.graph) {
            for (var mi=0;mi<ms.attributes.graph.length;mi++) {
              var m = ms.attributes.graph[mi];
              var y = parseInt(m.month.substring(0,4), 10);
              var mo = parseInt(m.month.substring(4,6), 10) - 1;
              var k = id + ':' + y;
              if (self._detailCache[k] && self._detailCache[k][mo]) {
                self._detailCache[k][mo].p_ele = m.p_ele || 0;
                self._detailCache[k][mo].v_ele = m.v_ele || 0;
                self._detailCache[k][mo].n_ele = m.n_ele || 0;
                if (m.cost) { self._detailCache[k][mo].cost = m.cost; }
              }
            }
          }
        }
        self._loadingDetails[id] = false;
        self._renderRows();
      });
    });
  }

  _renderFilterBtns() {
    var groups = [{g:'ele',l:'电'},{g:'gas',l:'气'},{g:'water',l:'水'}];
    var self = this;
    this._el.fb.innerHTML = groups.map(function(g) {
      var active = self._filter.indexOf(g.g) >= 0;
      return '<button class="nb' + (active ? ' a' : ' ng') + '" data-action="filter" data-group="' + g.g + '" style="font-size:11px;padding:2px 10px">' + g.l + '</button>';
    }).join('');
  }

  _updateHeader() {
    var ld = this._liveData;
    var isY = this._showYear;
    this._el.ye.textContent = String(this._year);
    this._el.tb.textContent = isY ? '本年' : '本月';
    var d202 = ld['ele:3305820502430'];
    var dChg = ld['ele:3309947582705'];
    var eleV = isY ? ((d202?d202.year:0||0)+(dChg?dChg.year:0||0)).toFixed(0) : ((d202?d202.month:0||0)+(dChg?dChg.month:0||0)).toFixed(0);
    this._el.te.textContent = eleV;
    var gasV = ld.gas ? ld.gas : null;
    this._el.gv.textContent = isY ? (gasV && gasV.year != null ? gasV.year.toFixed(1) : '--') : (gasV && gasV.month != null ? gasV.month.toFixed(1) : '--');
    this._el.wv.textContent = ld.water && ld.water.month != null ? ld.water.month.toFixed(1) : '--';
    var ec = (d202?d202.lastCost:0||0) + (dChg?dChg.lastCost:0||0);
    var gb = ld.gas ? (ld.gas.bill||0) : 0;
    var wb = ld.water ? (ld.water.bill||0) : 0;
    var tot = ec + gb + wb;
    this._el.tc.textContent = tot > 0 ? String(tot.toFixed(0)) : '--';
    var vals = []; var cols = []; var labels = [];
    for (var ai=0;ai<DA.length;ai++) { var a=DA[ai]; if (a.id.indexOf('ele:')===0) { var d=ld[a.id]; if (d&&d.month!=null) { vals.push(isY?(d.year||d.month):d.month); cols.push(a.id.indexOf('5820502430')>=0?CC.el:CC.el2); labels.push(a.name); } } }
    this._el.dw.innerHTML = _ring(vals, cols);
    var dlArr = [];
    if (vals.length>0) {
      var total = vals.reduce(function(a,b){return a+b;}, 0);
      for (var i=0;i<labels.length;i++) {
        dlArr.push('<span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:3px;background:' + cols[i] + '"></span><span style="font-weight:500;color:var(--primary-text-color)">' + labels[i] + '</span><span style="color:var(--secondary-text-color)">' + _pct(vals[i], total) + '%</span></span>');
      }
    }
    if (tot > 0) {
      var cVals = [ec, gb, wb].filter(function(v){return v>0;});
      var cCols = [CC.el, CC.ga, CC.wa].slice(0, cVals.length);
      var cLabels = ['电', '气', '水'].slice(0, cVals.length);
      dlArr.push('<span style="width:1px;height:12px;background:var(--divider-color)"></span>');
      for (var i=0;i<cVals.length;i++) {
        dlArr.push('<span style="display:flex;align-items:center;gap:2px"><span style="width:8px;height:8px;border-radius:50%;background:' + cCols[i] + '"></span>' + cLabels[i] + ' ' + cVals[i].toFixed(0) + '</span>');
      }
    }
    this._el.dl.innerHTML = dlArr.join('');
  }

  _renderRows() {
    var ld = this._liveData;
    var y1 = this._hoverYear;
    var y2 = y1 - 1;
    var accts = DA.filter(function(a) {
      for (var fi=0;fi<this._filter.length;fi++) { if (a.group === this._filter[fi] || a.id === this._filter[fi]) return true; }
      return false;
    }.bind(this));
    var html = '';
    for (var ai=0;ai<accts.length;ai++) {
      var a = accts[ai];
      var d = ld[a.id];
      if (!d || d.month == null) continue;
      var sub = ''; var costDisplay = '';
      var color = a.color || '#3b82f6';
      if (a.id.indexOf('ele:') === 0) {
        var yc = d.cost || d.yearCost || null;
        if (d.balance != null) { sub = '余额 ' + d.balance.toFixed(1); }
        costDisplay = d.lastCost != null ? '上月 ' + d.lastCost.toFixed(0) : (yc != null ? '年费 ' + yc.toFixed(0) : '');
      } else if (a.id === 'gas') {
        if (d.cost != null) { costDisplay = '累计 ' + d.cost.toFixed(0); }
        if (d.balance != null) { sub = '余额 ' + d.balance.toFixed(1); }
      } else if (a.id === 'water') {
        if (d.cost != null) { costDisplay = '累计 ' + d.cost.toFixed(0); }
        if (d.bill != null) { sub = 'bill ' + d.bill.toFixed(0); }
      }
      var isOpen = (this._expanded === a.id);
      var yoyLabel = '';
      var dk1 = this._detailCache[a.id+':'+y1];
      var dk2 = this._detailCache[a.id+':'+y2];
      if (dk1 && dk2) {
        var cur = 0; var prev = 0;
        var keys = Object.keys(dk1);
        for (var ki=0;ki<keys.length;ki++) { cur += Math.max(0, dk1[keys[ki]].change||0); }
        keys = Object.keys(dk2);
        for (var ki=0;ki<keys.length;ki++) { prev += Math.max(0, dk2[keys[ki]].change||0); }
        if (cur > 0 && prev > 0) { yoyLabel = _yoy(cur, prev); }
      }
      // Budget progress & alert
      var budgetVal = null;
      var budgetColor = '';
      var budgetLabel = '';
      var alertMsg = '';
      var budget = this._budgets[a.group];
      if (budget && d.month != null) {
        budgetVal = Math.min(100, (d.month / budget) * 100);
        budgetColor = budgetVal > 100 ? '#ef4444' : (budgetVal > 80 ? '#f59e0b' : '#10b981');
        budgetLabel = (budgetVal > 100 ? '+' : '') + (d.month - budget).toFixed(1);
      }
      // Alert: if current year monthly avg > last year avg * threshold
      if (dk1 && dk2) {
        var curTotal = 0; var prevTotal = 0; var curCount = 0; var prevCount = 0;
        for (var ki=0;ki<12;ki++) {
          if (dk1[ki]) { curTotal += dk1[ki].change||0; curCount++; }
          if (dk2[ki]) { prevTotal += dk2[ki].change||0; prevCount++; }
        }
        var curAvg = curCount > 0 ? curTotal / curCount : 0;
        var prevAvg = prevCount > 0 ? prevTotal / prevCount : 0;
        if (prevAvg > 0 && curAvg > prevAvg * this._alertThreshold) {
          alertMsg = curAvg > prevAvg * 1.5 ? '!!' : '!';
        }
      }
      html += '<div class="enr"' + (isOpen?'':' data-action="toggle" data-id="' + a.id + '"') + '>' +
'<div class="ic" style="background:' + color + '15">' + a.icon + '</div>' +
'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;color:var(--primary-text-color)">' + a.name + (alertMsg ? '<span style="float:right;color:#ef4444;font-size:11px">' + alertMsg + '</span>' : '') + '</div><div style="font-size:10px;color:var(--secondary-text-color)">' + (sub||'点击查看详情') + '</div>' +
(budgetVal != null ? '<div style="margin-top:3px;display:flex;align-items:center;gap:4px"><div style="flex:1;height:4px;border-radius:2px;background:var(--divider-color);overflow:hidden"><div style="height:100%;width:' + budgetVal.toFixed(0) + '%;background:' + budgetColor + ';border-radius:2px"></div></div><span style="font-size:9px;color:' + budgetColor + '">' + budgetLabel + '</span></div>' : '') + '</div>' +
'<div style="text-align:right"><div class="vl">' + d.month.toFixed(1) + ' ' + a.unit + '</div><div style="display:flex;gap:5px;font-size:10px;color:var(--secondary-text-color);justify-content:flex-end;align-items:center">' +
(yoyLabel ? '<span style="color:' + (yoyLabel[0]==='+'?'#ef4444':'#10b981') + '">' + yoyLabel + '</span>' : '') +
(costDisplay ? '<span style="color:' + color + '">' + costDisplay + '</span>' : '') + '</div></div>' +
'<div class="ar" style="transform:rotate(' + (isOpen?'90':'0') + 'deg)"></div></div>';
      if (isOpen) {
        if (a.id === 'water') {
          html += '<div class="dsec"><div style="padding:10px 12px 12px">' + this._waterDetail(d) + '</div></div>';
          continue;
        }
        var isLoading = this._loadingDetails[a.id];
        var ca1 = this._detailCache[a.id+':'+y1] || {};
        var ca2 = this._detailCache[a.id+':'+y2] || {};
        if (isLoading && Object.keys(ca1).length === 0) {
          html += '<div class="dsec"><div style="padding:24px;text-align:center;color:var(--secondary-text-color);font-size:13px">加载中...</div></div>';
          continue;
        }
        html += '<div class="dsec"><div style="padding:8px 12px 10px">' +
'<div class="ha" style="justify-content:space-between;margin-bottom:4px">' +
'<div class="ha">' + this._btnGroup(a) + '</div>' +
'<div class="ha"><button class="nb" data-action="cy" data-dir="-1"><</button><span class="yt" style="font-size:12px;min-width:28px">' + y1 + '</span><button class="nb" data-action="cy" data-dir="1">></button></div></div>' +
this._extraCards(a, d, ca1) +
'<div class="cl" style="margin-bottom:2px;font-size:10px;gap:14px"><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:' + CC.y1 + '"></span>本年</span><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:' + CC.y2 + '"></span>去年</span></div>' +
'<div class="ca">' + this._chartSVG(a.id, ca1, ca2, this._chartModes[a.id]||'usage', this._chartTypes[a.id]||'bar') + '</div>' +
(this._drillMonth != null && a.id.indexOf('ele:')===0 ? this._drillDaily(a.id.split(':')[1], this._drillMonth) : '') +
(a.id.indexOf('ele:')===0 ? this._dailySVG(a.id.split(':')[1]) : '') +
this._bottomCards(ca1, ca2, this._chartModes[a.id]||'usage', a.unit) + '</div></div>';
      }
    }
    this._el.rc.innerHTML = html;
  }

  _drillDaily(consNo, monthIdx) {
    var d = this._dailyCache[consNo];
    if (!d || d.length === 0) return '';
    var prefix = '2026' + (monthIdx+1).toString().padStart(2,'0');
    var days = d.filter(function(x) { return x.day.indexOf(prefix) === 0; });
    if (days.length === 0) {
      return '<div style="padding:6px 12px 8px;font-size:10px;color:var(--secondary-text-color);display:flex;justify-content:space-between"><span>day ' + (monthIdx+1) + ' ele</span><button class="nb" data-action="drillClose" style="font-size:10px;padding:1px 6px">X</button></div>';
    }
    var W = 280; var H = 50; var PT = 4; var PB = 12; var CH = H - PT - PB;
    var maxV = 1;
    for (var i=0;i<days.length;i++) { if (days[i].ele > maxV) maxV = days[i].ele; }
    var bw = Math.max(1, W / days.length - 1);
    var bars = '';
    for (var i=0;i<days.length;i++) {
      var h = (days[i].ele / maxV) * CH;
      var x = i * (bw + 1);
      var y = H - PB - h;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + CC.el + '" opacity="0.5" rx="1"/>';
    }
    return '<div style="padding:4px 12px 8px"><div style="font-size:10px;color:var(--secondary-text-color);display:flex;justify-content:space-between;margin-bottom:2px"><span>day ' + (monthIdx+1) + ' ele</span><button class="nb" data-action="drillClose" style="font-size:10px;padding:1px 6px">X</button></div><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:50px;display:block">' + bars + '</svg></div>';
  }

  _btnGroup(a) {
    var m = this._chartModes[a.id]||'usage';
    var ct = this._chartTypes[a.id]||'bar';
    var isCum = (ct === 'cum');
    return '<button class="nb' + (m==='usage'?' a':'') + '" data-action="sw" data-mode="usage">' + a.unit + '</button><button class="nb' + (m==='cost'?' a':'') + '" data-action="sw" data-mode="cost">$</button>' +
'<span style="width:1px;height:16px;background:var(--divider-color);margin:0 4px"></span>' +
'<button class="nb' + (!isCum&&ct==='line'?' a':'') + '" data-action="ct" data-ct="line">line</button>' +
'<button class="nb' + (!isCum&&ct==='bar'?' a':'') + '" data-action="ct" data-ct="bar">bar</button>' +
'<button class="nb' + (isCum?' a':'') + '" data-action="ct" data-ct="cum">cum</button>';
  }

  _extraCards(a, d, d1) {
    var cur = new Date().getMonth();
    var curCost = (d1[cur]&&d1[cur].cost) || (d1[cur-1]&&d1[cur-1].cost) || null;
    if (a.id.indexOf('ele:')===0) {
      return '<div class="sd2" style="margin-bottom:4px">' +
'<div class="sc"><div class="sv">' + (d.month!=null?d.month.toFixed(1):'--') + '</div><div class="sl">本月 kWh</div></div>' +
'<div class="sc"><div class="sv">' + (curCost!=null?''+curCost.toFixed(0):(d.lastCost!=null?'~'+d.lastCost.toFixed(0):'--')) + '</div><div class="sl">' + (curCost!=null?'本月费':'上月费') + '</div></div>' +
'<div class="sc"><div class="sv" style="color:' + (d.balance!=null&&d.balance<0?'#ef4444':'inherit') + '">' + (d.balance!=null?''+d.balance.toFixed(1):'--') + '</div><div class="sl">余额</div></div>' +
'<div class="sc"><div class="sv">' + (d.p!=null?'峰'+d.p.toFixed(0):'--') + '</div><div class="sl">峰</div></div></div>';
    }
    if (a.id==='gas') {
      return '<div class="sd2" style="margin-bottom:4px">' +
'<div class="sc"><div class="sv">' + (d.month!=null?d.month.toFixed(1):'--') + '</div><div class="sl">本月 m³</div></div>' +
'<div class="sc"><div class="sv">' + (curCost!=null?''+curCost.toFixed(0):(d.cost!=null?''+d.cost.toFixed(0):'--')) + '</div><div class="sl">' + (curCost!=null?'费用':'累计') + '</div></div>' +
'<div class="sc"><div class="sv">' + (d.year!=null?d.year.toFixed(0):'--') + '</div><div class="sl">年 m³</div></div>' +
'<div class="sc"><div class="sv">' + (d.balance!=null?''+d.balance.toFixed(1):'--') + '</div><div class="sl">余额</div></div></div>';
    }
    return '';
  }

  _waterDetail(d) {
    var t1=d.y1||0; var t2=d.y2||0; var t3=d.y3||0; var tot=t1+t2+t3;
    var eb=d.estBill||d.bill||null;
    var cap=d.tierCap||180;
    var used=d.yearT1||0;
    var pct=Math.min(100, _pct(used, cap));
    var rm=d.tierRemain!=null?d.tierRemain:Math.max(0,cap-used);
    var avg=d.avg||0;
    var vsAvg = '';
    if (avg>0) {
      var p = d.month > avg ? ((d.month/avg-1)*100).toFixed(0) : ((1-d.month/avg)*100).toFixed(0);
      var sym = d.month > avg ? '+' : '-';
      var clr = d.month > avg ? '#ef4444' : CC.wa;
      vsAvg = '<div style="font-size:10px;color:var(--secondary-text-color);margin-top:4px">vs avg: <span style="color:' + clr + ';font-weight:500">' + sym + p + '%</span></div>';
    }
    var tierHtml = '';
    if (tot>0) {
      tierHtml = '<div style="font-size:11px;color:var(--secondary-text-color);margin-bottom:2px">tiers</div>' +
'<div class="sd2" style="margin-bottom:4px">' +
'<div class="sc"><div class="sv" style="color:' + CC.wa + '">' + t1.toFixed(1) + '</div><div class="sl">一阶</div></div>' +
'<div class="sc"><div class="sv" style="color:#f59e0b">' + t2.toFixed(1) + '</div><div class="sl">二阶</div></div>' +
'<div class="sc"><div class="sv" style="color:#ef4444">' + t3.toFixed(1) + '</div><div class="sl">三阶</div></div>' +
'<div class="sc"><div class="sv">' + tot.toFixed(1) + '</div><div class="sl">合计</div></div></div>';
    }
    var progHtml = '';
    if (cap>0) {
      var barClr = pct>80?'#ef4444':pct>60?'#f59e0b':CC.wa;
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

  _bottomCards(d1, d2, mode, unit) {
    var maxM = new Date().getMonth();
    var y1t = 0; var y2t = 0; var y1c = 0; var y2c = 0;
    var keys = Object.keys(d1);
    for (var i=0;i<keys.length;i++) {
      if (Number(keys[i]) <= maxM) { y1t += Math.max(0, d1[keys[i]].change||0); }
      y1c += d1[keys[i]].cost||0;
    }
    keys = Object.keys(d2);
    for (var i=0;i<keys.length;i++) {
      if (Number(keys[i]) <= maxM) { y2t += Math.max(0, d2[keys[i]].change||0); }
      y2c += d2[keys[i]].cost||0;
    }
    var vv = mode==='usage' ? y1t.toFixed(1) : '' + y1c.toFixed(0);
    var vv2 = mode==='usage' ? y2t.toFixed(1) : '' + y2c.toFixed(0);
    var diff = mode==='usage' ? y1t - y2t : y1c - y2c;
    var diffStr = diff>0 ? '+' : (diff<0 ? '' : '=');
    var diffClr = diff>0?'#ef4444':diff<0?'#10b981':'var(--secondary-text-color)';
    return '<div class="sd2" style="margin-top:4px"><div class="sc"><div class="sv">' + vv + '</div><div class="sl">本年</div><div style="font-size:9px;margin-top:1px;color:' + diffClr + '">' + diffStr + Math.abs(diff).toFixed(mode==='usage'?1:0) + (mode==='usage'?unit:'') + '</div></div><div class="sc"><div class="sv">' + vv2 + '</div><div class="sl">去年</div></div></div>';
  }

  _chartSVG(id, d1, d2, mode, ct) {
    var months = 12;
    var u = '';
    for (var ai=0;ai<DA.length;ai++) { if (DA[ai].id === id) { u = DA[ai].unit; break; } }
    var isEle = (id.indexOf('ele:') === 0);
    var p = 0.5;
    var v1 = []; var v2 = [];
    for (var m=0;m<months;m++) {
      var a = d1[m] ? d1[m].change : 0;
      var b = d2[m] ? d2[m].change : 0;
      if (mode === 'cost') {
        a = d1[m] ? (d1[m].cost || a * p) : 0;
        b = d2[m] ? (d2[m].cost || b * p) : 0;
      }
      v1.push(Math.max(0, a));
      v2.push(Math.max(0, b));
    }
    var mv = Math.max.apply(null, v1.concat(v2).concat([1]));
    var W = 280; var H = 130; var PT = 14; var PB = 20; var PL = 28; var PR = 8;
    var CH = H - PT - PB; var CW = W - PL - PR;
    var SX = CW / (months > 1 ? months - 1 : 1);
    var BW = months > 1 ? CW / months * 0.22 : 8;
    function py(v) { return PT + CH - (v/mv) * CH * 0.85; }

    if (ct === 'cum') {
      var c1 = _cum(v1, months); var c2 = _cum(v2, months);
      var mc = Math.max.apply(null, c1.concat(c2).concat([1]));
      var fv = _fc(c1, months);
      var now = new Date().getMonth();
      var grid = ''; var labels = ''; var hl = ''; var tip = '';
      var stp = _niceStep(mc);
      for (var i=0;i<4;i++) {
        var y = PT + (CH/3)*i;
        var val = stp * (3-i);
        grid += '<line x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W-PR) + '" y2="' + y.toFixed(1) + '" stroke="var(--divider-color)" stroke-width="0.5"/>' +
          '<text x="' + (PL-4) + '" y="' + (y.toFixed(1)+3) + '" text-anchor="end" fill="var(--secondary-text-color)" font-size="8">' + _pp(val) + '</text>';
      }
      for (var i=0;i<months;i+=2) {
        labels += '<text x="' + (PL+i*SX).toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" fill="var(--secondary-text-color)" font-size="9">' + (i+1) + '</text>';
      }
      var hm = this._hoverMonth;
      if (hm != null) {
        hl = '<rect x="' + Math.max(PL, PL+hm.month*SX-SX*0.45).toFixed(1) + '" y="' + PT + '" width="' + (SX*0.9).toFixed(1) + '" height="' + CH.toFixed(1) + '" class="crh" rx="4"/>';
      }
      var lines1 = ''; var dots1 = '';
      for (var i=0;i<months;i++) {
        var x = PL + i*SX;
        var y = Math.max(PT, Math.min(H-PB, PT+CH-(c1[i]/mc)*CH*0.85));
        lines1 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        dots1 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2" fill="' + CC.y1 + '" cursor="pointer" data-action="month" data-year="' + this._hoverYear + '" data-month="' + i + '"/>';
      }
      var line2 = ''; var dots2 = '';
      for (var i=0;i<months;i++) {
        var x = PL + i*SX;
        var y = Math.max(PT, Math.min(H-PB, PT+CH-(c2[i]/mc)*CH*0.85));
        line2 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        dots2 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2" fill="' + CC.y2 + '" cursor="pointer" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '"/>';
      }
      var fl = '';
      if (fv > 0 && now < months-1) {
        var fx1 = PL + now*SX;
        var fy1 = Math.max(PT, Math.min(H-PB, PT+CH-(c1[now]/mc)*CH*0.85));
        var fx2 = PL + (months-1)*SX;
        var fy2 = Math.max(PT, Math.min(H-PB, PT+CH-(fv/mc)*CH*0.85));
        fl = '<path d="M' + fx1.toFixed(1) + ',' + fy1.toFixed(1) + 'L' + fx2.toFixed(1) + ',' + fy2.toFixed(1) + '" fill="none" stroke="' + CC.gp + '" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>' +
          '<text x="' + (fx2-4).toFixed(1) + '" y="' + (fy2-4).toFixed(1) + '" text-anchor="end" fill="' + CC.gp + '" font-size="8" opacity="0.7">~' + _pp(fv) + '</text>';
      }
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%;display:block;pointer-events:auto;cursor:crosshair"><style>.crh{fill:var(--primary-color);opacity:0.08;pointer-events:none}</style>' + grid + hl + '<path d="' + lines1 + '" fill="none" stroke="' + CC.y1 + '" stroke-width="2" opacity="0.85"/>' + dots1 + '<path d="' + line2 + '" fill="none" stroke="' + CC.y2 + '" stroke-width="2" opacity="0.85"/>' + dots2 + labels + fl + tip + '</svg>';
    }

    var pvBars = ''; var pvLeg = '';
    if (ct === 'bar' && mode === 'usage' && isEle) {
      for (var i=0;i<months;i++) {
        var dd = d1[i]; if (!dd || !dd.p_ele) continue;
        var tt = dd.p_ele + dd.v_ele + (dd.n_ele||0); if (tt<=0) continue;
        var hh = (tt/mv)*CH*0.85; var hp = (dd.p_ele/tt)*hh; var hv = (dd.v_ele/tt)*hh; var hn = ((dd.n_ele||0)/tt)*hh;
        var cx = PL + i*SX; var yb = H-PB; var cy = yb;
        if (hv>1){cy-=hv;pvBars+='<rect x="'+(cx-BW).toFixed(1)+'" y="'+cy.toFixed(1)+'" width="'+(BW*2).toFixed(1)+'" height="'+hv.toFixed(1)+'" fill="'+CC.vl+'" opacity="0.35" rx="1"/>';}
        if (hn>1){cy-=hn;pvBars+='<rect x="'+(cx-BW).toFixed(1)+'" y="'+cy.toFixed(1)+'" width="'+(BW*2).toFixed(1)+'" height="'+hn.toFixed(1)+'" fill="'+CC.fl+'" opacity="0.35" rx="1"/>';}
        if (hp>1){cy-=hp;pvBars+='<rect x="'+(cx-BW).toFixed(1)+'" y="'+cy.toFixed(1)+'" width="'+(BW*2).toFixed(1)+'" height="'+hp.toFixed(1)+'" fill="'+CC.pk+'" opacity="0.35" rx="1"/>';}
      }
      if (pvBars) { pvLeg = '<div class="cl" style="font-size:10px;gap:12px;margin-top:2px"><span>峰</span><span>平</span><span>谷</span></div>'; }
    }

    var svg = ''; var hm = this._hoverMonth;
    if (ct === 'bar') {
      var bars = ''; var labels = ''; var grid = ''; var hl = ''; var tip = ''; var dbtns = '';
      for (var i=0;i<months;i++) {
        var cx = PL + i*SX;
        var h1 = v1[i]>0 ? (v1[i]/mv)*CH*0.85 : 0;
        var h2 = v2[i]>0 ? (v2[i]/mv)*CH*0.85 : 0;
        var yb = H-PB;
        if (h1>0 && !pvBars) {
          bars += '<rect x="' + (cx-BW).toFixed(1) + '" y="' + (yb-h1).toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + h1.toFixed(1) + '" fill="' + CC.y1 + '" rx="2" cursor="pointer" data-action="month" data-year="' + this._hoverYear + '" data-month="' + i + '" opacity="0.85"/>' +
            '<rect x="' + (cx-BW).toFixed(1) + '" y="' + PT.toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + (CH*0.85).toFixed(1) + '" fill="transparent" data-action="drill" data-month="' + i + '" cursor="pointer"/>';
        }
        if (h2>0) {
          bars += '<rect x="' + cx.toFixed(1) + '" y="' + (yb-h2).toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + h2.toFixed(1) + '" fill="' + CC.y2 + '" rx="2" cursor="pointer" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '" opacity="0.85"/>' +
            '<rect x="' + cx.toFixed(1) + '" y="' + PT.toFixed(1) + '" width="' + BW.toFixed(1) + '" height="' + (CH*0.85).toFixed(1) + '" fill="transparent" cursor="pointer"/>';
        }
        if (i%2===0) { labels += '<text x="' + cx.toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" fill="var(--secondary-text-color)" font-size="9">' + (i+1) + '</text>'; }
      }
      var stp = _niceStep(mv);
      for (var i=0;i<4;i++) {
        var y = PT + (CH/3)*i;
        var val = stp * (3-i);
        grid += '<line x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W-PR) + '" y2="' + y.toFixed(1) + '" stroke="var(--divider-color)" stroke-width="0.5"/>' +
          '<text x="' + (PL-4) + '" y="' + (y.toFixed(1)+3) + '" text-anchor="end" fill="var(--secondary-text-color)" font-size="8">' + _pp(val) + '</text>';
      }
      if (hm != null) {
        hl = '<rect x="' + Math.max(PL, PL+hm.month*SX-SX*0.45).toFixed(1) + '" y="' + PT + '" width="' + (SX*0.9).toFixed(1) + '" height="' + CH.toFixed(1) + '" class="crh" rx="4"/>';
      }
      tip = hm != null ? _tip(hm.month, d1, d2, u, PL, SX, H, W, this._hoverPos) : '';
      svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%;display:block"><style>.crh{fill:var(--primary-color);opacity:0.08;pointer-events:none}</style>' + grid + hl + pvBars + bars + labels + dbtns + tip + '</svg>' + pvLeg;
    } else {
      var lines1 = ''; var dots1 = '';
      for (var i=0;i<months;i++) {
        var x = PL + i*SX;
        var y = Math.max(PT, Math.min(H-PB, py(v1[i])));
        lines1 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        if (v1[i] > 0) {
          dots1 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="' + CC.y1 + '" cursor="pointer" data-action="month" data-year="' + this._hoverYear + '" data-month="' + i + '"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" fill="transparent" cursor="pointer"/>';
        }
      }
      var line2 = ''; var dots2 = '';
      for (var i=0;i<months;i++) {
        var x = PL + i*SX;
        var y = Math.max(PT, Math.min(H-PB, py(v2[i])));
        line2 += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
        if (v2[i] > 0) {
          dots2 += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="' + CC.y2 + '" cursor="pointer" data-action="month" data-year="' + (this._hoverYear-1) + '" data-month="' + i + '"/>' +
            '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" fill="transparent" cursor="pointer"/>';
        }
      }
      var grid = ''; var labels = ''; var hl = ''; var tip = '';
      var stp = _niceStep(mv);
      for (var i=0;i<4;i++) {
        var y = PT + (CH/3)*i;
        var val = stp * (3-i);
        grid += '<line x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W-PR) + '" y2="' + y.toFixed(1) + '" stroke="var(--divider-color)" stroke-width="0.5"/>' +
          '<text x="' + (PL-4) + '" y="' + (y.toFixed(1)+3) + '" text-anchor="end" fill="var(--secondary-text-color)" font-size="8">' + _pp(val) + '</text>';
      }
      for (var i=0;i<months;i+=2) {
        labels += '<text x="' + (PL+i*SX).toFixed(1) + '" y="' + (H-4) + '" text-anchor="middle" fill="var(--secondary-text-color)" font-size="9">' + (i+1) + '</text>';
      }
      if (hm != null) {
        hl = '<rect x="' + Math.max(PL, PL+hm.month*SX-SX*0.45).toFixed(1) + '" y="' + PT + '" width="' + (SX*0.9).toFixed(1) + '" height="' + CH.toFixed(1) + '" class="crh" rx="4"/>';
      }
      tip = hm != null ? _tip(hm.month, d1, d2, u, PL, SX, H, W, this._hoverPos) : '';
      var area1 = lines1 + ' L' + (PL+(months-1)*SX).toFixed(1) + ',' + (H-PB) + ' L' + PL + ',' + (H-PB) + ' Z';
      svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:100%;display:block;pointer-events:auto"><style>.crh{fill:var(--primary-color);opacity:0.08;pointer-events:none}</style>' + grid + hl +
        '<path d="' + lines1 + '" fill="none" stroke="' + CC.y1 + '" stroke-width="1.5" opacity="0.85"/>' +
        '<path d="' + area1 + '" fill="' + CC.y1 + '" opacity="0.06"/>' + dots1 +
        '<path d="' + line2 + '" fill="none" stroke="' + CC.y2 + '" stroke-width="1.5" opacity="0.85"/>' +
        '<path d="' + line2 + ' L' + (PL+(months-1)*SX).toFixed(1) + ',' + (H-PB) + ' L' + PL + ',' + (H-PB) + ' Z" fill="' + CC.y2 + '" opacity="0.06"/>' + dots2 +
        labels + tip + '</svg>';
    }
    return svg;
  }

  _dailySVG(consNo) {
    var d = this._dailyCache[consNo];
    if (!d || d.length === 0) return '';
    var days = d.length; var W = 280; var H = 50; var PT = 4; var PB = 12; var CH = H - PT - PB;
    var maxV = 1; for (var i=0;i<days;i++) { if (d[i].ele > maxV) maxV = d[i].ele; }
    var bw = Math.max(1, W/days-1);
    var bars = '';
    for (var i=0;i<days;i++) { var h = (d[i].ele/maxV)*CH; var x = i*(bw+1); var y = H-PB-h; bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + CC.y2 + '" opacity="0.5" rx="1"/>'; }
    var last = d[d.length-1];
    return '<div style="margin-top:6px"><div style="font-size:10px;color:var(--secondary-text-color);display:flex;justify-content:space-between"><span>近30日日用电</span><span style="font-weight:500">昨日 ' + (last?last.ele.toFixed(1):'--') + ' kWh</span></div><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:50px;display:block">' + bars + '</svg></div>';
  }

  getCardSize() { return 7; }
}
customElements.define('c3h3-energy-hub-card', C3h3EnergyHubCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'c3h3-energy-hub-card', name: 'C3H3 Energy Hub', description: 'Cumulative trend - YoY - Drill-down - Filter - Export' });
