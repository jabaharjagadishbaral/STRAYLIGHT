const CATALOG = (() => {
  let data = null;
  const CAR_VISUALS = {
    gtr:{body:0x6f7884,accent:0x101318,glow:0xff3147,shape:'gtr',wheel:0x14171b},
    supra:{body:0xffc400,accent:0x151515,glow:0xff7b00,shape:'supra',wheel:0x151515},
    porsche:{body:0xd8d8d8,accent:0x121212,glow:0xffffff,shape:'porsche',wheel:0x090909},
    r8:{body:0x1677c9,accent:0x0b1016,glow:0x55bfff,shape:'r8',wheel:0x111111},
    huracan:{body:0x24a65a,accent:0x0b120d,glow:0x35ff92,shape:'huracan',wheel:0x111111},
    ferrari:{body:0xb5121b,accent:0x19110f,glow:0xff3d31,shape:'ferrari',wheel:0x0b0b0b},
    mclaren:{body:0xff6b16,accent:0x101010,glow:0xffb347,shape:'mclaren',wheel:0x111111},
    mustang:{body:0x101820,accent:0x8d949d,glow:0x5ed8ff,shape:'mustang',wheel:0x0a0a0a},
    jesko:{body:0xe9e5dc,accent:0x202020,glow:0xffdf5a,shape:'jesko',wheel:0x090909}
  };
  const TRACK_VISUALS = {
    city:{name:'Tokyo Express',sky:[0x05070d,0x151a34],fog:0x080b13,ground:0x090b0f,weather:'clear',scenery:'city'},
    desert:{name:'Sunset Desert',sky:[0x24110c,0xff7448],fog:0x35170e,ground:0x24170f,weather:'clear',scenery:'desert'},
    storm:{name:'Storm Coast',sky:[0x02050b,0x18344b],fog:0x06101a,ground:0x070a0e,weather:'rain',scenery:'coast'},
    mountain:{name:'Alpine Pass',sky:[0x06101a,0x4c7188],fog:0x0c151c,ground:0x101419,weather:'snow',scenery:'mountain'}
  };
  async function load(){
    if(data)return data;
    try{data=await API.getCatalog();}catch(e){
      data={missions:[],tracks:[{id:'city',name:'Tokyo Express',unlock:null}],cars:[{id:0,name:'Nissan GT-R R35',brand:'NISSAN',tag:'AWD / GRIP',unlock:null,stats:{speed:8,accel:8,handling:9,nitro:7},visual:'gtr'}],modes:[{id:'endless',name:'ENDLESS',desc:'Pure survival.',reward:1}],events:[]};
    }
    return data;
  }
  return {load,get:()=>data,carVisual:(id)=>{const c=data?.cars?.find(x=>x.id===id);return CAR_VISUALS[c?.visual]||CAR_VISUALS.gtr;},trackVisual:(id)=>TRACK_VISUALS[id]||TRACK_VISUALS.city,allCarVisuals:()=>CAR_VISUALS,allTrackVisuals:()=>TRACK_VISUALS};
})();
