const CAR = (() => {
  function wheel(){
    const g=new THREE.Group();
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.34,20),new THREE.MeshStandardMaterial({color:0x080808,roughness:.9,metalness:.05}));
    tire.rotation.z=Math.PI/2; g.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.36,12),new THREE.MeshStandardMaterial({color:0xaeb4ba,metalness:.95,roughness:.2}));
    rim.rotation.z=Math.PI/2; g.add(rim); return g;
  }
  function wedge(width,height,length,mat){
    const geo=new THREE.BoxGeometry(width,height,length); return new THREE.Mesh(geo,mat);
  }
  function build(carId){
    const c=CATALOG.get().cars.find(x=>x.id===carId)||CATALOG.get().cars[0];
    const v=CATALOG.carVisual(carId); const shape=v.shape; const car=new THREE.Group();
    const bodyMat=new THREE.MeshPhysicalMaterial({color:v.body,metalness:.7,roughness:.22,clearcoat:1,clearcoatRoughness:.1});
    const darkMat=new THREE.MeshStandardMaterial({color:v.accent,metalness:.65,roughness:.28});
    const glassMat=new THREE.MeshPhysicalMaterial({color:0x081018,metalness:.15,roughness:.04,transparent:true,opacity:.82,clearcoat:1});
    const glowMat=new THREE.MeshBasicMaterial({color:v.glow});
    const lower=wedge(2.05,.48,4.35,bodyMat); lower.position.y=.55; car.add(lower);
    const hood=new THREE.Mesh(new THREE.BoxGeometry(1.82,.26,1.55),bodyMat); hood.position.set(0,.83,1.35); hood.rotation.x=-.03; car.add(hood);
    const cabinW=shape==='gtr'||shape==='mustang'?1.48:1.36, cabinL=shape==='mclaren'||shape==='jesko'?1.75:1.95;
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(cabinW,.56,cabinL),bodyMat); cabin.position.set(0,1.02,-.25); cabin.rotation.x=shape==='porsche'?.08:-.06; car.add(cabin);
    const windshield=new THREE.Mesh(new THREE.BoxGeometry(cabinW-.08,.38,.82),glassMat); windshield.position.set(0,1.05,.48); windshield.rotation.x=-.28; car.add(windshield);
    const rearGlass=new THREE.Mesh(new THREE.BoxGeometry(cabinW-.08,.35,.62),glassMat); rearGlass.position.set(0,1.04,-1.02); rearGlass.rotation.x=.32; car.add(rearGlass);
    // Long, low noses and wider rear hips create recognisable sports-car silhouettes.
    if(shape==='gtr'||shape==='mustang'){
      const fenderL=wedge(.35,.34,1.65,bodyMat); fenderL.position.set(-.95,.72,.65); car.add(fenderL);
      const fenderR=fenderL.clone();fenderR.position.x=.95;car.add(fenderR);
    }
    if(shape==='porsche'){
      const rear=new THREE.Mesh(new THREE.BoxGeometry(2.18,.4,1.25),bodyMat); rear.position.set(0,.7,-1.35); car.add(rear);
      const duck=new THREE.Mesh(new THREE.BoxGeometry(1.7,.08,.35),darkMat);duck.position.set(0,1.12,-1.93);car.add(duck);
    } else if(shape==='mclaren'||shape==='jesko'){
      const wing=new THREE.Mesh(new THREE.BoxGeometry(1.9,.08,.45),darkMat);wing.position.set(0,1.28,-1.85);car.add(wing);
      const s1=new THREE.Mesh(new THREE.BoxGeometry(.1,.4,.1),darkMat);s1.position.set(-.72,1.08,-1.83);car.add(s1);const s2=s1.clone();s2.position.x=.72;car.add(s2);
    } else {
      const wing=new THREE.Mesh(new THREE.BoxGeometry(1.75,.08,.38),darkMat);wing.position.set(0,1.22,-1.92);car.add(wing);
      const s1=new THREE.Mesh(new THREE.BoxGeometry(.09,.34,.09),darkMat);s1.position.set(-.68,1.02,-1.88);car.add(s1);const s2=s1.clone();s2.position.x=.68;car.add(s2);
    }
    // mirrors
    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.28),darkMat);mirror.position.set(-.98,.94,.72);car.add(mirror);const mirrorR=mirror.clone();mirrorR.position.x=.98;car.add(mirrorR);
    // front splitter and side skirts
    const splitter=new THREE.Mesh(new THREE.BoxGeometry(1.92,.09,.32),darkMat);splitter.position.set(0,.39,2.08);car.add(splitter);
    const skirt=new THREE.Mesh(new THREE.BoxGeometry(2.08,.08,3.6),glowMat);skirt.position.set(0,.35,.05);skirt.scale.y=.6;car.add(skirt);
    // lamps
    const headMat=new THREE.MeshBasicMaterial({color:0xf9fbff});
    const headL=new THREE.Mesh(new THREE.BoxGeometry(.34,.12,.08),headMat);headL.position.set(-.62,.68,2.22);car.add(headL);const headR=headL.clone();headR.position.x=.62;car.add(headR);
    const spotL=new THREE.SpotLight(0xffffff,1.4,50,Math.PI/8,.35);spotL.position.set(-.62,.72,2.3);const targetL=new THREE.Object3D();targetL.position.set(-.62,.2,24);car.add(targetL);spotL.target=targetL;car.add(spotL);const spotR=spotL.clone();spotR.position.x=.62;const targetR=new THREE.Object3D();targetR.position.set(.62,.2,24);car.add(targetR);spotR.target=targetR;car.add(spotR);
    const brakeMat=new THREE.MeshBasicMaterial({color:0x661010});
    const tailL=new THREE.Mesh(new THREE.BoxGeometry(.36,.12,.07),brakeMat);tailL.position.set(-.65,.68,-2.2);car.add(tailL);const tailR=tailL.clone();tailR.position.x=.65;car.add(tailR);
    const under=new THREE.Mesh(new THREE.BoxGeometry(1.95,.05,3.8),glowMat);under.position.set(0,.2,0);car.add(under);const underLight=new THREE.PointLight(v.glow,.75,7);underLight.position.set(0,.2,0);car.add(underLight);
    const exMat=new THREE.MeshBasicMaterial({color:0xffa04a});const ex1=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.2,10),exMat);ex1.rotation.x=Math.PI/2;ex1.position.set(-.4,.46,-2.2);car.add(ex1);const ex2=ex1.clone();ex2.position.x=.4;car.add(ex2);
    const wheels={fl:wheel(),fr:wheel(),rl:wheel(),rr:wheel()};wheels.fl.position.set(-1.0,.43,1.25);wheels.fr.position.set(1.0,.43,1.25);wheels.rl.position.set(-1.0,.43,-1.3);wheels.rr.position.set(1.0,.43,-1.3);Object.values(wheels).forEach(w=>car.add(w));
    car.userData={wheels:Object.values(wheels),tailMats:[tailL.material,tailR.material],underglowMesh:under,underLight,exhaustMats:[ex1.material,ex2.material],glowColor:v.glow,headSpots:[spotL,spotR],spec:c.stats};
    return car;
  }
  return {build};
})();
