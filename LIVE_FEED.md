# 见闻的实时资讯链路

App 读取 `src/data/daily-feed.json`。本地文件里保留 15 条回退内容，避免资讯服务暂时不可用时空白；它们会显示为“示例内容”。GitHub Actions 运行 `scripts/update-daily-feed.mjs` 后，会把抓到的 RSS/Atom 条目去重、按时间排序、保留原文链接，再写回同一个 JSON，下一次 Pages 部署后 App 就会读取新内容。

工作日的两个 UTC 触发点用于覆盖意大利冬夏令时。脚本会用 `Europe/Rome` 判断是否正好是本地 07:40，只有正确的那一次才更新数据。手动运行 `workflow_dispatch` 可立即刷新。

## GitHub 设置

1. 在仓库的 **Settings → Pages** 把 Source 设为 **GitHub Actions**。
2. 在 **Settings → Actions → General** 允许 workflow 写入 repository contents；workflow 已声明 `contents: write`。
3. 建议添加 Actions Secret `OPENAI_API_KEY`。有这个 Secret 时，脚本会把原文标题和摘要整理成中文 `desc`，并补充 `why`；没有时仍会更新原文标题、来源、链接和发布时间，但不会假装已经翻译或验证。
4. 如需指定模型，可添加 repository variable `OPENAI_MODEL`；未设置时脚本使用 `gpt-5-mini`。

## 推送边界

GitHub Actions 能定时更新日报和部署网页，但 GitHub Pages 本身不能保存 iPhone 的 Web Push 订阅，也不能作为推送发送端。要实现 iPhone 07:40 通知，需要在用户授权后把 Push subscription 发到一个 HTTPS API，并由定时任务读取订阅、调用 VAPID/Web Push 服务发送通知。这个 API 可以放在 Cloudflare Worker、Supabase Edge Function 或其他带数据库的服务上；它与 GitHub Pages 是独立部署，不能把私钥放进前端。
