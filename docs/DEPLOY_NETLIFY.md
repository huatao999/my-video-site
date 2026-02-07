# Netlify 部署与 R2 配置指南

## 环境变量（必填）

在 Netlify **Site settings > Environment variables** 中添加：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `R2_ACCOUNT_ID` | Cloudflare R2 账户 ID | 32 位十六进制字符串 |
| `R2_ACCESS_KEY_ID` | R2 S3 兼容 Access Key（32 位） | 在 R2 控制台创建 API Token 时选择 S3 API |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | 与 Access Key 配对 |
| `R2_BUCKET` | R2 存储桶名称 | 在 Cloudflare R2 控制台创建 bucket 时的名称 |

## 可选环境变量

| 变量名 | 说明 |
|--------|------|
| `R2_PREFIX` | 若视频文件在 bucket 的子目录下，设置此前缀。例如：视频在 `my-video-site/ep1.mp4`、`my-video-site/covers/` 下，则设为 `my-video-site/`。播放测试输入 `ep1.mp4` 时会自动解析为 `my-video-site/ep1.mp4` |
| `ADMIN_PASSWORD` | 后台管理密码，用于 `/admin` 登录 |

## 常见 R2 结构

### 结构 A：视频在 bucket 根目录（你的情况）

- Bucket 名：`my-video-site`
- 对象路径：`ep1.mp4`、`ep2.mp4`、`covers/ep1-zh.jpg`、`covers/ep2-zh.jpg`

**配置：** `R2_BUCKET=my-video-site`，**不要设置** `R2_PREFIX`（留空或删除该变量）。

### 结构 B：视频在 bucket 子目录

- Bucket 名：任意（如 `videos`）
- 对象路径：`my-video-site/ep1.mp4`、`my-video-site/covers/ep1-zh.jpg`

**配置：** `R2_BUCKET=videos`，`R2_PREFIX=my-video-site/`。

## 修改环境变量后

1. 在 Netlify 中保存环境变量
2. 进入 **Deploys**，点击 **Trigger deploy > Deploy site** 重新部署
