const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if(file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('c:/GITHUB/crunedu/apps/web/src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  if (content.includes('@/lib/api')) {
    content = content.replace(/from ["']@\/lib\/api["']/g, 'from "@/lib/http-client"');
    fs.writeFileSync(f, content);
  }
});
