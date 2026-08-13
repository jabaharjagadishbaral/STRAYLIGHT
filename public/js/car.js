const CAR = (() => {

  function wheel() {
    const g = new THREE.Group();
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16),
      new THREE.MeshLambertMaterial({ color: 0x0a0a0a })
    );
    tire.rotation.z = Math.PI / 2;
    g.add(tire);
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.34, 6),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3, emissive: 0x111111 })
    );
    rim.rotation.z = Math.PI / 2;
    g.add(rim);
    return g;
  }

  function build(carId) {
    const v = CATALOG.carVisual(carId);
    const car = new THREE.Group();

    const bodyMat = new THREE.MeshPhysicalMaterial({ color: v.body, metalness: 0.55, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.12 });
    const accentMat = new THREE.MeshStandardMaterial({ color: v.accent, metalness: 0.3, roughness: 0.5 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0a1420, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.75, clearcoat: 1 });
    const glowMat = new THREE.MeshBasicMaterial({ color: v.glow });

    // lower chassis wedge
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 4.4), bodyMat);
    chassis.position.y = 0.55;
    car.add(chassis);

    // front wedge nose (tapered)
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 1.4, 4, 1, false, Math.PI/4), bodyMat);
    nose.rotation.z = Math.PI/2;
    nose.rotation.y = Math.PI/4;
    nose.scale.set(1, 0.42, 1);
    nose.position.set(0, 0.55, 2.35);
    car.add(nose);

    // cabin / cockpit
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.0), bodyMat);
    cabin.position.set(0, 1.0, -0.2);
    car.add(cabin);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 1.0), glassMat);
    windshield.position.set(0, 1.05, 0.7);
    windshield.rotation.x = -0.25;
    car.add(windshield);
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.4, 0.7), glassMat);
    rearGlass.position.set(0, 1.02, -1.15);
    rearGlass.rotation.x = 0.35;
    car.add(rearGlass);

    // side skirts / accent stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.08, 3.8), glowMat);
    stripe.position.set(0, 0.42, 0.1);
    car.add(stripe);

    // spoiler
    const spoilerStand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), accentMat);
    const spoilerStandL = spoilerStand.clone(); spoilerStandL.position.set(-0.7, 1.0, -1.9); car.add(spoilerStandL);
    const spoilerStandR = spoilerStand.clone(); spoilerStandR.position.set(0.7, 1.0, -1.9); car.add(spoilerStandR);
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), bodyMat);
    spoilerWing.position.set(0, 1.25, -1.9);
    car.add(spoilerWing);

    // side mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.18, 0.14, 0.3);
    const mirrorL = new THREE.Mesh(mirrorGeo, accentMat);
    mirrorL.position.set(-1.05, 0.95, 0.9);
    car.add(mirrorL);
    const mirrorR = mirrorL.clone(); mirrorR.position.x = 1.05; car.add(mirrorR);

    // headlights (visual + real spotlights)
    const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headL = new THREE.Mesh(headGeo, headMat); headL.position.set(-0.65, 0.6, 3.35); car.add(headL);
    const headR = headL.clone(); headR.position.x = 0.65; car.add(headR);

    const spotL = new THREE.SpotLight(0xffffff, 1.1, 45, Math.PI/7, 0.4);
    spotL.position.set(-0.65, 0.7, 3.4);
    const targetL = new THREE.Object3D(); targetL.position.set(-0.65, 0, 20); car.add(targetL);
    spotL.target = targetL;
    car.add(spotL);
    const spotR = spotL.clone();
    spotR.position.x = 0.65;
    const targetR = new THREE.Object3D(); targetR.position.set(0.65, 0, 20); car.add(targetR);
    spotR.target = targetR;
    car.add(spotR);

    // taillights (brake-reactive)
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), brakeMat);
    tailL.position.set(-0.65, 0.62, -2.35); car.add(tailL);
    const tailR = tailL.clone(); tailR.position.x = 0.65; car.add(tailR);

    // underglow strip
    const underglow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 4.0), glowMat);
    underglow.position.set(0, 0.22, 0.1);
    car.add(underglow);
    const underLight = new THREE.PointLight(v.glow, 0.9, 6);
    underLight.position.set(0, 0.15, 0);
    car.add(underLight);

    // exhaust glow tips
    const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xffaa55 });
    const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 8), exhaustMat);
    exL.rotation.x = Math.PI/2; exL.position.set(-0.4, 0.42, -2.35); car.add(exL);
    const exR = exL.clone(); exR.position.x = 0.4; car.add(exR);

    // wheels
    const wheels = { fl: wheel(), fr: wheel(), rl: wheel(), rr: wheel() };
    wheels.fl.position.set(-1.0, 0.42, 1.4);
    wheels.fr.position.set(1.0, 0.42, 1.4);
    wheels.rl.position.set(-1.0, 0.42, -1.4);
    wheels.rr.position.set(1.0, 0.42, -1.4);
    Object.values(wheels).forEach(w => car.add(w));

    car.userData = {
      wheels: Object.values(wheels),
      tailMats: [tailL.material, tailR.material],
      underglowMesh: underglow,
      underLight,
      exhaustMats: [exL.material, exR.material],
      glowColor: v.glow,
      headSpots: [spotL, spotR]
    };

    return car;
  }

  return { build };
})();
