const { MISSIONS, TRACKS, CARS, MODES, EVENTS } = require('./missions');

function defaultProgress(){
  const missions={};
  MISSIONS.forEach(m=>missions[m.id]={progress:0,done:false,claimed:false});
  return {
    coins:1200,bestDistance:0,bestSpeed:0,totalRuns:0,totalNitro:0,
    selectedCar:0,unlockedCars:[0,1],unlockedTracks:['city'],
    trackRunHistory:[],missions
  };
}

function applyRunResult(progress,r){
  const p=progress||defaultProgress();
  const rewards={coins:0,newlyUnlockedTracks:[],newlyUnlockedCars:[],completedMissions:[],eventBonus:0};
  p.totalRuns++;
  p.totalNitro+=r.nitroCollected||0;
  p.bestDistance=Math.max(p.bestDistance,r.distance||0);
  p.bestSpeed=Math.max(p.bestSpeed,r.topSpeed||0);
  if(r.track&&!p.trackRunHistory.includes(r.track))p.trackRunHistory.push(r.track);

  const mode=MODES.find(x=>x.id===r.mode)||MODES[0];
  let runCoins=Math.floor((r.distance||0)/10)+(r.nitroCollected||0)*5;
  runCoins=Math.floor(runCoins*(mode.reward||1));
  if(r.event){
    const ev=EVENTS.find(x=>x.id===r.event);
    if(ev){runCoins+=ev.bonus;rewards.eventBonus=ev.bonus;}
  }
  p.coins+=runCoins;
  rewards.coins+=runCoins;

  MISSIONS.forEach(m=>{
    const s=p.missions[m.id]||{progress:0,done:false,claimed:false};
    // Old saves from the previous auto-reward system already received their
    // mission reward. Preserve that state rather than paying twice.
    if(s.claimed===undefined && s.done) s.claimed=true;
    if(s.done){p.missions[m.id]=s;return;}

    let cur=s.progress;
    if(m.type==='speed')cur=p.bestSpeed;
    else if(m.type==='distance')cur=p.bestDistance;
    else if(m.type==='nitro')cur=p.totalNitro;
    else if(m.type==='runs')cur=p.totalRuns;
    else if(m.type==='track')cur=p.trackRunHistory.includes(m.target)?m.target:cur;
    else if(m.type==='event')cur=(r.event===m.target)?m.target:cur;

    s.progress=cur;
    const reached=m.type==='track'||m.type==='event'?cur===m.target:cur>=m.target;
    if(reached&&!s.done){
      s.done=true;
      s.claimed=false;
      rewards.completedMissions.push(m.id);
    }
    p.missions[m.id]=s;
  });

  TRACKS.forEach(t=>{
    if(p.unlockedTracks.includes(t.id))return;
    if(t.unlock?.type==='distance'&&p.bestDistance>=t.unlock.target){
      p.unlockedTracks.push(t.id);
      rewards.newlyUnlockedTracks.push(t.id);
    }
  });

  CARS.forEach(c=>{
    if(!c.unlock&&!p.unlockedCars.includes(c.id)){
      p.unlockedCars.push(c.id);
      rewards.newlyUnlockedCars.push(c.id);
    }
  });

  return{progress:p,rewards};
}

module.exports={defaultProgress,applyRunResult};
