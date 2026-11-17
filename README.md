# house-tool

四个纯前端小工具的集合，部署在 GitHub Pages 上。

主站：<https://house-tool.top>

| 板块 | 路径 | 说明 | 计划子域名 |
| --- | --- | --- | --- |
| 高考数学题库 | `/cee/` | 1977–2026 共 643 套高考数学真题，可筛选、速览、跳转原卷 PDF | `gktong.house-tool.top` |
| 词屿 · CET 4/6 | `/cet46/` | 四六级单词记忆：闪卡、拼写、测验、间隔复习 | `foursix.house-tool.top` |
| 番茄钟 | `/clock/` | 专注 / 休息计时器，含壁纸、背景音乐与 AI 对话面板 | `pomo.house-tool.top` |
| 国家法律索引 | `/law/` | 法律索引 + 法律文献库，支持标题与全文检索 | `law.house-tool.top` |

## 目录结构

```
/
├── index.html          入口页（四个板块的卡片导航）
├── 404.html
├── CNAME               house-tool.top
├── .nojekyll           关闭 Jekyll
├── .github/workflows/pages.yml   部署流水线
├── cee/                高考数学题库（index.html、data.js、img/、原卷 PDF）
├── cet46/              词屿 CET 4/6（index.html、app.js、data.js、styles.css）
├── clock/              番茄钟（index.html → pomodoro.html，图片与音频）
└── law/                国家法律索引（index.html、library.html、assets/、data/、laws/）
```

所有板块只使用相对路径，因此既可以挂在主站的子路径下，也可以整个目录搬到独立仓库的根目录使用。

## 部署方式

`main` 分支每次推送都会触发 `.github/workflows/pages.yml`：
checkout → 打包整个目录为 Pages artifact → 发布。约 3–5 分钟生效。

> 没有使用 Pages 的 legacy 构建，因为该构建在 375 MB / 1.7 万个文件时排队过久，
> 且早期版本因法律文件名超过 255 字节在 Linux 上检出失败。

## 本地预览

```bash
python -m http.server 8899
# 打开 http://127.0.0.1:8899/
```

## 关于子域名

GitHub Pages 一个仓库只能绑定一个自定义域名（这里是 `house-tool.top`），
`gktong / foursix / pomo / law` 无法由同一个仓库直接提供。
DNSPod 的 URL 转发又要求「转发后的域名已备案」（GitHub Pages 无法备案）且免费版只有 2 条。
可行方案：

1. **4 个极小的跳转仓库**：每个仓库只放一个 `index.html`（跳转到 `https://house-tool.top/cee/` 等）
   + `CNAME` 文件（`gktong.house-tool.top` 等），Pages 绑定子域名，DNS 加
   `CNAME gktong → house2008.github.io`。
2. **把 DNS 交给 Cloudflare**：使用免费 Redirect Rules 做 301，不增加仓库。

## 更新站点

```bash
git add -A
git commit -m "update"
git push
```
