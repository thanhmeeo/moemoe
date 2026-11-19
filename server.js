// Server tĩnh nhỏ cho dự án Đập Chuột — chỉ dùng module có sẵn của Node.js.
// "/"              → chuyển sang /app/ (game gốc)
// "/app/..."       → app/
// "/app-poodle/..."→ app-poodle/ (bản Poodle Bão tuyết)
// "/design/...", "/docs/..." → design/, docs/
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const GOC = __dirname;
const THU_MUC_CHO_PHEP = new Set(['app', 'app-poodle', 'app-noel', 'design', 'docs']);
const TRANG_CHU = '/app/';

const KIEU = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

// Trả về { file } | { chuyen } | null
function phanGiai(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  if (p === '/') return { chuyen: TRANG_CHU };
  const tang = p.split('/')[1];
  if (!THU_MUC_CHO_PHEP.has(tang)) return null;
  if (p === `/${tang}`) return { chuyen: `/${tang}/` };   // để đường dẫn tương đối (../design) đúng
  if (p.endsWith('/')) p += 'index.html';
  const goc = path.join(GOC, tang);
  const day = path.normalize(path.join(GOC, p));
  if (!day.startsWith(goc + path.sep)) return null;      // chặn ../ thoát khỏi thư mục
  return { file: day };
}

const server = http.createServer((req, res) => {
  const batDau = Date.now();
  const ghiLog = (code) => console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${code} ${Date.now() - batDau}ms`);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return ghiLog(405);
  }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    return;
  }

  const kq = phanGiai(req.url);
  if (!kq) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không tìm thấy');
    return ghiLog(404);
  }
  if (kq.chuyen) {
    res.writeHead(302, { Location: kq.chuyen }).end();
    return ghiLog(302);
  }

  fs.stat(kq.file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không tìm thấy');
      return ghiLog(404);
    }
    res.writeHead(200, {
      'Content-Type': KIEU[path.extname(kq.file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') { res.end(); return ghiLog(200); }
    fs.createReadStream(kq.file).pipe(res);
    ghiLog(200);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Đập Chuột đang chạy: http://localhost:${PORT}  (bản Poodle: /app-poodle/)`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { console.log(`Nhận ${sig}, dừng server`); server.close(() => process.exit(0)); });
}
