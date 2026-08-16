// STRAYLIGHT APEX // GRIDRUNNER - fast arcade racing soundtrack, WebAudio only
const MUSIC=(()=>{
  let ctx=null,master=null,drums=null,bassBus=null,lead=null,stabs=null,timer=null,step=0,enabled=false;
  const tempo=168, stepMs=60000/tempo/4;
  const roots=[55,65.41,73.42,61.74]; // A2 F2 D2 B1-ish progression
  const arp=[0,7,12,19,24,19,12,7, 0,7,14,19,24,19,14,7];
  const bass=[0,0,0,7,0,0,10,7, 0,0,7,12,0,10,7,0];
  function init(){
    if(ctx)return;
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=.095; master.connect(ctx.destination);
    drums=ctx.createGain(); drums.gain.value=.95; drums.connect(master);
    bassBus=ctx.createGain(); bassBus.gain.value=.72; bassBus.connect(master);
    lead=ctx.createGain(); lead.gain.value=.42; lead.connect(master);
    stabs=ctx.createGain(); stabs.gain.value=.30; stabs.connect(master);
  }
  function tone(freq,dur,type,vol,when,bus,cut=5000,detune=0){
    const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
    o.type=type; o.frequency.setValueAtTime(freq,when); o.detune.value=detune;
    f.type='lowpass'; f.frequency.setValueAtTime(cut,when); f.Q.value=.8;
    g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),when+.004);
    g.gain.exponentialRampToValueAtTime(.0001,when+dur);
    o.connect(f).connect(g).connect(bus); o.start(when); o.stop(when+dur+.03);
  }
  function kick(t){
    const o=ctx.createOscillator(),g=ctx.createGain(); o.type='sine';
    o.frequency.setValueAtTime(155,t); o.frequency.exponentialRampToValueAtTime(42,t+.13);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.48,t+.003); g.gain.exponentialRampToValueAtTime(.0001,t+.16);
    o.connect(g).connect(drums); o.start(t); o.stop(t+.18);
  }
  function clap(t){
    const b=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.4);
    const s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(); s.buffer=b; g.gain.value=.22; f.type='highpass'; f.frequency.value=900;
    s.connect(f).connect(g).connect(drums); s.start(t);
  }
  function hat(t,v){
    const b=ctx.createBuffer(1,ctx.sampleRate*.025,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
    const s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(); s.buffer=b; g.gain.value=v; f.type='highpass'; f.frequency.value=5000;
    s.connect(f).connect(g).connect(drums); s.start(t);
  }
  function riser(t){
    tone(440,.22,'sawtooth',.025,t,lead,7000); tone(554.37,.22,'sawtooth',.018,t,lead,7000,7);
  }
  function tick(){
    if(!enabled||!ctx)return;
    const now=ctx.currentTime+.012, s=step%32, bar=Math.floor(step/32), root=roots[bar%roots.length];
    // four-on-the-floor with extra pickup kicks
    if(s%4===0 || s===14 || s===30) kick(now);
    if(s===8 || s===24) clap(now);
    hat(now, s%2===0 ? .035 : .018); if(s%8===7) hat(now,.055);
    const bi=bass[s>>1];
    if(s%2===0) tone(root*Math.pow(2,bi/12),.18,'sawtooth',.052,now,bassBus,1050);
    if(s===6||s===14||s===22||s===30) tone(root/2,.28,'triangle',.045,now,bassBus,750);
    const n=arp[s>>1];
    if(s%2===0) tone(root*2*Math.pow(2,n/12),.11,'square',.024,now,lead,4200);
    if(s===0||s===8||s===16||s===24){
      tone(root*Math.pow(2,12/12),.18,'sawtooth',.035,now,stabs,2600,-5);
      tone(root*Math.pow(2,19/12),.18,'sawtooth',.028,now,stabs,2600,5);
    }
    if(s===28) riser(now);
    step++; timer=setTimeout(tick,stepMs);
  }
  async function toggle(){init(); await ctx.resume(); enabled=!enabled; if(enabled){step=0;tick();} else if(timer){clearTimeout(timer);timer=null;} ui(); return enabled;}
  function autoStart(){if(enabled)return; init(); ctx.resume().then(()=>{enabled=true;step=0;tick();ui();}).catch(()=>{});}
  function ui(){const e=document.getElementById('music-control'),l=document.getElementById('music-label'); if(e){e.classList.toggle('on',enabled);if(l)l.textContent=enabled?'GRIDRUNNER 168 BPM':'MUSIC OFF';}}
  function setup(){const b=document.getElementById('music-control');if(b)b.addEventListener('click',e=>{e.stopPropagation();toggle();});window.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#music-control'))return;autoStart();},{once:true});}
  return{setup,toggle,autoStart};
})();
window.addEventListener('DOMContentLoaded',()=>MUSIC.setup());
