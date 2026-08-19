const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function sendFile(res, filePath) {
  const extension = path.extname(filePath);
  const contentType = filePath.endsWith('chapter-world') ? 'text/html' : (mime[extension] || 'application/octet-stream');
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  const requestPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(requestPath).replace(/^([.][.][\\/])+/, '');
  const filePath = path.join(root, safePath === path.sep ? 'index.html' : safePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return sendFile(res, filePath);
  if (fs.existsSync(path.join(filePath, 'index.html'))) return sendFile(res, path.join(filePath, 'index.html'));
  return sendFile(res, path.join(root, 'index.html'));
}).listen(process.env.PORT || 4174, () => {
  console.log(`Chapter & Compass running at http://localhost:${process.env.PORT || 4174}`);
});