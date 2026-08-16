const GARAGE_UI = (() => {
  let catalog=null,progress=null,selectedCar=0,selectedTrack='city',selectedMode='endless',selectedEvent=null;
  const $=id=>document.getElementById(id);
  function unlockedCar(c){return progress ? progress.unlockedCars.includes(c.id) : c.id<2;}
  function unlockedTrack(t){return progress ? progress.unlockedTracks.includes(t.id) : t.id==='city';}
  function statBars(stats){return ['speed','accel','handling','nitro'].map(k=>`<div class="stat"><span>${k}</span><i><b style="width:${stats[k]*10}%"></b></i></div>`).join('');}
  function renderCars(){
    const wrap=$('car-select');wrap.innerHTML='';
    catalog.cars.forEach(c=>{
      const v=CATALOG.carVisual(c.id),open=unlockedCar(c),card=document.createElement('button');card.type='button';
      card.className='garage-car-card'+(c.id===selectedCar?' active ':'')+(open?'':' locked');
      const hex='#'+v.body.toString(16).padStart(6,'0');
      card.innerHTML=`<div class="car-art"><div class="mini-car" style="--car:${hex};--glow:#${v.glow.toString(16).padStart(6,'0')}"><span></span></div></div><div class="car-copy"><div class="car-brand">${c.brand}</div><div class="car-name">${c.name}</div><div class="car-class">${c.class} · ${c.tag}</div>${statBars(c.stats)}${open?'<div class="lockline">OWNED · SELECT TO DRIVE</div>':'<div class="lockline">BUY · '+(c.unlock?.target||'?')+' CR</div>'}</div>`;
      card.addEventListener('click',async()=>{
        if(open){selectedCar=c.id;renderCars();if(API.isLoggedIn())API.saveSelectedCar(c.id).catch(()=>{});updateBadge();return;}
        if(!API.isLoggedIn()){alert('Sign in to purchase cars.');return;}
        try{const r=await API.buyCar(c.id);progress=r.progress;selectedCar=c.id;updateCoins();renderCars();updateBadge();}catch(e){alert(e.message||'Not enough credits.');}
      });wrap.appendChild(card);
    });updateBadge();
  }
  function updateBadge(){const c=catalog?.cars?.find(x=>x.id===selectedCar);if(c){$('car-badge').textContent=c.brand+' · '+c.name;$('car-badge').style.display='block';}}
  function renderTracks(){const wrap=$('track-select');wrap.innerHTML='';catalog.tracks.forEach(t=>{const v=CATALOG.trackVisual(t.id),open=unlockedTrack(t),card=document.createElement('button');card.type='button';card.className='route-card'+(t.id===selectedTrack?' active':'')+(open?'':' locked');card.innerHTML=`<div class="route-thumb ${t.id}"><span>${t.id==='storm'?'RAIN':t.id==='mountain'?'ALPINE':t.id==='desert'?'DUST':'CITY'}</span></div><div><strong>${t.name}</strong><small>${t.subtitle||v.weather.toUpperCase()}</small>${open?'':'<em>LOCKED · '+(t.unlock?.target||0)+' M</em>'}</div>`;card.onclick=()=>{if(!open)return;selectedTrack=t.id;renderTracks();};wrap.appendChild(card);});}
  function renderModes(){const wrap=$('mode-select');wrap.innerHTML='';catalog.modes.forEach(m=>{const card=document.createElement('button');card.type='button';card.className='mode-card'+(m.id===selectedMode?' active':'');card.innerHTML=`<span class="mode-number">${String(catalog.modes.indexOf(m)+1).padStart(2,'0')}</span><strong>${m.name}</strong><small>${m.desc}</small><b>x${m.reward.toFixed(2)}</b>`;card.onclick=()=>{selectedMode=m.id;renderModes();updateLaunch();};wrap.appendChild(card);});}
  function renderEvents(){const wrap=$('event-select');wrap.innerHTML='';catalog.events.forEach(e=>{const card=document.createElement('button');card.type='button';card.className='event-card'+(e.id===selectedEvent?' active':'');card.innerHTML=`<div class="event-date">LIVE EVENT</div><strong>${e.name}</strong><small>${e.desc}</small><b>+${e.bonus} CR</b>`;card.onclick=()=>{selectedEvent=e.id;const ev=catalog.events.find(x=>x.id===selectedEvent);if(ev){selectedTrack=ev.track;selectedMode=ev.mode;renderTracks();renderModes();}renderEvents();updateLaunch();};wrap.appendChild(card);});}
  function renderMissions(){
    const wrap=$('mission-list');wrap.innerHTML='';
    catalog.missions.forEach(m=>{
      const s=progress?.missions?.[m.id]||{progress:0,done:false,claimed:false};
      const pct=m.type==='track'||m.type==='event'?(s.done?100:0):Math.min(100,(Number(s.progress)||0)/m.target*100);
      const row=document.createElement('div');
      row.className='mission-row2'+(s.done?' done':'');
      const status=s.done&&s.claimed?'CLAIMED':(s.done?'REWARD READY':'+'+m.reward+' CR');
      row.innerHTML=`<div><strong>${m.name}</strong><small>${m.desc}</small><i><b style="width:${pct}%"></b></i></div><div class="mission-action"><span>${status}</span>${s.done&&!s.claimed&&API.isLoggedIn()?`<button type="button" class="claim-btn" data-mission="${m.id}">CLAIM +${m.reward} CR</button>`:''}</div>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('.claim-btn').forEach(btn=>{
      btn.addEventListener('click',async()=>{
        btn.disabled=true;
        try{
          const r=await API.claimMission(btn.dataset.mission);
          progress=r.progress; updateCoins(); renderMissions();
          const toast=document.createElement('div'); toast.className='mission-toast'; toast.textContent=`REWARD CLAIMED · +${r.reward} CR`;
          $('mission-toast-wrap').appendChild(toast); setTimeout(()=>toast.remove(),3000);
        }catch(e){btn.disabled=false;alert(e.message||'Could not claim reward');}
      });
    });
  }
  async function renderLeaderboard(){const wrap=$('leaderboard-list');wrap.innerHTML='<div class="empty">Loading rankings…</div>';try{const r=await API.getLeaderboard(selectedTrack);wrap.innerHTML=r.scores.length?r.scores.map((s,i)=>`<div class="rank-row"><b>${String(i+1).padStart(2,'0')}</b><span>${s.username}</span><strong>${s.distance} M</strong></div>`).join(''):'<div class="empty">No ranked runs yet.</div>';}catch(e){wrap.innerHTML='<div class="empty">Rankings unavailable.</div>';}}
  function updateCoins(){
    const value = Number(progress?.coins ?? 0);
    const hud = $('hud-coin-num');
    const wallet = $('garage-coin-num');
    if (hud) hud.textContent = value.toLocaleString();
    if (wallet) wallet.textContent = value.toLocaleString();
  }
  function updateLaunch(){const mode=catalog.modes.find(x=>x.id===selectedMode);$('launch-mode').textContent=mode?.name||'ENDLESS';$('launch-track').textContent=CATALOG.trackVisual(selectedTrack).name;}
  function switchPanel(name){document.querySelectorAll('.panel-tab').forEach(x=>x.classList.toggle('active',x.dataset.panel===name));document.querySelectorAll('.garage-panel').forEach(x=>x.classList.toggle('hidden',x.id!==name));if(name==='garage-leaderboard')renderLeaderboard();}
  async function init(){catalog=await CATALOG.load();progress=(await API.getProgress()).progress;if(progress){selectedCar=Number.isFinite(progress.selectedCar)?progress.selectedCar:0;}
    updateCoins();renderCars();renderTracks();renderModes();renderEvents();renderMissions();updateLaunch();document.querySelectorAll('.panel-tab').forEach(x=>x.onclick=()=>switchPanel(x.dataset.panel));document.querySelector('[data-panel="garage-car"]').click();}
  function applyRunUpdate(p){progress=p;updateCoins();renderCars();renderTracks();renderMissions();}
  function showMissionToasts(ids){if(!ids?.length)return;const wrap=$('mission-toast-wrap');ids.forEach((id,i)=>{const m=catalog.missions.find(x=>x.id===id);if(!m)return;const el=document.createElement('div');el.className='mission-toast';el.textContent=`MISSION COMPLETE · ${m.name} · REWARD READY · +${m.reward} CR`;wrap.appendChild(el);setTimeout(()=>el.remove(),3500+i*200);});}
  return {init,applyRunUpdate,showMissionToasts,getSelectedCar:()=>selectedCar,getSelectedTrack:()=>selectedTrack,getSelectedMode:()=>selectedMode,getSelectedEvent:()=>selectedEvent,getProgress:()=>progress};
})();
