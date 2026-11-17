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
├── .nojekyll           关闭 Jekyll，保证下划线等文件正常发布
├── cee/                高考数学题库（index.html、data.js、img/、原卷 PDF）
├── cet46/              词屿 CET 4/6（index.html、app.js、data.js、styles.css）
├── clock/              番茄钟（index.html → pomodoro.html，图片与音频）
└── law/                国家法律索引（index.html、library.html、assets/、data/、laws/）
```

所有板块都只使用相对路径，因此既可以挂在主站的子路径下，也可以整个目录搬到独立仓库的根目录使用。

## 本地预览

```bash
python -m http.server 8899
# 打开 http://127.0.0.1:8899/
```

## 关于子域名

GitHub Pages 一个仓库只能绑定一个自定义域名（这里是 `house-tool.top`），
因此 `gktong / foursix / pomo / law` 不能直接由同一个仓库提供。可选方案：

1. **域名解析处做 URL 转发（推荐，零维护）**
   在域名服务商把 `gktong` 等主机记录设为「显性 URL 转发」，目标分别填
   `https://house-tool.top/cee/`、`/cet46/`、`/clock/`、`/law/`。
2. **拆分为多个仓库**
   每个板块单独建一个仓库（内容为本目录下对应子文件夹），各自在 Pages 里绑定
   子域名，DNS 添加 `CNAME` 记录指向 `house2008.github.io`。

## 更新站点

```bash
git add -A
git commit -m "update"
git push
```

推送后 GitHub Actions / Pages 会自动重新发布，通常 1 分钟内生效。
