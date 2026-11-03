const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const distPath = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let decodedUrl = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(distPath, decodedUrl === '/' ? 'index.html' : decodedUrl);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(5185, () => {
  console.log('Serving on 5185');
  const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
  const outPath = path.resolve('.ui-checks', 'shot-footer-real.png');
  // Use --virtual-time-budget to let images load, and scroll down
  const cmd = `${chromePath} --headless --disable-gpu --virtual-time-budget=4000 --screenshot="${outPath}" --window-size=1280,2400 "http://localhost:5185/"`;
  exec(cmd, (err) => {
    if (err) console.error(err);
    else console.log('Screenshot captured:', outPath);
    server.close();
    process.exit(0);
  });
});
