import * as THREE from 'three';
import {
  CharacterLook,
  GenderType,
  OutfitId,
  RoleType,
  SupplyId,
  UniformId,
  VehicleId,
} from '../types/game';
import {
  createContactShadowTexture,
  createDefaultFaceTexture,
  createFaceTextureFromImage,
  createOutfitTorsoTexture,
  createUniformTorsoTexture,
} from './textures';

export interface StudentRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  vehicleMount: THREE.Group;
  supplyMount: THREE.Group;
  crownMesh: THREE.Group;
  helmetMesh: THREE.Group;
  faceMat: THREE.MeshStandardMaterial;
  skinMat: THREE.MeshStandardMaterial;
  torsoFrontMat: THREE.MeshStandardMaterial;
  sleeveMat: THREE.MeshStandardMaterial;
  cuffMat: THREE.MeshStandardMaterial;
  pantsMat: THREE.MeshStandardMaterial;
  wheels: THREE.Object3D[];
  propeller: THREE.Object3D | null;
  updateLook: (look: CharacterLook, vipUnlocked: boolean) => Promise<void>;
  updateUniform: (uniformId: UniformId, outfitId?: OutfitId) => void;
  updateOutfit: (uniformId: UniformId, outfitId: OutfitId) => void;
  updateHelmet: (visible: boolean) => void;
  updateSupply: (supplyId: SupplyId) => void;
  updateVehicle: (vehicleId: VehicleId) => void;
  animate: (
    elapsed: number,
    speedRatio: number,
    isMoving: boolean,
    vehicleId: VehicleId,
    isWheelie?: boolean,
    isReckless?: boolean
  ) => void;
}

function buildHairGroup(style: CharacterLook['hairStyle']): THREE.Group {
  const g = new THREE.Group();
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 });
  const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.42 });

  // Top cap
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.56), hairMat);
  top.position.set(0, 0.25, -0.01);
  top.castShadow = true;
  g.add(top);

  // Back of head hair
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.12), hairMat);
  back.position.set(0, 0.04, -0.24);
  g.add(back);

  if (style === 'short_boy') {
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.14), hairMat);
    fringe.position.set(0, 0.21, 0.24);
    g.add(fringe);
  } else if (style === 'spiky') {
    for (let i = -2; i <= 2; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), hairMat);
      spike.position.set(i * 0.1, 0.36, 0.05);
      spike.rotation.x = 0.25;
      g.add(spike);
    }
  } else if (style === 'side_part') {
    const sweepLeft = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.18), hairMat);
    sweepLeft.position.set(-0.08, 0.22, 0.22);
    sweepLeft.rotation.z = 0.18;
    const sweepRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.16), hairMat);
    sweepRight.position.set(0.18, 0.21, 0.22);
    sweepRight.rotation.z = -0.24;
    const crownVolume = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.48), hairMat);
    crownVolume.position.set(0, 0.32, 0.02);
    g.add(sweepLeft, sweepRight, crownVolume);
  } else if (style === 'curly_boy') {
    const curlOffsets: Array<[number, number, number, number]> = [
      [-0.18, 0.31, 0.14, 0.13],
      [0, 0.34, 0.15, 0.14],
      [0.18, 0.31, 0.14, 0.13],
      [-0.22, 0.29, -0.05, 0.13],
      [0.22, 0.29, -0.05, 0.13],
      [0, 0.34, -0.08, 0.14],
      [-0.14, 0.24, 0.24, 0.1],
      [0.14, 0.24, 0.24, 0.1],
    ];
    curlOffsets.forEach(([x, y, z, r]) => {
      const curl = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), hairMat);
      curl.position.set(x, y, z);
      g.add(curl);
    });
  } else if (style === 'undercut') {
    const quiff = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.46), hairMat);
    quiff.position.set(0, 0.33, 0.06);
    quiff.rotation.x = -0.15;
    const frontWave = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.16), hairMat);
    frontWave.position.set(0, 0.27, 0.25);
    frontWave.rotation.x = -0.28;
    g.add(quiff, frontWave);
  } else if (style === 'bob_cut') {
    [-0.27, 0.27].forEach((sx) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.48), hairMat);
      side.position.set(sx, -0.02, -0.02);
      g.add(side);
    });
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.12), hairMat);
    bangs.position.set(0, 0.21, 0.24);
    g.add(bangs);
  } else if (style === 'ponytail') {
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.48, 8), hairMat);
    tail.position.set(0, 0.04, -0.36);
    tail.rotation.x = 0.45;
    g.add(tail);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.028, 6, 12), ribbonMat);
    band.position.set(0, 0.2, -0.31);
    g.add(band);
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), hairMat);
    bangs.position.set(0, 0.21, 0.24);
    g.add(bangs);
  } else if (style === 'long_straight') {
    const longBack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.12), hairMat);
    longBack.position.set(0, -0.18, -0.25);
    longBack.castShadow = true;
    g.add(longBack);
    [-0.27, 0.27].forEach((sx) => {
      const sideLock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.24), hairMat);
      sideLock.position.set(sx, -0.1, 0.06);
      g.add(sideLock);
    });
    const headband = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.1), bandMat);
    headband.position.set(0, 0.31, 0.08);
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.12), hairMat);
    bangs.position.set(0, 0.21, 0.24);
    g.add(headband, bangs);
  } else if (style === 'twin_tails') {
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.12), hairMat);
    bangs.position.set(0, 0.21, 0.24);
    g.add(bangs);
    [-1, 1].forEach((side) => {
      const tie = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), ribbonMat);
      tie.position.set(side * 0.31, 0.18, -0.05);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.56, 8), hairMat);
      tail.position.set(side * 0.38, -0.08, -0.06);
      tail.rotation.z = side * 0.24;
      g.add(tie, tail);
    });
  } else if (style === 'high_bun') {
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), hairMat);
    bangs.position.set(0, 0.21, 0.24);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), hairMat);
    bun.position.set(0, 0.42, -0.06);
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.08), ribbonMat);
    bow.position.set(0, 0.33, 0.09);
    g.add(bangs, bun, bow);
  }

  return g;
}

