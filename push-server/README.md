# iPhone Web Push 服务

GitHub Pages 只负责展示 App，不能保存 Push subscription 或发送通知。这个小服务保存个人订阅，并通过 VAPID/Web Push 发送日报通知。

部署服务时安装依赖并设置 `.env.example` 中的环境变量。生成 VAPID 密钥：

```sh
npx web-push generate-vapid-keys
```

把公钥放进前端构建变量 `VITE_VAPID_PUBLIC_KEY`，把公钥、私钥、`CRON_SECRET` 和 `VAPID_SUBJECT` 放进服务端环境变量。`POST /subscribe` 接收 iPhone 的订阅，`POST /send-daily` 需要 `x-cron-secret`，请求体例如：

```json
{"title":"见闻 · 今日 15 条精选","body":"日报已经准备好，打开查看今天的来源与项目线索。","url":"/"}
```

个人使用可以先使用文件存储；如果以后多个用户共用，再换成 KV 或数据库。服务必须使用 HTTPS，且不能把私钥放在前端或 GitHub Pages。
