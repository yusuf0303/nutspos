const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

copyDir('public', '.next/standalone/public');
copyDir('.next/static', '.next/standalone/.next/static');
// Prisma schema faylini nusxalash (Query engine uni shu yerdan qidiradi)
copyDir('prisma', '.next/standalone/prisma');

// DATABASE_URL ni standalone .env dan olib tashlaymiz.
// Chunki main.js uni dinamik ravishda to'g'ri mutlaq yo'l bilan o'rnatadi.
// Aks holda, nisbiy "file:./dev.db" yo'li main.js ni ustini yopib, xato chiqaradi.
const standaloneEnvPath = path.join('.next', 'standalone', '.env');
if (fs.existsSync(standaloneEnvPath)) {
  let envContent = fs.readFileSync(standaloneEnvPath, 'utf8');
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('DATABASE_URL'))
    .join('\n');
  fs.writeFileSync(standaloneEnvPath, envContent, 'utf8');
  console.log('✅ DATABASE_URL standalone .env dan olib tashlandi.');
}

// Next.js standalone server.js da qolib ketadigan absolut yo'lni tozalaymiz
// Aks holda Server Action lar ishlashda "Failed to find Server Action" xatosi beradi
const serverJsPath = path.join('.next', 'standalone', 'server.js');
if (fs.existsSync(serverJsPath)) {
  let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
  // "outputFileTracingRoot":"C:\\Users\\...\\nutspos" qismini o'chiramiz
  serverJsContent = serverJsContent.replace(/"outputFileTracingRoot":"[^"]+",?/g, '');
  fs.writeFileSync(serverJsPath, serverJsContent, 'utf8');
  console.log('✅ server.js dan absolut outputFileTracingRoot o\'chirildi.');
}

console.log('✅ copy-standalone.js muvaffaqiyatli yakunlandi.');
