# 影迹 · CineLog 免费部署与多端云同步指南

只需 **5 分钟**，即可免费把「影迹」部署到公网，并在 **电脑 + 手机** 之间实现自动实时同步。

---

## 第一步：免费部署网页（三选一，推荐 GitHub Pages）

项目为纯静态网页（`index.html` + `styles.css` + `*.js`），无需任何服务器费用。

### 方式 A：GitHub Pages（最省心）
1. 在 GitHub 新建一个仓库（例如 `cinelog`），把本目录里的文件全部上传进去：
   - `index.html`
   - `styles.css`
   - `posters.js`
   - `data.js`
   - `sync.js`
   - `app.js`
2. 进入仓库的 **Settings → Pages**。
3. 在 **Build and deployment → Source** 选择 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，点击 **Save**。
4. 等待 1 分钟，即可获得永久免费网址：`https://你的用户名.github.io/cinelog/`。

### 方式 B：Cloudflare Pages / Vercel（国内访问更快）
1. 将代码推送到 GitHub 仓库。
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/) 或 [Vercel](https://vercel.com/)，导入该仓库。
3. 构建命令留空，输出目录填 `.`（根目录），直接点击 **Deploy** 即可获得 HTTPS 网址。

---

## 第二步：开启云端自动同步（二选一）

> **安全说明**：你的 Token / 密钥**只会保存在你自己的浏览器本地**，不会写入代码仓库，公开部署也非常安全。

### 方案 1：GitHub Gist（强烈推荐 · 永久免费、不会休眠）
1. 登录 GitHub，进入 **Settings → Developer settings → Personal access tokens → Tokens (classic)**。
2. 点击 **Generate new token (classic)**：
   - Note 填 `CineLog Sync`
   - Expiration 建议选 `No expiration`
   - 权限**只需勾选 `gist`** 这一项
3. 点击生成，复制 `ghp_...` 开头的 Token。
4. 打开你部署好的「影迹」网页，点击顶部右上角的 **「未同步 / 云同步」** 按钮：
   - 选择 **GitHub Gist**
   - 粘贴 Token（`Gist ID` 首次留空）
   - 点击 **「保存配置并同步」**
   - 程序会自动在你的 GitHub 账号下创建一个 **私密 Gist** 并上传数据，同时自动填好 `Gist ID`！

### 方案 2：Supabase（云端 Postgres 数据库）
1. 在 [Supabase](https://supabase.com/) 免费创建一个 Project。
2. 进入左侧 **SQL Editor**，运行以下建表 SQL（也可在网页弹窗里一键复制）：
   ```sql
   create table if not exists public.cinelog_store (
     id text primary key,
     payload jsonb not null,
     updated_at timestamptz default now()
   );

   alter table public.cinelog_store enable row level security;

   create policy "Allow public access for personal cinelog"
     on public.cinelog_store
     for all
     using (true)
     with check (true);
   ```
3. 进入 **Project Settings → API**，复制 **Project URL** 和 **anon public** key，填入网页的「云端同步设置 → Supabase 数据库」并保存同步。

---

## 第三步：手机端 10 秒一键绑定

不需要在手机上手动敲长密钥：
1. 在电脑端打开「云端多端同步」弹窗，点击 **「复制本机口令」**（会复制一串 `CINELOG1:...` 口令）。
2. 通过微信文件传输助手等发给自己的手机。
3. 手机浏览器打开同一个网址 → 点击顶部云同步圆点 → 粘贴口令 → 点击 **「一键导入」**。
4. 立刻自动拉取全部片单和海报！以后任意一端新增/修改/删除，另一端打开或切回网页都会自动同步。
