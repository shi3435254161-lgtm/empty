import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8765);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.hdr': 'application/octet-stream',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

createServer(async (request, response) => {
    try {
        const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
        const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
        let filePath = path.resolve(root, relativePath);
        if (filePath !== root && !filePath.startsWith(root + path.sep)) {
            response.writeHead(403).end('Forbidden');
            return;
        }
        if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, 'index.html');
        response.writeHead(200, {
            'Cache-Control': 'no-cache',
            'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
        });
        createReadStream(filePath).pipe(response);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Kitchen Designer: http://127.0.0.1:${port}/`);
});