function buildSupplyProp(supplyId: SupplyId): THREE.Group {
  const g = new THREE.Group();
  const bagColors: Record<SupplyId, number> = {
    basic_books: 0x334155,
    casio_kit: 0x0284c7,
    ergonomic_bag: 0x16a34a,
    ipad_pro: 0x6366f1,
    ar_workstation: 0xf59e0b,
  };
  const packMat = new THREE.MeshStandardMaterial({
    color: bagColors[supplyId],
    roughness: 0.55,
    metalness: supplyId === 'ar_workstation' ? 0.55 : 0.1,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

  const mainBag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.2), packMat);
  mainBag.position.set(0, 1.08, -0.24);
  mainBag.castShadow = true;
  g.add(mainBag);

  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.06), trimMat);
  pocket.position.set(0, 0.96, -0.35);
  g.add(pocket);

  if (supplyId === 'ipad_pro' || supplyId === 'ar_workstation') {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.02, 8, 24),
      new THREE.MeshStandardMaterial({
        color: supplyId === 'ar_workstation' ? 0xfacc15 : 0x38bdf8,
        emissive: supplyId === 'ar_workstation' ? 0xf59e0b : 0x0284c7,
        emissiveIntensity: 0.7,
      })
    );
    halo.position.set(0, 1.12, -0.37);
    g.add(halo);
  }

  return g;
}

