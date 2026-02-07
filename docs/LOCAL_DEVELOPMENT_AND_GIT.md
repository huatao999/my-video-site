# 本地开发与推送到 GitHub

## 一、本地运行（解决连接失败）

### 1. 启动开发服务器

在项目根目录打开终端，执行：

```bash
npm run dev
```

看到类似输出表示成功：

```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in xxx ms
```

### 2. 访问网站

在浏览器打开：http://localhost:3000

### 3. 连接失败时排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| Firefox 无法建立到 localhost:3000 的连接 | 开发服务器未启动 | 先执行 `npm run dev` |
| 端口被占用 | 3000 端口已被其他程序使用 | 执行 `npm run dev -- -p 3001` 使用 3001 端口 |
| 防火墙/代理拦截 | 系统或网络限制 | 确认防火墙允许 Node.js 访问网络，或暂时关闭代理 |

---

## 二、推送到 GitHub 的步骤与命令

### 1. 查看修改内容

```bash
git status
```

### 2. 添加修改的文件

```bash
git add .
```

或只添加指定文件：

```bash
git add middleware.ts src/app/admin/upload/page.tsx src/components/pages/HomeClient.tsx src/components/pages/VideosClient.tsx src/app/api/videos/upload/
```

### 3. 提交

```bash
git commit -m "fix: 上传代理、默认语言 ZH、ZH/EN 切换刷新视频列表"
```

### 4. 推送到 GitHub

```bash
git push origin main
```

### 5. 完整命令序列（PowerShell）

```powershell
cd e:\my-video-site
git add .
git status
git commit -m "fix: 上传代理、默认语言 ZH、ZH/EN 切换刷新视频列表"
git push origin main
```

### 首次推送或需配置远程仓库时

```bash
# 查看远程
git remote -v

# 如未配置 origin：
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 首次推送 main 分支并建立上游
git push -u origin main
```

### 推送后

- Netlify 若已绑定该 GitHub 仓库，会自动触发重新部署。
- 部署完成后可到线上地址验证：https://animated-mooncake-b15d09.netlify.app
