const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'bounties.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, code, body, type='text/plain; charset=utf-8'){
  res.writeHead(code, { 'Content-Type': type });
  res.end(body);
}

async function parseJsonBody(req){
  const chunks = [];
  for await (const chunk of req){
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if(!raw) return {};
  return JSON.parse(raw);
}

function validateRow(row){
  const requiredText = ['bounty_name', 'player', 'conditions'];
  for(const key of requiredText){
    if(typeof row[key] !== 'string' || row[key].trim() === ''){
      return `${key} is required`;
    }
  }
  if(typeof row.prize !== 'number' || !Number.isFinite(row.prize) || row.prize < 0){
    return 'prize must be a non-negative number';
  }
  if(row.attempts !== null && row.attempts !== undefined){
    if(typeof row.attempts !== 'number' || !Number.isFinite(row.attempts) || row.attempts < 0){
      return 'attempts must be null or a non-negative number';
    }
  }
  return '';
}

async function appendBounty(row){
  const current = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  if(!Array.isArray(current)) throw new Error('data/bounties.json is not an array');
  current.unshift(row);
  await fs.writeFile(DATA_FILE, JSON.stringify(current, null, 2) + '\n', 'utf8');
  return current.length;
}

function safePath(urlPath){
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^\/+/, '');
  const target = path.join(ROOT, normalized);
  if(!target.startsWith(ROOT)) return '';
  return target;
}

const server = http.createServer(async (req, res)=>{
  try {
    if(req.method === 'POST' && req.url === '/bounties'){
      const row = await parseJsonBody(req);
      const err = validateRow(row);
      if(err){
        return send(res, 400, JSON.stringify({ error: err }), MIME['.json']);
      }
      const total = await appendBounty({
        bounty_name: row.bounty_name.trim(),
        player: row.player.trim(),
        prize: Number(row.prize),
        attempts: row.attempts === undefined ? null : row.attempts,
        conditions: row.conditions.trim()
      });
      return send(res, 200, JSON.stringify({ ok:true, total }), MIME['.json']);
    }

    if(req.method !== 'GET' && req.method !== 'HEAD'){
      return send(res, 405, 'Method Not Allowed');
    }

    let requestPath = req.url || '/';
    if(requestPath === '/') requestPath = '/index.html';
    if(requestPath === '/admin') requestPath = '/admin.html';

    const filePath = safePath(requestPath);
    if(!filePath) return send(res, 400, 'Bad Request');

    let content;
    try {
      content = await fs.readFile(filePath);
    } catch {
      return send(res, 404, 'Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if(req.method === 'HEAD') return res.end();
    res.end(content);
  } catch (err){
    console.error(err);
    send(res, 500, JSON.stringify({ error:'Internal Server Error' }), MIME['.json']);
  }
});

server.listen(PORT, HOST, ()=>{
  console.log(`Server running on http://localhost:${PORT}`);
});