function buildVehicleMesh(vehicleId: VehicleId): {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  propeller: THREE.Object3D | null;
  seatYOffset: number;
} {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  let propeller: THREE.Object3D | null = null;
  let seatYOffset = 0;

  if (vehicleId === 'walk') {
    return { group, wheels, propeller, seatYOffset: 0 };
  }

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
  const alloyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.85 });

  const makeWheel = (radius: number, width: number) => {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 18), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wg.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.02, 10), alloyMat);
    rim.rotation.z = Math.PI / 2;
    wg.add(rim);
    return wg;
  };

  if (vehicleId === 'bike') {
    seatYOffset = 0.28;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.35, metalness: 0.45 });
    const wFront = makeWheel(0.36, 0.08);
    wFront.position.set(0, 0.36, 0.68);
    const wBack = makeWheel(0.36, 0.08);
    wBack.position.set(0, 0.36, -0.64);
    group.add(wFront, wBack);
    wheels.push(wFront, wBack);

    const bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 8), frameMat);
    bar1.rotation.x = Math.PI / 2.2;
    bar1.position.set(0, 0.62, 0.02);
    group.add(bar1);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), alloyMat);
    stem.position.set(0, 0.75, 0.54);
    stem.rotation.x = -0.2;
    group.add(stem);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8), tireMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.08, 0.48);
    group.add(handle);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.32), tireMat);
    seat.position.set(0, 0.85, -0.28);
    group.add(seat);
  } else if (vehicleId === 'scooter') {
    seatYOffset = 0.22;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.28, metalness: 0.4 });
    const wFront = makeWheel(0.28, 0.12);
    wFront.position.set(0, 0.28, 0.66);
    const wBack = makeWheel(0.28, 0.14);
    wBack.position.set(0, 0.28, -0.62);
    group.add(wFront, wBack);
    wheels.push(wFront, wBack);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 1.15), bodyMat);
    deck.position.set(0, 0.32, 0);
    deck.castShadow = true;
    group.add(deck);

    const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.85, 0.2), bodyMat);
    frontShield.position.set(0, 0.72, 0.56);
    frontShield.rotation.x = -0.15;
    group.add(frontShield);

    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.9 })
    );
    headlight.position.set(0, 0.96, 0.64);
    group.add(headlight);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.68, 8), tireMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.12, 0.46);
    group.add(handle);
  } else if (vehicleId === 'motorbike') {
    seatYOffset = 0.28;
    const fairingMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      metalness: 0.55,
      roughness: 0.25,
      clearcoat: 0.9,
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.6 });
    const wFront = makeWheel(0.35, 0.14);
    wFront.position.set(0, 0.35, 0.82);
    const wBack = makeWheel(0.35, 0.18);
    wBack.position.set(0, 0.35, -0.74);
    group.add(wFront, wBack);
    wheels.push(wFront, wBack);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 1.38), darkMetalMat);
    chassis.position.set(0, 0.55, 0);
    chassis.castShadow = true;
    group.add(chassis);

    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.65), fairingMat);
    tank.position.set(0, 0.84, 0.24);
    tank.castShadow = true;
    group.add(tank);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.72), tireMat);
    seat.position.set(0, 0.78, -0.38);
    group.add(seat);

    const frontFork = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.22), fairingMat);
    frontFork.position.set(0, 0.82, 0.68);
    frontFork.rotation.x = -0.25;
    group.add(frontFork);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.9, 8), alloyMat);
    exhaust.rotation.x = Math.PI / 2 - 0.12;
    exhaust.position.set(0.22, 0.42, -0.45);
    group.add(exhaust);

    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.14, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1.0 })
    );
    headlight.position.set(0, 1.04, 0.78);
    group.add(headlight);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.78, 8), tireMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.18, 0.54);
    group.add(handle);
  } else if (vehicleId === 'car') {
    seatYOffset = 0.05;
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      metalness: 0.65,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.62,
    });

    // Main lower chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.56, 3.6), paintMat);
    chassis.position.set(0, 0.52, 0);
    chassis.castShadow = true;
    group.add(chassis);

    // Cabin canopy
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.52, 1.65), glassMat);
    cabin.position.set(0, 1.02, -0.15);
    group.add(cabin);

    // Roof cap
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 1.4), paintMat);
    roof.position.set(0, 1.3, -0.15);
    group.add(roof);

    // Rear spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 0.28), tireMat);
    spoiler.position.set(0, 0.96, -1.62);
    group.add(spoiler);

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 1.0,
    });
    [-0.6, 0.6].forEach((lx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), lightMat);
      hl.position.set(lx, 0.56, 1.81);
      group.add(hl);
    });

    // 4 wheels
    const wheelPositions: Array<[number, number]> = [
      [-0.88, 1.1],
      [0.88, 1.1],
      [-0.88, -1.1],
      [0.88, -1.1],
    ];
    wheelPositions.forEach(([wx, wz]) => {
      const w = makeWheel(0.34, 0.22);
      w.position.set(wx, 0.34, wz);
      group.add(w);
      wheels.push(w);
    });
  } else if (vehicleId === 'plane') {
    seatYOffset = 2.4; // Hovering / Flying above ground!
    const jetMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.45,
      roughness: 0.25,
      clearcoat: 0.9,
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.0,
    });

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 3.6, 12), jetMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.set(0, 2.35, 0);
    fuselage.castShadow = true;
    group.add(fuselage);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.85, 12), accentMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 2.35, 2.2);
    group.add(nose);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 1.15), accentMat);
    wings.position.set(0, 2.32, -0.15);
    wings.castShadow = true;
    group.add(wings);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.7), accentMat);
    tailFin.position.set(0, 2.85, -1.55);
    group.add(tailFin);

    // Thruster glow
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.25, 12), glowMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(0, 2.35, -1.9);
    group.add(thruster);

    // Spinning front propeller
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 2.35, 2.66);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.09, 0.04), tireMat);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.3, 0.04), tireMat);
    propGroup.add(blade1, blade2);
    group.add(propGroup);
    propeller = propGroup;
  }

  return { group, wheels, propeller, seatYOffset };
}

