const fs = require('fs/promises');
const path = require('path');

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_KEY = 'aoe2:bounties:completed';

async function readSeedRows(){
  const file = path.join(process.cwd(), 'data', 'bounties.json');
  const raw = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function json(res, status, payload){
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function validateRow(row){
  const requiredText = ['bounty_name', 'player', 'conditions'];
  for(const key of requiredText){
    if(typeof row[key] !== 'string' || row[key].trim() === '') return `${key} is required`;
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

async function kvRequest(commandPath){
  const res = await fetch(`${KV_URL}${commandPath}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if(!res.ok) throw new Error(`KV request failed: ${res.status}`);
  return await res.json();
}

async function getKvRows(){
  if(!KV_URL || !KV_TOKEN) return [];
  try {
    const data = await kvRequest(`/lrange/${encodeURIComponent(KV_KEY)}/0/-1`);
    const list = Array.isArray(data.result) ? data.result : [];
    return list.map((s)=>JSON.parse(s)).filter(Boolean);
  } catch {
    return [];
  }
}

async function addKvRow(row){
  if(!KV_URL || !KV_TOKEN){
    throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN');
  }
  const encoded = encodeURIComponent(JSON.stringify(row));
  await kvRequest(`/lpush/${encodeURIComponent(KV_KEY)}/${encoded}`);
}

async function parseBody(req){
  if(req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req){ chunks.push(chunk); }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res){
  try {
    if(req.method === 'GET'){
      const seedRows = await readSeedRows();
      const kvRows = await getKvRows();
      return json(res, 200, [...kvRows, ...seedRows]);
    }

    if(req.method === 'POST'){
      const body = await parseBody(req);
      const row = {
        bounty_name: String(body.bounty_name || '').trim(),
        player: String(body.player || '').trim(),
        prize: Number(body.prize),
        attempts: body.attempts === '' || body.attempts === undefined ? null : Number(body.attempts),
        conditions: String(body.conditions || '').trim()
      };

      const err = validateRow(row);
      if(err) return json(res, 400, { error: err });

      try {
        await addKvRow(row);
      } catch (kvErr){
        return json(res, 500, { error: `${kvErr.message}. Configure Vercel KV for persistent writes.` });
      }

      const kvRows = await getKvRows();
      const seedRows = await readSeedRows();
      return json(res, 200, { ok: true, total: kvRows.length + seedRows.length });
    }

    return json(res, 405, { error: 'Method Not Allowed' });
  } catch (err){
    return json(res, 500, { error: 'Internal Server Error' });
  }
};
