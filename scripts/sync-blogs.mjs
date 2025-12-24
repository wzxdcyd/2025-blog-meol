import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.join(process.cwd(), 'public/blogs');
const INDEX_FILE = path.join(BLOGS_DIR, 'index.json');

async function sync() {
  console.log('正在同步博客索引...');
  
  const folders = fs.readdirSync(BLOGS_DIR).filter(file => {
    return fs.statSync(path.join(BLOGS_DIR, file)).isDirectory();
  });

  const blogIndex = folders.map(slug => {
    const configPath = path.join(BLOGS_DIR, slug, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return {
        slug,
        ...config
      };
    }
    return null;
  }).filter(Boolean);

  // 按日期降序排序
  blogIndex.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(INDEX_FILE, JSON.stringify(blogIndex, null, 2));
  console.log(`同步完成！共找到 ${blogIndex.length} 篇文章。`);
}

sync();
