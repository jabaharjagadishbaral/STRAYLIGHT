// STRAYLIGHT // fast arcade synthwave soundtrack
const MUSIC = (() => {
  let ctx = null, master = null, timer = null, step = 0, enabled = false;
  const tempo = 138;
  const stepMs = 60000 / tempo / 2;
  const roots = [55,55,65.41,73.42,82.41,73.42,65.41,49];
  const arp = [0,12,19,24,19,12,7,12];

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.10;
    master.connect(ctx.destination);
  }

  function tone(freq, duration, type='sawtooth', volume=0.05, when=ctx.currentTime, cutoff=1800) {
    const o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    o.type=type; o.frequency.setValueAtTime(freq,when);
    f.type='lowpass'; f.frequency.setValueAtTime(cutoff,when); f.Q.value=1.2;
    g.gain.setValueAtTime(0.0001,when);
    g.gain.exponentialRampToValueAtTime(volume,when+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,when+duration);
    o.connect(f).connect(g).connect(master); o.start(when); o.stop(when+duration+0.02);
  }

  function kick(when) {
    const o=ctx.createOscillator(),g=ctx.createGain(); o.type='sine';
    o.frequency.setValueAtTime(150,when); o.frequency.exponentialRampToValueAtTime(42,when+0.13);
    g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(.32,when+.004); g.gain.exponentialRampToValueAtTime(.0001,when+.17);
    o.connect(g).connect(master); o.start(when); o.stop(when+.19);
  }
  function snare(when) {
    const b=ctx.createBuffer(1,ctx.sampleRate*.10,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.0);
    const s=ctx.createBufferSource(),g=ctx.createGain(); s.buffer=b; g.gain.setValueAtTime(.12,when); g.gain.exponentialRampToValueAtTime(.0001,when+.09);
    s.connect(g).connect(master); s.start(when);
  }
  function hat(when,vol=.035) {
    const b=ctx.createBuffer(1,ctx.sampleRate*.025,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
    const s=ctx.createBufferSource(),g=ctx.createGain(); s.buffer=b; g.gain.value=vol; s.connect(g).connect(master); s.start(when);
  }

  function tick() {
    if(!enabled || !ctx) return;
    const now=ctx.currentTime+.015, s=step%32, bar=Math.floor(step/32), root=roots[bar%roots.length];
    if(s%4===0) kick(now);
    if(s===4 || s===12 || s===20 || s===28) snare(now);
    hat(now, s%2 ? .025 : .04);
    if(s%2===0) tone(root, .16, 'sawtooth', .030, now, 900);
    if(s%4===1) tone(root*2*Math.pow(2,arp[(s>>1)%arp.length]/12), .11, 'square', .018, now, 2600);
    if(s===0 || s===8 || s===16 || s===24) tone(root/2,.30,'triangle',.045,now,700);
    step++;
    timer=setTimeout(tick,stepMs);
  }
  async function toggle(){
    init(); await ctx.resume(); enabled=!enabled;
    if(enabled) tick(); else if(timer){clearTimeout(timer);timer=null;}
    updateUI(); return enabled;
  }
  function updateUI(){
    const el=document.getElementById('music-control'),label=document.getElementById('music-label');
    if(!el||!label)return; el.classList.toggle('on',enabled); label.textContent=enabled?'MUSIC ON':'MUSIC OFF';
  }
  function autoStart(){ if(enabled)return; init(); ctx.resume().then(()=>{enabled=true;step=0;tick();updateUI();}).catch(()=>{}); }
  function setup(){
    const b=document.getElementById('music-control'); if(b)b.addEventListener('click',e=>{e.stopPropagation();toggle();});
    window.addEventListener('pointerdown',function once(e){if(e.target?.closest?.('#music-control'))return;autoStart();},{once:true});
  }
  return {setup,toggle,autoStart};
})();
window.addEventListener('DOMContentLoaded',()=>MUSIC.setup());
