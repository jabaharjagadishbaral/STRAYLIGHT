// STRAYLIGHT V3 catalog: real-world inspired names with original game geometry.
const MISSIONS = [
  { id:'speed_1', name:'Speed Demon', desc:'Hit 220 km/h in one run', type:'speed', target:220, reward:150 },
  { id:'speed_2', name:'Sound Barrier', desc:'Hit 300 km/h in one run', type:'speed', target:300, reward:300 },
  { id:'distance_1', name:'Road Warrior', desc:'Survive 1500 m in one run', type:'distance', target:1500, reward:150 },
  { id:'distance_2', name:'Marathon', desc:'Survive 4000 m in one run', type:'distance', target:4000, reward:400 },
  { id:'nitro_1', name:'Fuel Junkie', desc:'Collect 10 nitro pickups', type:'nitro', target:10, reward:100 },
  { id:'nitro_2', name:'Nitro Addict', desc:'Collect 40 nitro pickups', type:'nitro', target:40, reward:250 },
  { id:'runs_1', name:'Regular', desc:'Complete 5 runs', type:'runs', target:5, reward:100 },
  { id:'runs_2', name:'Night Shift', desc:'Complete 20 runs', type:'runs', target:20, reward:350 },
  { id:'track_desert', name:'Dune Runner', desc:'Complete a run on Sunset Desert', type:'track', target:'desert', reward:200 },
  { id:'track_storm', name:'Storm Chaser', desc:'Complete a run on Storm Coast', type:'track', target:'storm', reward:200 },
  { id:'track_mountain', name:'Apex Hunter', desc:'Complete a run on Alpine Pass', type:'track', target:'mountain', reward:300 },
  { id:'event_grandprix', name:'Grand Prix', desc:'Finish a Grand Prix event', type:'event', target:'grandprix', reward:500 },
  { id:'event_time', name:'Against The Clock', desc:'Finish a Time Attack event', type:'event', target:'timeattack', reward:350 }
];

const TRACKS = [
  { id:'city', name:'Tokyo Express', subtitle:'Midnight city / dry', unlock:null, scenery:'city' },
  { id:'desert', name:'Sunset Desert', subtitle:'Open road / heat haze', unlock:{type:'distance',target:1200}, scenery:'desert' },
  { id:'storm', name:'Storm Coast', subtitle:'Wet asphalt / rain', unlock:{type:'distance',target:3000}, scenery:'coast' },
  { id:'mountain', name:'Alpine Pass', subtitle:'Mountain switchbacks / cold', unlock:{type:'distance',target:5500}, scenery:'mountain' }
];

const CARS = [
  { id:0, name:'Nissan GT-R R35', brand:'NISSAN', tag:'AWD / GRIP', class:'SPORT', unlock:null, stats:{speed:8, accel:8, handling:9, nitro:7}, visual:'gtr' },
  { id:1, name:'Toyota GR Supra', brand:'TOYOTA', tag:'RWD / BALANCED', class:'SPORT', unlock:null, stats:{speed:8, accel:8, handling:8, nitro:7}, visual:'supra' },
  { id:2, name:'Porsche 911 Turbo S', brand:'PORSCHE', tag:'AWD / PRECISION', class:'SUPER', unlock:{type:'coins',target:900}, stats:{speed:9, accel:10, handling:10, nitro:8}, visual:'porsche' },
  { id:3, name:'Audi R8 V10', brand:'AUDI', tag:'AWD / V10', class:'SUPER', unlock:{type:'coins',target:1400}, stats:{speed:9, accel:9, handling:9, nitro:8}, visual:'r8' },
  { id:4, name:'Lamborghini Huracán', brand:'LAMBORGHINI', tag:'V10 / ATTACK', class:'SUPER', unlock:{type:'coins',target:2200}, stats:{speed:10, accel:10, handling:8, nitro:9}, visual:'huracan' },
  { id:5, name:'Ferrari 488 GTB', brand:'FERRARI', tag:'V8 / PRECISION', class:'SUPER', unlock:{type:'coins',target:3000}, stats:{speed:10, accel:9, handling:10, nitro:9}, visual:'ferrari' },
  { id:6, name:'McLaren 720S', brand:'MCLAREN', tag:'V8 / LIGHTWEIGHT', class:'HYPER', unlock:{type:'coins',target:4200}, stats:{speed:10, accel:10, handling:10, nitro:10}, visual:'mclaren' },
  { id:7, name:'Ford Mustang GT', brand:'FORD', tag:'V8 / MUSCLE', class:'MUSCLE', unlock:{type:'coins',target:1800}, stats:{speed:8, accel:9, handling:7, nitro:9}, visual:'mustang' },
  { id:8, name:'Koenigsegg Jesko', brand:'KOENIGSEGG', tag:'V8 / HYPER', class:'HYPER', unlock:{type:'coins',target:6500}, stats:{speed:10, accel:10, handling:9, nitro:10}, visual:'jesko' }
];

const MODES = [
  { id:'endless', name:'ENDLESS', desc:'Pure survival. Go as far as you can.', reward:1.0 },
  { id:'timeattack', name:'TIME ATTACK', desc:'Beat the clock. 90 seconds of maximum pace.', reward:1.35, timeLimit:90 },
  { id:'grandprix', name:'GRAND PRIX', desc:'Reach the finish first. 2500 m target.', reward:1.55, finishDistance:2500 },
  { id:'nitrorush', name:'NITRO RUSH', desc:'Nitro recharges faster and scores are boosted.', reward:1.25 },
  { id:'trafficstorm', name:'TRAFFIC STORM', desc:'Heavy traffic, tighter gaps, bigger rewards.', reward:1.5 }
];

const EVENTS = [
  { id:'midnight', name:'MIDNIGHT GRAND PRIX', track:'city', mode:'grandprix', bonus:600, desc:'Tokyo Express / 2500 m sprint' },
  { id:'sunset', name:'SUNSET DUEL', track:'desert', mode:'timeattack', bonus:450, desc:'Sunset Desert / 90 seconds' },
  { id:'tempest', name:'TEMPEST RUN', track:'storm', mode:'trafficstorm', bonus:700, desc:'Storm Coast / survive the traffic' },
  { id:'alpine', name:'ALPINE NIGHT ATTACK', track:'mountain', mode:'nitrorush', bonus:800, desc:'Alpine Pass / full nitro' }
];

module.exports = { MISSIONS, TRACKS, CARS, MODES, EVENTS };
