# C3H3 Energy Hub Card

一个集成电力、燃气、用水三合一的可视化能源中心 Lovelace 卡片。点击展开详情，手风琴式交互。

## 功能特性

- ⚡ **三合一能源中心** — 电力、燃气、用水一卡展示
- 📊 **多种图表类型** — 柱状图、折线图、累计趋势图（含预测线）
- 🔄 **双年对比** — 今年 vs 去年，环比变化一目了然
- 📅 **月份下钻** — 点击月份查看每日用电详情
- 💰 **费用追踪** — 总账单汇总 + 各能源费用占比
- 🔍 **智能过滤** — 按能源类型筛选显示
- 📷 **图表导出** — 一键导出为 PNG 图片
- 📱 **响应式设计** — 完美适配手机/平板/桌面
- 🎯 **预算管理** — 设置月度预算，进度条实时追踪
- ⚠️ **用量预警** — 超出去年同期阈值自动提醒

## 安装

### HACS 安装（推荐）

1. 打开 HACS → 前端 → 自定义仓库
2. 添加仓库地址: `https://github.com/C3H3-AI/c3h3-energy-hub-card`
3. 分类选择: Lovelace
4. 搜索 "C3H3 Energy Hub Card" 并安装
5. 刷新浏览器

### 手动安装

将 `c3h3-energy-hub-card.js` 复制到 HA 的 `config/www/` 目录，然后添加资源引用：

```yaml
# 配置 → 仪表盘 → 资源管理
/local/community/c3h3-energy-hub-card/c3h3-energy-hub-card.js
```

## 配置

### 自动检测（默认）

无需任何配置，卡片自动检测已安装的集成：

```yaml
type: custom:c3h3-energy-hub-card
```

### 完整配置

```yaml
type: custom:c3h3-energy-hub-card
title: "我的能源中心"
filters:
  - ele
  - gas
  - water
budgets:
  ele: 1000        # 月用电预算 kWh
  gas: 50          # 月燃气预算 m³
  water: 30        # 月用水预算 m³
alertThreshold: 1.3  # 用量超出去年同期倍数预警
```

### 自定义实体（高级）

```yaml
type: custom:c3h3-energy-hub-card
entities:
  - type: ele
    name: "202室"
    icon: "⚡"
    entity: sensor.state_grid_3305820502430_month_ele_num
    year_entity: sensor.state_grid_3305820502430_year_ele_num
    cost_entity: sensor.state_grid_3305820502430_last_month_ele_cost
    balance_entity: sensor.state_grid_3305820502430_balance
    peak_entity: sensor.state_grid_3305820502430_month_p_ele_num
    valley_entity: sensor.state_grid_3305820502430_month_v_ele_num
    stat_ele: sg_inject:3305820502430_monthly_ele
    stat_cost: sg_inject:3305820502430_monthly_cost
  - type: gas
    name: "燃气"
    entity: sensor.chu_fang_hua_run_ran_qi_ben_yue_lei_ji_yong_qi_liang
    stat_usage: crcgas:monthly_gas_usage
    stat_cost: crcgas:monthly_bill_amount
  - type: water
    name: "用水"
    entity: sensor.wen_zhou_shui_wu_ni_zhou_5
```

## 支持的集成

自动检测以下 Home Assistant 集成：

| 集成 | 类型 | 项目地址 |
|------|:----:|---------|
| state_grid | ⚡ 电力 | https://github.com/C3H3-AI/state_grid |
| ha-crcgas | 🔥 燃气 | https://github.com/C3H3-AI/ha-crcgas |
| wenzhou_water | 💧 用水 | https://github.com/C3H3-AI/ha-wenzhou-water |

## 更新日志

### v4.0 - 全功能版
- 累计趋势图 + 预测线
- 环比变化标签
- 月份下钻日数据
- 费用占比图例
- 能源类型过滤
- 图表导出 PNG
- 年份回溯切换
- 用电合计行
- 预算进度条
- 用量预警
- 响应式设计

### v3.0
- 柱状图/折线图切换
- 峰谷用电堆叠展示
- 近30天日用电走势
- 外部统计数据注入

## 许可

MIT License
