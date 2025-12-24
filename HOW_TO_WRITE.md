# ✍️ Meol-blog 写作指南 (IDE 模式)

本文档介绍如何在 IDE (VS Code / JetBrains 等) 中直接编写博客文章，并利用自动化脚本同步到网站列表。

---

## 🚀 快速开始

### 1. 创建文章目录
在 `public/blogs/` 目录下创建一个新文件夹。文件夹的名字就是文章在浏览器地址栏中的路径 (Slug)。
> 例如：`public/blogs/my-new-article`

### 2. 准备必要文件
在新建的文件夹内，必须包含以下两个文件：

#### ① `config.json` (文章元数据)
复制并修改以下模板：
```json
{
  "title": "文章标题",
  "date": "2025-12-24",
  "summary": "文章简短摘要...",
  "tags": ["标签1", "标签2"],
  "category": "分类名称",
  "cover": "/images/your-cover.png",
  "hidden": false
}
```

#### ② `index.md` (文章正文)
直接使用 Markdown 编写你的内容。支持：
- 代码高亮
- 图片插入（建议将图片放在该文章文件夹下，并在 Markdown 中引用）
- 数学公式等

### 3. 同步索引 (最关键)
每当你**新增文章**、**修改标题/日期**或**删除文章**后，必须在终端运行同步脚本，否则网页列表不会更新：

```bash
npm run sync-blogs
# 或者使用 pnpm
pnpm sync-blogs
```

---

## 📸 关于图片
如果你在文章中需要插入图片，推荐做法：
1. 将图片放入文章同级目录，例如：`public/blogs/my-new-article/photo.jpg`。
2. 在 `index.md` 中引用：`![描述](/blogs/my-new-article/photo.jpg)`。

---

## 🛠 常用命令
- `npm run dev`: 启动本地预览（访问 `http://localhost:2025`）。
- `npm run sync-blogs`: 同步博客索引。
- `npm run build`: 构建发布版本。
