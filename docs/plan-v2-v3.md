# C3H3 Energy Hub Card v2.0 + v3.0 实现计划

> **For agentic workers:** 单文件重构，按任务逐步实现。

**目标：** 将硬编码的能源卡片改为完全可配置架构，并增强交互体验

**架构：** 单 JS 文件重写，保持 backward compatibility，新增配置驱动模式

**文件：** 仅修改 `c3h3-energy-hub-card.js`

---

### Task 1: 配置架构设计 + setConfig 重写

**文件：**
- 修改: `c3h3-energy-hub-card.js:43-56`

**改动内容：**
- 设计新的 YAML 配置格式，支持 `electricity[]`、`gas[]`、`water[]` 数组
- 保留旧配置兼容（`filters`, `budgets`, `alertThreshold`）
- 新增 `showYearSummary` 用于 v3.0 年度总结

```yaml
# 新配置格式示例
type: custom:c3h3-energy-hub-card
title: "能源中心"
electricity:
  - name: "202室"
    icon: "⚡"
    cons_no: "3305820502430"
    entities:
      month: sensor.state_grid_3305820502430_month_ele_num
      year: sensor.state_grid_3305820502430_year_ele_num
      cost: sensor.state_grid_3305820502430_last_month_ele_cost
      balance: sensor.state_grid_3305820502430_balance
      peak: sensor.state_grid_3305820502430_month_p_ele_num
      valley: sensor.state_grid_3305820502430_month_v_ele_num
    statistics:
      energy: sg_inject:3305820502430_monthly_ele
      cost: sg_inject:3305820502430_monthly_cost
  - name: "辅房"
    icon: "🔌"
    cons_no: "3309947582705"
    entities:
      month: sensor.state_grid_3309947582705_month_ele_num
      year: sensor.state_grid_3309947582705_year_ele_num
      cost: sensor.state_grid_3309947582705_last_month_ele_cost
      balance: sensor.state_grid_3309947582705_balance
    statistics:
      energy: sg_inject:3309947582705_monthly_ele
      cost: sg_inject:3309947582705_monthly_cost
gas:
  - name: "燃气"
    icon: "🔥"
    entities:
      month: sensor.chu_fang_hua_run_ran_qi_ben_yue_lei_ji_yong_qi_liang
      year: sensor.hua_run_ran_qi_yi_jie_ti_lei_ji_yi_yong
      cost: sensor.hua_run_ran_qi_lei_ji_ran_qi_fei_yong
      balance: sensor.chu_fang_hua_run_ran_qi_ran_qi_zhang_hu_yu_e
      bill: sensor.chu_fang_hua_run_ran_qi_zhang_dan_jin_e
    statistics:
      usage: crcgas:monthly_gas_usage
      cost: crcgas:monthly_bill_amount
water:
  - name: "倪*州"
    icon: "💧"
    entities:
      month: sensor.wen_zhou_shui_wu_ni_zhou_5
      bill: sensor.wen_zhou_shui_wu_ni_zhou_6
      cost: sensor.shi_wai_wen_zhou_shui_wu_ni_zhou_lei_ji_shui_fei
      tier1: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yong_shui_liang
      tier2: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_er_jie_yong_shui_liang
      tier3: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_san_jie_yong_shui_liang
      avg: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_li_shi_yue_jun_yong_shui
      est_bill: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yu_gu_ben_yue_zhang_dan
      tier_remain: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_jie_ti_sheng_yu_liang
      year_t1: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_yi_yong_liang
      tier_cap: sensor.wen_zhou_shui_wu_ni_zhou_ni_zhou_yi_jie_shang_xian
    statistics:
      cost: wenzhou_water:82011020337_monthly_water_cost
  - name: "倪*禾"
    icon: "💧"
    entities:
      month: sensor.wen_zhou_shui_wu_ni_he_5
      bill: sensor.wen_zhou_shui_wu_ni_he_6
      cost: sensor.shi_wai_wen_zhou_shui_wu_ni_he_lei_ji_shui_fei
      tier1: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_yi_jie_yong_shui_liang
      tier2: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_er_jie_yong_shui_liang
      tier3: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_san_jie_yong_shui_liang
      avg: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_li_shi_yue_jun_yong_shui
      est_bill: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_yu_gu_ben_yue_zhang_dan
      tier_remain: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_jie_ti_sheng_yu_liang
      year_t1: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_yi_jie_yi_yong_liang
      tier_cap: sensor.wen_zhou_shui_wu_ni_he_ni_zhou_yi_jie_shang_xian
    statistics:
      cost: wenzhou_water:82003017553_monthly_water_cost
filters:
  - ele
  - gas
  - water
budgets:
  ele: 1000
  gas: 50
  water: 30
alertThreshold: 1.3
```

### Task 2: 自动检测 + 配置合并逻辑

**文件：**
- 修改: `c3h3-energy-hub-card.js:210-236` (_load 方法)

**改动内容：**
- 新增 `_buildAccounts()` 方法：从配置构建内部账户列表
- 保留自动检测逻辑（当配置未提供时，使用当前硬编码默认值）
- 支持 N 个电网账户、N 个水务账户
- `DA` 数组改为动态生成

### Task 3: 数据加载重构

**文件：**
- 修改: `c3h3-energy-hub-card.js:238-351` (_loadDetail 方法)

**改动内容：**
- 将 `_loadDetail` 改为配置驱动
- 去掉 `ele:total` 的特殊合并逻辑，改为通用多账户汇总
- 水务多账户支持
- 支持任何年份（不限于本年/去年）

### Task 4: 渲染层重构

**文件：**
- 修改: `c3h3-energy-hub-card.js:402-497` (_renderRows 等方法)

**改动内容：**
- `_renderRows` 改为遍历动态账户列表
- 所有图表渲染方法适配配置驱动
- 水务多账户渲染

### Task 5: 可视化配置面板

**文件：**
- 修改: `c3h3-energy-hub-card.js:41` (getConfigElement)

**改动内容：**
- 实现 `getConfigElement()` 返回 HA 配置对话框
- 支持基本配置编辑

### Task 6: 多年度切换 (v3.0)

**文件：**
- 修改: `c3h3-energy-hub-card.js:144-149` (year 切换)

**改动内容：**
- 年份切换支持任意年份（`_year` 改为 `_viewYear`）
- 年份选择器增加下拉菜单
- 缓存多年度数据

### Task 7: 气/水月份下钻 (v3.0)

**文件：**
- 修改: `c3h3-energy-hub-card.js:238-352` (_loadDetail)

**改动内容：**
- 燃气和水也支持 `statistics_during_period` 查询
- 添加月份点击下钻显示日数据（气/水）

### Task 8: 年度总结视图 (v3.0)

**文件：**
- 修改: `c3h3-energy-hub-card.js:84-97` (HTML 模板)

**改动内容：**
- 新增年度总结模式：显示年总览卡片
- 费用趋势、同比分析、月度排名

### Task 9: CSV/JSON 导出 + 全屏模式 (v3.0)

**文件：**
- 修改: `c3h3-energy-hub-card.js:159-176` (export 逻辑)

**改动内容：**
- 导出 CSV：数据表格
- 导出 JSON：原始数据
- 全屏模式：图表展开到全屏
- 打印样式