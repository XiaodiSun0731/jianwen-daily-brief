# 见闻 Daily Brief

面向个人使用的 iPhone 资讯简报原型：工作日 07:40 收集 15 条全球商业、科技、设计、服装、电商和自媒体资讯；每周六 15:00 从收藏中整理准备优化的项目。

- 在线 App：[xiaodisun0731.github.io/jianwen-daily-brief](https://xiaodisun0731.github.io/jianwen-daily-brief/)
- GitHub：[XiaodiSun0731/jianwen-daily-brief](https://github.com/XiaodiSun0731/jianwen-daily-brief)
- 实时资讯：`.github/workflows/daily-feed.yml` 定时抓取 RSS/Atom，并在 `src/data/daily-feed.json` 保存原文链接和发布时间。
- iPhone 推送：`push-server/` 是可部署的 Web Push 服务；需要配置 HTTPS、VAPID 密钥和 `PUSH_API_URL` / `PUSH_CRON_SECRET` 后，App 里的“开启通知”才会真正发送到手机。

当前 Actions 已完成 GitHub Pages 部署。没有配置 `OPENAI_API_KEY` 时，页面会把抓到的内容标记为“实时原文”；配置后才会生成中文摘要和关注理由。