export function createStudentRig(
  initialLook: CharacterLook,
  initialUniform: UniformId,
  initialSupply: SupplyId,
  initialVehicle: VehicleId,
  vipUnlocked: boolean,
  maxAniso: number
): StudentRig {
  const root = new THREE.Group();

  // Contact shadow disc grounded at y=0.03
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.04;
  root.add(shadowPlane);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const initialGender: GenderType = initialLook.gender || 'male';
  const skinMat = new THREE.MeshStandardMaterial({ color: initialLook.skinTone, roughness: 0.72 });
  const faceMat = new THREE.MeshStandardMaterial({
    map: createDefaultFaceTexture(initialLook.skinTone, initialLook.hasGlasses, maxAniso, initialGender),
    roughness: 0.65,
  });
  const torsoFrontMat = new THREE.MeshStandardMaterial({
    map: createUniformTorsoTexture(initialUniform, maxAniso),
    roughness: 0.75,
  });
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: initialUniform === 'green_35' ? 0x84cc16 : initialUniform === 'vip_8a3' ? 0x064e3b : 0xf8fafc,
    roughness: 0.75,
  });
  const cuffMat = new THREE.MeshStandardMaterial({
    color: initialUniform === 'green_35' ? 0x0f172a : initialUniform === 'vip_8a3' ? 0xeab308 : 0x84cc16,
    roughness: 0.7,
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });

  // Head Group (front +Z uses faceMat)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0);
  const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const headMesh = new THREE.Mesh(headGeo, [
    skinMat, // +X
    skinMat, // -X
    skinMat, // +Y
    skinMat, // -Y
    faceMat, // +Z (front face)
    skinMat, // -Z
  ]);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  let hairGroup = buildHairGroup(initialLook.hairStyle);
  headGroup.add(hairGroup);

  // VIP Crown (visible when vipUnlocked)
  const crownMesh = new THREE.Group();
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.85,
  });
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.12, 8), crownMat);
  crownBase.position.y = 0.39;
  crownMesh.add(crownBase);
  crownMesh.visible = vipUnlocked;
  headGroup.add(crownMesh);

  // Safety Helmet (Mũ bảo hiểm 3D when riding electric scooter / motorbike)
  const helmetMesh = new THREE.Group();
  const helmetShellMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.22,
    metalness: 0.25,
    clearcoat: 0.9,
  });
  const helmetTrimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const helmetVisorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.72,
  });
  const hShell = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.62), helmetShellMat);
  hShell.position.set(0, 0.18, -0.02);
  hShell.castShadow = true;
  const hStripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.64), helmetTrimMat);
  hStripe.position.set(0, 0.19, -0.02);
  const hVisor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.12), helmetVisorMat);
  hVisor.position.set(0, 0.12, 0.29);
  helmetMesh.add(hShell, hStripe, hVisor);
  helmetMesh.visible = false;
  headGroup.add(helmetMesh);

  bodyGroup.add(headGroup);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.3), [
    sleeveMat,
    sleeveMat,
    sleeveMat,
    sleeveMat,
    torsoFrontMat,
    torsoFrontMat,
  ]);
  torso.position.set(0, 1.06, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Arms
  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.35, 1.32, 0);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.18), sleeveMat);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.19), cuffMat);
    cuff.position.y = -0.22;
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), skinMat);
    forearm.position.y = -0.38;
    pivot.add(sleeve, cuff, forearm);
    return pivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  bodyGroup.add(leftArm, rightArm);

  // Legs
  const makeLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.14, 0.74, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.22), pantsMat);
    leg.position.y = -0.31;
    leg.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.29), shoeMat);
    shoe.position.set(0, -0.68, 0.03);
    pivot.add(leg, shoe);
    return pivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  // Pleated Skirt & Tunic Skirt Group (visible for Female / Skirt outfits)
  const skirtMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.36, 0.36, 12),
    skirtMat
  );
  skirtMesh.position.set(0, 0.64, 0);
  skirtMesh.castShadow = true;
  skirtMesh.visible = initialGender === 'female';
  bodyGroup.add(skirtMesh);

  // Supply Mount
  const supplyMount = new THREE.Group();
  supplyMount.add(buildSupplyProp(initialSupply));
  bodyGroup.add(supplyMount);

  // Vehicle Mount
  const vehicleMount = new THREE.Group();
  root.add(vehicleMount);
  let activeWheels: THREE.Object3D[] = [];
  let activePropeller: THREE.Object3D | null = null;
  let seatYOffset = 0;

  let currentGender: GenderType = initialGender;
  let currentSkinTone: string = initialLook.skinTone;
  let currentUniform: UniformId = initialUniform;
  let currentOutfit: OutfitId = 'school_uniform';
  let currentVehicle: VehicleId = initialVehicle;

  const syncSkirtVisibility = () => {
    const insideCockpit = currentVehicle === 'car' || currentVehicle === 'plane';
    const isFemaleOutfit =
      currentOutfit === 'pleated_skirt' ||
      currentOutfit === 'pastel_cardigan' ||
      currentOutfit === 'princess_dress' ||
      (currentGender === 'female' &&
        (currentOutfit === 'school_uniform' || currentOutfit === 'korean_blazer'));
    skirtMesh.visible = !insideCockpit && isFemaleOutfit;
    if (currentOutfit === 'princess_dress') {
      skirtMesh.scale.set(1.22, 1.35, 1.22);
      skirtMesh.position.y = 0.56;
    } else {
      skirtMesh.scale.set(1, 1, 1);
      skirtMesh.position.y = 0.64;
    }
  };

  const applyVehicle = (vId: VehicleId) => {
    currentVehicle = vId;
    while (vehicleMount.children.length > 0) {
      vehicleMount.remove(vehicleMount.children[0]);
    }
    const built = buildVehicleMesh(vId);
    vehicleMount.add(built.group);
    activeWheels = built.wheels;
    activePropeller = built.propeller;
    seatYOffset = built.seatYOffset;
    bodyGroup.position.y = seatYOffset;
    // Hide student body legs inside sports car cockpit
    const insideCockpit = vId === 'car' || vId === 'plane';
    leftLeg.visible = !insideCockpit;
    rightLeg.visible = !insideCockpit;
    supplyMount.visible = !insideCockpit;
    syncSkirtVisibility();
    if (vId === 'car') {
      bodyGroup.position.set(0, 0.25, -0.1);
    } else if (vId === 'plane') {
      bodyGroup.position.set(0, 1.85, 0.25);
    } else {
      bodyGroup.position.set(0, seatYOffset, 0);
    }
  };
  applyVehicle(initialVehicle);

  const updateOutfit = (uId: UniformId, outfitId: OutfitId = 'school_uniform') => {
    currentUniform = uId;
    currentOutfit = outfitId;
    const tex =
      outfitId === 'school_uniform'
        ? createUniformTorsoTexture(uId, maxAniso)
        : createOutfitTorsoTexture(outfitId, maxAniso);
    torsoFrontMat.map?.dispose();
    torsoFrontMat.map = tex;
    torsoFrontMat.needsUpdate = true;

    if (outfitId === 'school_uniform') {
      skirtMat.color.setHex(0x1e293b);
      pantsMat.color.set(currentGender === 'female' ? currentSkinTone : '#1e293b');
      if (uId === 'green_35') {
        sleeveMat.color.setHex(0x84cc16);
        cuffMat.color.setHex(0x0f172a);
      } else if (uId === 'vip_8a3') {
        sleeveMat.color.setHex(0x064e3b);
        cuffMat.color.setHex(0xeab308);
      } else {
        sleeveMat.color.setHex(0xf8fafc);
        cuffMat.color.setHex(0x84cc16);
      }
    } else if (outfitId === 'street_hoodie') {
      sleeveMat.color.setHex(0x1e293b);
      cuffMat.color.setHex(0xf97316);
      pantsMat.color.setHex(0x0f172a);
    } else if (outfitId === 'sport_track') {
      sleeveMat.color.setHex(0x0284c7);
      cuffMat.color.setHex(0xffffff);
      pantsMat.color.setHex(0x0369a1);
    } else if (outfitId === 'bomber_ls') {
      sleeveMat.color.setHex(0x991b1b);
      cuffMat.color.setHex(0x1e293b);
      pantsMat.color.setHex(0x1e293b);
    } else if (outfitId === 'denim_jacket') {
      sleeveMat.color.setHex(0x1d4ed8);
      cuffMat.color.setHex(0x1e3a8a);
      pantsMat.color.setHex(0x1e293b);
    } else if (outfitId === 'korean_blazer') {
      sleeveMat.color.setHex(0xd6b48a);
      cuffMat.color.setHex(0x78350f);
      skirtMat.color.setHex(0x78350f);
      pantsMat.color.set(currentGender === 'female' ? currentSkinTone : '#451a03');
    } else if (outfitId === 'pleated_skirt') {
      sleeveMat.color.setHex(0xf8fafc);
      cuffMat.color.setHex(0x1e3a8a);
      skirtMat.color.setHex(0x1e3a8a);
      pantsMat.color.set(currentSkinTone);
    } else if (outfitId === 'pastel_cardigan') {
      sleeveMat.color.setHex(0xc084fc);
      cuffMat.color.setHex(0xfdf2f8);
      skirtMat.color.setHex(0xfef3c7);
      pantsMat.color.set(currentSkinTone);
    } else if (outfitId === 'ao_dai_white') {
      sleeveMat.color.setHex(0xf8fafc);
      cuffMat.color.setHex(0xf472b6);
      pantsMat.color.setHex(0xf8fafc);
    } else if (outfitId === 'ao_dai_vn') {
      sleeveMat.color.setHex(0xbe185d);
      cuffMat.color.setHex(0xfbcfe8);
      pantsMat.color.setHex(0xf8fafc);
    } else if (outfitId === 'princess_dress') {
      sleeveMat.color.setHex(0x0d9488);
      cuffMat.color.setHex(0xfde047);
      skirtMat.color.setHex(0x0f766e);
      pantsMat.color.set(currentSkinTone);
    } else {
      // formal_suit
      sleeveMat.color.setHex(0x0f172a);
      cuffMat.color.setHex(0xf8fafc);
      pantsMat.color.setHex(0x0f172a);
    }
    syncSkirtVisibility();
  };

  const updateLook = async (look: CharacterLook, vip: boolean) => {
    currentGender = look.gender || 'male';
    currentSkinTone = look.skinTone;
    skinMat.color.set(look.skinTone);
    crownMesh.visible = vip;
    headGroup.remove(hairGroup);
    hairGroup = buildHairGroup(look.hairStyle);
    headGroup.add(hairGroup);

    if (look.faceDataUrl) {
      const tex = await createFaceTextureFromImage(
        look.faceDataUrl,
        look.skinTone,
        look.hasGlasses,
        maxAniso
      );
      faceMat.map?.dispose();
      faceMat.map = tex;
      faceMat.needsUpdate = true;
    } else {
      const tex = createDefaultFaceTexture(look.skinTone, look.hasGlasses, maxAniso, currentGender);
      faceMat.map?.dispose();
      faceMat.map = tex;
      faceMat.needsUpdate = true;
    }
    updateOutfit(currentUniform, currentOutfit);
  };

  if (initialLook.faceDataUrl) {
    updateLook(initialLook, vipUnlocked);
  }

  const updateUniform = (uId: UniformId, outfitId: OutfitId = 'school_uniform') => {
    updateOutfit(uId, outfitId);
  };

  const updateHelmet = (visible: boolean) => {
    helmetMesh.visible = visible;
    crownMesh.visible = !visible && vipUnlocked;
  };

  const updateSupply = (sId: SupplyId) => {
    while (supplyMount.children.length > 0) {
      supplyMount.remove(supplyMount.children[0]);
    }
    supplyMount.add(buildSupplyProp(sId));
  };

  let wheelieBlend = 0;

  const animate = (
    elapsed: number,
    speedRatio: number,
    isMoving: boolean,
    vId: VehicleId,
    isWheelie = false,
    isReckless = false
  ) => {
    const canWheelie = vId === 'bike' || vId === 'scooter' || vId === 'motorbike';
    const targetWheelie = canWheelie && isWheelie ? 1 : 0;
    wheelieBlend += (targetWheelie - wheelieBlend) * 0.22;

    if (vId === 'walk') {
      vehicleMount.rotation.set(0, 0, 0);
      bodyGroup.rotation.set(0, 0, 0);
      const swing = isMoving ? Math.sin(elapsed * 9.5) * 0.65 * speedRatio : 0;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.85;
      rightArm.rotation.x = swing * 0.85;
      bodyGroup.position.y = isMoving ? Math.abs(Math.sin(elapsed * 9.5)) * 0.06 : 0;
    } else if (vId === 'bike' || vId === 'scooter' || vId === 'motorbike') {
      leftLeg.rotation.x = -0.35;
      rightLeg.rotation.x = -0.35;
      leftArm.rotation.x = -0.75 - wheelieBlend * 0.35;
      rightArm.rotation.x = -0.75 - wheelieBlend * 0.35;

      const pitch = -0.46 * wheelieBlend;
      const sway = isReckless && isMoving ? Math.sin(elapsed * 14) * 0.11 : 0;
      vehicleMount.rotation.x = pitch;
      vehicleMount.rotation.z = sway;
      vehicleMount.position.y = wheelieBlend * 0.22;
      bodyGroup.rotation.x = pitch * 0.72;
      bodyGroup.rotation.z = sway * 0.7;
      bodyGroup.position.y = seatYOffset + wheelieBlend * 0.22;

      if (isMoving) {
        activeWheels.forEach((w) => {
          w.rotation.x += 0.24 * speedRatio;
        });
      }
    } else if (vId === 'car') {
      vehicleMount.rotation.set(0, 0, isReckless && isMoving ? Math.sin(elapsed * 11) * 0.05 : 0);
      vehicleMount.position.y = 0;
      bodyGroup.rotation.set(0, 0, 0);
      leftArm.rotation.x = -0.6;
      rightArm.rotation.x = -0.6;
      if (isMoving) {
        activeWheels.forEach((w) => {
          w.rotation.x += 0.34 * speedRatio;
        });
      }
    } else if (vId === 'plane') {
      vehicleMount.rotation.set(0, 0, 0);
      bodyGroup.rotation.set(0, 0, 0);
      const hover = Math.sin(elapsed * 3.2) * 0.22;
      vehicleMount.position.y = hover;
      bodyGroup.position.y = 1.85 + hover;
      if (activePropeller) {
        activePropeller.rotation.z += isMoving ? 0.55 : 0.22;
      }
    }
  };

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    vehicleMount,
    supplyMount,
    crownMesh,
    helmetMesh,
    faceMat,
    skinMat,
    torsoFrontMat,
    sleeveMat,
    cuffMat,
    pantsMat,
    wheels: activeWheels,
    propeller: activePropeller,
    updateLook,
    updateUniform,
    updateOutfit,
    updateHelmet,
    updateSupply,
    updateVehicle: applyVehicle,
    animate,
  };
}

