function norm(s){ return (s||'').toString().trim(); }

function getFormPayload(form){
  const fd = new FormData(form);
  const attemptsRaw = fd.get('attempts');
  const attempts = attemptsRaw === '' ? null : Number(attemptsRaw);

  return {
    bounty_name: norm(fd.get('bounty_name')),
    player: norm(fd.get('player')),
    prize: Number(fd.get('prize') || 0),
    attempts,
    conditions: norm(fd.get('conditions'))
  };
}

function validate(payload){
  if(!payload.bounty_name || !payload.player || !payload.conditions){
    return 'Please fill in bounty name, player, and conditions.';
  }
  if(!Number.isFinite(payload.prize) || payload.prize < 0){
    return 'Prize must be a valid non-negative number.';
  }
  if(payload.attempts !== null && (!Number.isFinite(payload.attempts) || payload.attempts < 0)){
    return 'Attempts must be blank or a valid non-negative number.';
  }
  return '';
}

(async function init(){
  const form = document.getElementById('adminForm');
  const status = document.getElementById('adminStatus');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const payload = getFormPayload(form);
    const error = validate(payload);
    if(error){
      status.textContent = error;
      return;
    }

    status.textContent = 'Saving...';
    try {
      const res = await fetch('/api/bounties', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if(!res.ok){
        status.textContent = data.error || 'Could not save completion.';
        return;
      }

      form.reset();
      status.textContent = `Saved! Total completions: ${data.total}.`;
    } catch (err){
      console.error(err);
      status.textContent = 'Request failed. Make sure backend server is running.';
    }
  });
})();
