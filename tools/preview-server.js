const { createServer } = require('node:http');
const { createReadStream, existsSync } = require('node:fs');
const { extname, join, normalize } = require('node:path');

const port = Number(process.env.PORT || 4200);
const root = join(__dirname, '..', 'dist', 'women-fashion-ecommerce', 'browser');

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json'
};

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://localhost:${port}`);
  const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, cleanPath === '/' ? 'index.html' : cleanPath);

  if (!existsSync(filePath) || cleanPath.includes('..')) {
    filePath = join(root, 'index.html');
  }

  response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream');
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Angular preview running at http://127.0.0.1:${port}/`);
});
