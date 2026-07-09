# 《大结果》— 3 分钟拿捏一个富哥

一款高反馈、高传播、单局约 3 分钟的**三维口味文字冒险小游戏**。纯手机端优先，单文件前端（`index.html`，零外部依赖、可离线双击即玩），配 Cloudflare Pages 无服务器后端做**轻量监控**。

## 玩法内核
- **人设**：由 A–F 六列各抽一词拼成（F 人设类型必出），六列 +/− 累加成你的 **魅力 L**。
- **三维（可正可负）**：魅力 **L**（土甜◄►高级）· 框架 **F**（倒贴◄►拿捏）· 图钱 **P**（纯情◄►图钱）。
- **上头值 0–100**：你的每步选择在「大哥加权口味方向」上的累计契合度（主反馈条）。
- **结局四档 18 个**：大结果（反向拿捏/结婚/送出国/关起来/买房/包养）· 小结果（铂金包/车/表/香奶奶）· 没结果·白上桌（留在YC/没上桌/白入局/陪跑）· 负结果（查无此人/倒亏/翻车社死/反被薅）。
- 每局随机人设/大哥/场地；结局给一张「看似贬低实则封神」的鉴定书，可一键导出 PNG（手机存相册 / 电脑存文件）。

## 目录结构
```
index.html              # 全部前端（单文件，含游戏 + 结局卡 + PNG 导出 + 监控 beacon）
functions/api/track.js  # POST /api/track  接收事件写 KV（Cloudflare Pages Function）
functions/api/stats.js  # GET  /api/stats  返回聚合监控（token 保护）
wrangler.toml           # Cloudflare Pages + KV 绑定配置
package.json            # 部署脚本
```

## 一、推到 GitHub
```bash
git init && git add -A && git commit -m "init: 大结果 v3"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dajieguo.git   # 先在 GitHub 网页建好空仓库
git push -u origin main
```
> 没装 `gh` CLI 就先在 github.com 网页点「New repository」建一个空仓库，再执行上面的 remote/push。

## 二、部署到 Cloudflare Pages（含后端监控）
需要一次 `npx wrangler login`（浏览器授权）。

1. **建 KV 命名空间**（存监控计数）：
   ```bash
   npx wrangler kv namespace create STATS
   ```
   把输出的 `id` 填进 `wrangler.toml` 的 `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`。

2. **部署**（二选一）：
   - **A. 直接上传**：`npx wrangler pages deploy .`
   - **B. Git 集成（推荐，自动 CI）**：Cloudflare 控制台 → Workers & Pages → Create → Pages → 连接刚才的 GitHub 仓库；Build 命令留空，输出目录填 `.`。之后每次 `git push` 自动部署。
     用 B 时，在 Pages 项目 → Settings → Functions → **KV namespace bindings** 里把变量名 `STATS` 绑到上面的命名空间。

3. **保护监控端点**（可选但建议）：设置密钥 `STATS_TOKEN`
   ```bash
   npx wrangler pages secret put STATS_TOKEN     # 直传方式
   ```
   或在 Pages 项目 → Settings → Environment variables 加 `STATS_TOKEN`。

## 三、查看监控
- 游戏在线打开后，`开局` 与 `结局` 会通过 `navigator.sendBeacon('/api/track')` 上报（本地 `file://` 打开自动跳过、不影响离线游玩）。
- 打开 `https://<你的域名>/api/stats?token=<STATS_TOKEN>` 看聚合：总开局数、完成率、各结局/四档/大哥分布、按天趋势、JS 错误数。
- 想要流量/在线率监控：Cloudflare 控制台 → 该 Pages 项目 → **Analytics**（自带请求量/状态码/带宽），或开启 **Web Analytics**。

## 监控字段
`plays` 总开局 · `finishes` 完成局 · `finishRate` 完成率 · `endings.<id>` 各结局次数 · `groups.<四档>` · `targets.<大哥>` · `daily.<日期>` 按天 · `jserror` 前端报错数。

> 说明：KV 计数用读改写、非强一致，高并发下可能少量偏差，用于趋势监控足够；要精确可换 Analytics Engine / D1。
