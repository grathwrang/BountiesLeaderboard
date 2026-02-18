async function loadData(){
  const res = await fetch('data/bounties.json');
  if(!res.ok) throw new Error('Could not load data/bounties.json');
  return await res.json();
}

function norm(s){ return (s||'').toString().toLowerCase().trim(); }

function money(n){ return (Number(n||0)).toFixed(0); }

function attemptsFmt(v){
  if(v===null || v===undefined || v==='') return '(UNKNOWN)';
  const n = Number(v);
  return Number.isFinite(n) ? money(n) : '(UNKNOWN)';
}

function makeLeaderboard(rows){
  const byPlayer = new Map();
  for(const r of rows){
    const key = r.player;
    if(!byPlayer.has(key)){
      byPlayer.set(key, { player:key, completions:0, prize:0, uniqueSet:new Set() });
    }
    const p = byPlayer.get(key);
    p.completions += 1;
    p.prize += Number(r.prize||0);
    p.uniqueSet.add(r.bounty_name);
  }
  const out = [];
  for(const v of byPlayer.values()){
    out.push({ player:v.player, completions:v.completions, prize:v.prize, unique:v.uniqueSet.size });
  }
  return out;
}

function renderTable(tbody, rows, cols){
  tbody.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(const r of rows){
    const tr = document.createElement('tr');
    for(const c of cols){
      const td = document.createElement('td');
      if(c.className) td.className = c.className;
      td.textContent = c.fmt ? c.fmt(r[c.key], r) : (r[c.key] ?? '');
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

function sortRows(rows, key, dir){
  const d = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a,b)=>{
    const av = a[key], bv = b[key];
    const an = typeof av === 'number', bn = typeof bv === 'number';
    if(an && bn) return (av - bv)*d;
    return String(av ?? '').localeCompare(String(bv ?? ''), undefined, {numeric:true, sensitivity:'base'})*d;
  });
}

function applyFilters(allRows, q){
  const qq = norm(q);
  return allRows.filter(r=>{
    if(!qq) return true;
    const hay = norm(r.bounty_name + ' ' + r.conditions + ' ' + r.player);
    return hay.includes(qq);
  });
}

let state = {
  view:'leaderboard',
  q:'',
  lbSort:{key:'completions', dir:'desc'},
  cSort:{key:'bounty_name', dir:'asc'},
  allRows:[],
  filteredRows:[]
};

function setView(v){
  state.view = v;
  document.getElementById('leaderboardView').classList.toggle('hidden', v !== 'leaderboard');
  document.getElementById('completionsView').classList.toggle('hidden', v !== 'completions');
  document.getElementById('viewLeaderboard').classList.toggle('active', v === 'leaderboard');
  document.getElementById('viewCompletions').classList.toggle('active', v === 'completions');
  render();
}

function render(){
  state.filteredRows = applyFilters(state.allRows, state.q);

  const lb = makeLeaderboard(state.filteredRows);
  const lbSorted = sortRows(lb, state.lbSort.key, state.lbSort.dir);
  renderTable(
    document.querySelector('#leaderboardTable tbody'),
    lbSorted,
    [
      {key:'player'},
      {key:'completions', className:'num'},
      {key:'unique', className:'num'},
      {key:'prize', className:'num', fmt:(v)=>money(v)}
    ]
  );

  const compsSorted = sortRows(state.filteredRows, state.cSort.key, state.cSort.dir);
  renderTable(
    document.querySelector('#completionsTable tbody'),
    compsSorted,
    [
      {key:'bounty_name'},
      {key:'player'},
      {key:'prize', className:'num', fmt:(v)=>money(v)},
      {key:'attempts', className:'num', fmt:(v)=>attemptsFmt(v)},
      {key:'conditions'}
    ]
  );
}

function wireSort(tableId){
  const ths = document.querySelectorAll(`#${tableId} thead th`);
  ths.forEach(th=>{
    th.addEventListener('click', ()=>{
      const key = th.dataset.sort;
      if(!key) return;
      const target = tableId === 'leaderboardTable' ? 'lbSort' : 'cSort';
      if(state[target].key === key){
        state[target].dir = state[target].dir === 'asc' ? 'desc' : 'asc';
      } else {
        state[target].key = key;
        state[target].dir = (key === 'player' || key === 'bounty_name' || key === 'conditions') ? 'asc' : 'desc';
      }
      render();
    });
  });
}

(async function init(){
  const data = await loadData();
  state.allRows = data;

  const total = data.length;
  const players = new Set(data.map(r=>r.player)).size;
  const unknown = data.filter(r=>norm(r.player)==='unknown completion').length;
  const prizeTotal = data.reduce((s,r)=>s+Number(r.prize||0),0);
  document.getElementById('meta').textContent =
    `${total} completions • ${players} players • ${unknown} UNKNOWN • $${money(prizeTotal)} total prizes`;

  const q = document.getElementById('q');
  q.addEventListener('input', (e)=>{ state.q = e.target.value; render(); });

  document.getElementById('viewLeaderboard').addEventListener('click', ()=>setView('leaderboard'));
  document.getElementById('viewCompletions').addEventListener('click', ()=>setView('completions'));

  wireSort('leaderboardTable');
  wireSort('completionsTable');

  render();
})().catch(err=>{
  console.error(err);
  alert('Error loading data. Run the backend server (node server.js) and open http://localhost:8080.');
});