export interface FloatingNameTag {
  sprite: THREE.Sprite;
  update: (
    name: string,
    roleType: RoleType,
    roleLabel: string,
    micActive: boolean,
    micMuted: boolean,
    hasViolation: boolean,
    extraBadges?: {
      isDelinquent?: boolean;
      noHelmet?: boolean;
      isReckless?: boolean;
      isWheelie?: boolean;
    }
  ) => void;
  dispose: () => void;
}

export function createFloatingNameTag(): FloatingNameTag {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.9, 0.72, 1);
  sprite.position.set(0, 2.75, 0);

  let lastKey = '';

  const update = (
    name: string,
    roleType: RoleType,
    roleLabel: string,
    micActive: boolean,
    micMuted: boolean,
    hasViolation: boolean,
    extraBadges?: {
      isDelinquent?: boolean;
      noHelmet?: boolean;
      isReckless?: boolean;
      isWheelie?: boolean;
    }
  ) => {
    const isDel = Boolean(extraBadges?.isDelinquent);
    const noHel = Boolean(extraBadges?.noHelmet);
    const isReck = Boolean(extraBadges?.isReckless);
    const isWh = Boolean(extraBadges?.isWheelie);
    const key = `${name}|${roleType}|${roleLabel}|${micActive}|${micMuted}|${hasViolation}|${isDel}|${noHel}|${isReck}|${isWh}`;
    if (key === lastKey) return;
    lastKey = key;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const anyAlert = hasViolation || noHel || isReck;
    const bgColor = anyAlert
      ? 'rgba(153, 27, 27, 0.92)'
      : roleType === 'super_admin'
        ? 'rgba(124, 45, 18, 0.92)'
        : roleType === 'sub_admin'
          ? 'rgba(30, 58, 138, 0.92)'
          : isDel
            ? 'rgba(88, 28, 135, 0.9)'
            : 'rgba(15, 23, 42, 0.88)';
    const borderColor = anyAlert
      ? '#f87171'
      : roleType === 'super_admin'
        ? '#fbbf24'
        : roleType === 'sub_admin'
          ? '#60a5fa'
          : isDel
            ? '#f472b6'
            : micActive
              ? '#4ade80'
              : '#64748b';

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(16, 14, 480, 100, 22);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    const statusParts: string[] = [];
    if (roleLabel) statusParts.push(roleLabel);
    if (isDel) statusParts.push('ĐẦU GẤU');
    if (micMuted) statusParts.push('TẮT MIC');
    else if (micActive) statusParts.push('ĐANG NÓI');
    if (hasViolation) statusParts.push('ĐÈN ĐỎ!');
    if (noHel) statusParts.push('KO MŨ BH!');
    if (isReck) statusParts.push('XE ĐIÊN!');
    else if (isWh) statusParts.push('BỐC ĐẦU!');

    ctx.fillStyle = anyAlert
      ? '#fecaca'
      : roleType === 'super_admin'
        ? '#fde047'
        : roleType === 'sub_admin'
          ? '#93c5fd'
          : isDel
            ? '#f9a8d4'
            : micActive
              ? '#86efac'
              : '#cbd5e1';
    ctx.fillText(statusParts.join(' · ') || 'Lớp 8A3', 256, 48);

    ctx.font = 'bold 34px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.slice(0, 22), 256, 94);

    tex.needsUpdate = true;
  };

  const dispose = () => {
    tex.dispose();
    mat.dispose();
  };

  return { sprite, update, dispose };
}
