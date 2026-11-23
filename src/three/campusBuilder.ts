import * as THREE from 'three';
import { GOOD_DEED_SPOTS } from '../data/gameData';
import { InteractiveZone } from '../types/game';
import {
  createBrickCourtyardTexture,
  createMottoBannerTexture,
  createRoadTexture,
  createSignTexture,
  createStageCanopySignTexture,
  createStageFasciaTexture,
  createStageLedTexture,
  createTurfTexture,
} from './textures';

export interface CampusBuildResult {
  root: THREE.Group;
  zones: InteractiveZone[];
  deedMeshes: Map<string, THREE.Group>;
  museumFrameMeshes: Map<string, THREE.Mesh>;
  museumMemoryMeshes: THREE.Mesh[];
  colliders: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; minY?: number; maxY?: number }>;
  animatedProps: Array<(elapsed: number) => void>;
  nightGlowMats: THREE.MeshStandardMaterial[];
  streetLamps: THREE.PointLight[];
  trafficLights: {
    redMats: THREE.MeshStandardMaterial[];
    yellowMats: THREE.MeshStandardMaterial[];
    greenMats: THREE.MeshStandardMaterial[];
    stopLineMats: THREE.MeshStandardMaterial[];
  };
}

export function buildHoangVanThuCampus(maxAniso: number): CampusBuildResult {
  const root = new THREE.Group();
  const zones: InteractiveZone[] = [];
  const deedMeshes = new Map<string, THREE.Group>();
  const museumFrameMeshes = new Map<string, THREE.Mesh>();
  const museumMemoryMeshes: THREE.Mesh[] = [];
  const colliders: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; minY?: number; maxY?: number }> = [];
  const animatedProps: Array<(elapsed: number) => void> = [];
  const nightGlowMats: THREE.MeshStandardMaterial[] = [];
  const streetLamps: THREE.PointLight[] = [];
  const trafficRedMats: THREE.MeshStandardMaterial[] = [];
  const trafficYellowMats: THREE.MeshStandardMaterial[] = [];
  const trafficGreenMats: THREE.MeshStandardMaterial[] = [];
  const stopLineMats: THREE.MeshStandardMaterial[] = [];

  // 1. Extended Ground & Lạng Sơn Rolling Horizon
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x4d7c3f,
    roughness: 0.92,
    metalness: 0.0,
  });
  const baseTerrain = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), grassMat);
  baseTerrain.rotation.x = -Math.PI / 2;
  baseTerrain.position.y = -0.04;
  baseTerrain.receiveShadow = true;
  root.add(baseTerrain);

  // Brick Courtyard (Images 3 & 5)
  const brickTex = createBrickCourtyardTexture(maxAniso);
  const courtyardMat = new THREE.MeshStandardMaterial({
    map: brickTex,
    roughness: 0.85,
    metalness: 0.05,
  });
  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(56, 0.06, 56), courtyardMat);
  courtyard.position.set(0, 0.0, 2);
  courtyard.receiveShadow = true;
  root.add(courtyard);

  // Street outside the gate (z = 33..43)
  const roadTex = createRoadTexture(maxAniso);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.88,
    metalness: 0.04,
  });
  const road = new THREE.Mesh(new THREE.BoxGeometry(205, 0.05, 10), roadMat);
  road.position.set(0, 0.01, 38);
  road.receiveShadow = true;
  root.add(road);

  // Zebra Crosswalk connecting school gate to Town Plaza
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  for (let s = -2; s <= 2; s++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 8.2), stripeMat);
    stripe.position.set(s * 1.6, 0.045, 38);
    root.add(stripe);
  }

  // Visible Red-Light Stop Lines (VẠCH DỪNG ĐÈN ĐỎ at Z = 33.3 and Z = 42.7)
  const stopLineGlowMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.9,
    roughness: 0.35,
  });
  stopLineMats.push(stopLineGlowMat);
  [33.3, 42.7].forEach((sz, idx) => {
    const whiteStop = new THREE.Mesh(new THREE.BoxGeometry(48, 0.025, 0.45), stripeMat);
    whiteStop.position.set(0, 0.05, sz);
    root.add(whiteStop);

    const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(48, 0.03, 0.16), stopLineGlowMat);
    glowStrip.position.set(0, 0.055, idx === 0 ? sz - 0.32 : sz + 0.32);
    root.add(glowStrip);

    const stopSignTex = createSignTexture(
      'VẠCH DỪNG ĐÈN ĐỎ',
      'KHÔNG VƯỢT QUA KHI ĐÈN ĐỎ',
      '#b91c1c',
      '#ffffff',
      maxAniso
    );
    const stopSignBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.72, 0.14),
      new THREE.MeshStandardMaterial({ map: stopSignTex, roughness: 0.4 })
    );
    stopSignBoard.position.set(idx === 0 ? -7.2 : 7.2, 1.8, sz);
    root.add(stopSignBoard);
    const stopSignPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 })
    );
    stopSignPost.position.set(idx === 0 ? -7.2 : 7.2, 0.9, sz);
    root.add(stopSignPost);
  });

  // Sidewalk strip between gate and road
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 });
  const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(88, 0.08, 4), sidewalkMat);
  sidewalk.position.set(8, 0.02, 31.5);
  sidewalk.receiveShadow = true;
  root.add(sidewalk);

  // Town Commercial Plaza & Sidewalk across the street (x = -72..64, z = 43..73)
  const townPlaza = new THREE.Mesh(new THREE.BoxGeometry(136, 0.08, 30), sidewalkMat);
  townPlaza.position.set(-4, 0.02, 58);
  townPlaza.receiveShadow = true;
  root.add(townPlaza);

  // Distant Lạng Sơn green hills around horizon
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x3b6e4c, roughness: 0.95 });
  const hillPositions = [
    [-95, -90, 42, 20],
    [0, -105, 52, 24],
    [100, -85, 45, 20],
    [-110, 35, 38, 16],
    [110, 35, 40, 17],
    [0, 125, 60, 22],
  ];
  hillPositions.forEach(([x, z, r, h]) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), hillMat);
    hill.position.set(x, h * 0.45, z);
    hill.rotation.y = x * 0.1;
    root.add(hill);
  });

  // 2. Iconic School Gate (Image 6)
  const gateGroup = new THREE.Group();
  const greenPillarMat = new THREE.MeshStandardMaterial({
    color: 0x76b82a,
    roughness: 0.55,
    metalness: 0.08,
  });
  const redArchMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.4,
    metalness: 0.15,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.75 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.7 });

  const pillarXs = [-9.5, -2.5, 9.5];
  pillarXs.forEach((px, idx) => {
    const h = idx === 1 ? 6.6 : 6.0;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.05, h, 1.05), greenPillarMat);
    pillar.position.set(px, h / 2, 29.5);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    gateGroup.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 1.3), whiteTrimMat);
    cap.position.set(px, h + 0.12, 29.5);
    gateGroup.add(cap);

    if (idx === 1) {
      const torch = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.05, 8), goldMat);
      torch.position.set(px, h + 0.75, 29.5);
      gateGroup.add(torch);
      const flameCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), redArchMat);
      flameCore.position.set(px, h + 0.9, 29.5);
      gateGroup.add(flameCore);
    } else {
      const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), redArchMat);
      finial.position.set(px, h + 0.65, 29.5);
      gateGroup.add(finial);
    }

    colliders.push({ minX: px - 0.7, maxX: px + 0.7, minZ: 28.8, maxZ: 30.2 });
  });

  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10.5, 4.4, 29.5),
    new THREE.Vector3(-5.0, 4.3, 29.5),
    new THREE.Vector3(-0.2, 4.0, 29.5),
    new THREE.Vector3(1.5, 0.45, 29.5),
    new THREE.Vector3(3.4, 3.8, 29.5),
    new THREE.Vector3(6.2, 5.1, 29.5),
    new THREE.Vector3(10.8, 5.0, 29.5),
  ]);
  const archMesh = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 44, 0.34, 8, false), redArchMat);
  archMesh.castShadow = true;
  gateGroup.add(archMesh);

  const whiteCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10.5, 4.05, 29.5),
    new THREE.Vector3(-5.0, 3.95, 29.5),
    new THREE.Vector3(-0.2, 3.65, 29.5),
    new THREE.Vector3(1.5, 0.25, 29.5),
    new THREE.Vector3(3.4, 3.45, 29.5),
    new THREE.Vector3(6.2, 4.75, 29.5),
    new THREE.Vector3(10.8, 4.65, 29.5),
  ]);
  gateGroup.add(new THREE.Mesh(new THREE.TubeGeometry(whiteCurve, 44, 0.14, 6, false), whiteTrimMat));

  const gateSignTex = createSignTexture(
    'TRƯỜNG THCS HOÀNG VĂN THỤ',
    'TP. LẠNG SƠN · LỚP 8A3',
    '#14532d',
    '#ffffff',
    maxAniso
  );
  const gateSign = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 1.3, 0.22),
    new THREE.MeshStandardMaterial({ map: gateSignTex, roughness: 0.4 })
  );
  gateSign.position.set(13.2, 2.3, 29.5);
  gateSign.castShadow = true;
  gateGroup.add(gateSign);

  [-20, 20].forEach((fx) => {
    const baseWall = new THREE.Mesh(new THREE.BoxGeometry(18, 0.9, 0.45), greenPillarMat);
    baseWall.position.set(fx, 0.45, 29.5);
    baseWall.castShadow = true;
    gateGroup.add(baseWall);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 0.12), ironMat);
    rail.position.set(fx, 1.5, 29.5);
    gateGroup.add(rail);
    colliders.push({ minX: fx - 9, maxX: fx + 9, minZ: 29.1, maxZ: 29.9 });
  });

  const flagColors = [0x38bdf8, 0xfacc15, 0x22c55e, 0xef4444, 0x84cc16];
  flagColors.forEach((col, i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), ironMat);
    pole.position.set(-8.5 + i * 2.2, 5.4, 29.5);
    gateGroup.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.45),
      new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.7 })
    );
    flag.position.set(-8.15 + i * 2.2, 6.2, 29.5);
    gateGroup.add(flag);
    animatedProps.push((t) => {
      flag.rotation.y = Math.sin(t * 3.5 + i) * 0.28;
    });
  });

  root.add(gateGroup);
  zones.push({
    id: 'gate',
    label: 'Cổng Trường Hoàng Văn Thụ',
    sublabel: 'Kiểm tra đồng phục & Xuất phát',
    x: 0,
    z: 28,
    radius: 4.5,
  });

  // 3. Outdoor Stage (Image 4)
  const stageGroup = new THREE.Group();
  stageGroup.position.set(-21.5, 0, 2);
  stageGroup.rotation.y = Math.PI / 2;

  const turfTex = createTurfTexture(maxAniso);
  const stageBase = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.75, 7),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
  );
  stageBase.position.set(0, 0.375, 0);
  stageBase.castShadow = true;
  stageBase.receiveShadow = true;
  stageGroup.add(stageBase);

  const stageTurf = new THREE.Mesh(
    new THREE.BoxGeometry(17.8, 0.08, 6.8),
    new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.9 })
  );
  stageTurf.position.set(0, 0.78, 0);
  stageTurf.receiveShadow = true;
  stageGroup.add(stageTurf);

  const ledTex = createStageLedTexture(maxAniso);
  const ledScreen = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 4.5, 0.25),
    new THREE.MeshStandardMaterial({
      map: ledTex,
      emissiveMap: ledTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.28,
      roughness: 0.35,
    })
  );
  ledScreen.position.set(0, 3.2, -2.5);
  stageGroup.add(ledScreen);

  const leftMottoTex = createMottoBannerTexture(
    ['ĐOÀN KẾT', 'KỶ CƯƠNG', 'GIÚP NHAU', 'CÙNG TIẾN BỘ'],
    maxAniso
  );
  const rightMottoTex = createMottoBannerTexture(
    ['RÈN ĐỨC', 'LUYỆN TÀI', 'VỮNG BƯỚC', 'TỚI TƯƠNG LAI'],
    maxAniso
  );
  const yellowWallMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });
  [-6.8, 6.8].forEach((mx, idx) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.8, 4.8, 0.6), yellowWallMat);
    wing.position.set(mx, 3.15, -2.4);
    wing.castShadow = true;
    stageGroup.add(wing);

    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 4.2),
      new THREE.MeshStandardMaterial({
        map: idx === 0 ? leftMottoTex : rightMottoTex,
        roughness: 0.6,
      })
    );
    banner.position.set(mx, 3.15, -2.08);
    stageGroup.add(banner);
  });

  const fasciaTex = createStageFasciaTexture(maxAniso);
  const fascia = new THREE.Mesh(
    new THREE.BoxGeometry(17.2, 1.35, 0.3),
    new THREE.MeshStandardMaterial({ map: fasciaTex, roughness: 0.45 })
  );
  fascia.position.set(0, 6.1, -1.8);
  stageGroup.add(fascia);

  const canopyTex = createStageCanopySignTexture(maxAniso);
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(18.6, 1.15, 0.45),
    new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.35 })
  );
  canopy.position.set(0, 7.25, 1.6);
  stageGroup.add(canopy);

  const stageRoof = new THREE.Mesh(
    new THREE.BoxGeometry(18.4, 0.2, 5.2),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.55 })
  );
  stageRoof.position.set(0, 6.85, -0.4);
  stageRoof.rotation.x = 0.08;
  stageRoof.castShadow = true;
  stageGroup.add(stageRoof);

  [-8.6, 8.6].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6.2, 8), ironMat);
    col.position.set(cx, 3.8, 1.5);
    stageGroup.add(col);
  });

  root.add(stageGroup);
  colliders.push({ minX: -25.2, maxX: -18.0, minZ: -7.5, maxZ: 11.5 });
  zones.push({
    id: 'stage',
    label: 'Sân Khấu Trao Giải',
    sublabel: 'Xem Bảng Xếp Hạng Tuần & Điểm Danh VIP',
    x: -15.5,
    z: 2,
    radius: 4.5,
  });

  // 4. Multi-story Yellow School Building & Classroom 8A3 (Images 3 & 5)
  const schoolBuilding = new THREE.Group();
  const creamWallMat = new THREE.MeshStandardMaterial({ color: 0xf4d58d, roughness: 0.78 });
  const trimGoldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
  const roofTileMat = new THREE.MeshStandardMaterial({ color: 0xb4533c, roughness: 0.65 });
  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0xfef08a,
    emissiveIntensity: 0.08,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.9,
  });
  nightGlowMats.push(windowGlassMat);
  const doorWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(44, 12.5, 11), creamWallMat);
  mainBody.position.set(2, 6.25, -24);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  schoolBuilding.add(mainBody);

  for (let floor = 0; floor < 3; floor++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(44.4, 0.35, 2.2), trimGoldMat);
    slab.position.set(2, floor * 4.1 + 0.18, -17.6);
    slab.castShadow = true;
    schoolBuilding.add(slab);

    for (let w = -18; w <= 20; w += 4.5) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 0.25), windowGlassMat);
      win.position.set(w, floor * 4.1 + 2.2, -18.45);
      schoolBuilding.add(win);

      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.8, 0.48), creamWallMat);
      pillar.position.set(w - 2.2, floor * 4.1 + 2.0, -16.8);
      pillar.castShadow = true;
      schoolBuilding.add(pillar);
    }
  }

  const roof = new THREE.Mesh(new THREE.ConeGeometry(31, 4.2, 4), roofTileMat);
  roof.position.set(2, 14.5, -24);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 0.42);
  roof.castShadow = true;
  schoolBuilding.add(roof);

  const subjectRooms: Array<{
    zoneId: 'math_room' | 'literature_room' | 'art_room' | 'music_room';
    x: number;
    title: string;
    subtitle: string;
    color: string;
  }> = [
    { zoneId: 'math_room', x: -14, title: 'PHÒNG TOÁN 8', subtitle: 'TÍNH NHẨM NHANH (+10K)', color: '#0284c7' },
    { zoneId: 'literature_room', x: -5, title: 'PHÒNG NGỮ VĂN', subtitle: 'TRÒ CHƠI VĂN HỌC (+10K)', color: '#b45309' },
    { zoneId: 'art_room', x: 4, title: 'PHÒNG MĨ THUẬT', subtitle: 'XƯỞNG PHA MÀU (+10K)', color: '#be185d' },
    { zoneId: 'music_room', x: 13, title: 'PHÒNG ÂM NHẠC', subtitle: 'ĐÀN PIANO 8A3 (+10K)', color: '#6d28d9' },
  ];

  subjectRooms.forEach((rm) => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.0, 0.35), doorWoodMat);
    door.position.set(rm.x, 1.5, -18.4);
    schoolBuilding.add(door);

    const signTex = createSignTexture(rm.title, rm.subtitle, rm.color, '#ffffff', maxAniso);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 1.2, 0.22),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 })
    );
    sign.position.set(rm.x, 3.7, -16.6);
    schoolBuilding.add(sign);

    zones.push({
      id: rm.zoneId,
      label: rm.title,
      sublabel: `${rm.subtitle} · Cần tên trong DS 8A3`,
      x: rm.x,
      z: -14.2,
      radius: 4.1,
    });
  });

  const eastHall = new THREE.Mesh(new THREE.BoxGeometry(10, 8.5, 22), creamWallMat);
  eastHall.position.set(25, 4.25, -4);
  eastHall.castShadow = true;
  eastHall.receiveShadow = true;
  schoolBuilding.add(eastHall);

  const eastRoof = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.9, 23.2), roofTileMat);
  eastRoof.position.set(25, 8.9, -4);
  eastRoof.castShadow = true;
  schoolBuilding.add(eastRoof);

  // English Classroom on North end of East Hall
  const engDoor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.0, 2.2), doorWoodMat);
  engDoor.position.set(19.9, 1.5, -7);
  schoolBuilding.add(engDoor);

  const engSignTex = createSignTexture(
    'PHÒNG TIẾNG ANH 8',
    'WORD SCRAMBLE (+10K)',
    '#047857',
    '#ffffff',
    maxAniso
  );
  const engSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 1.3, 4.4),
    new THREE.MeshStandardMaterial({ map: engSignTex, roughness: 0.4 })
  );
  engSign.position.set(19.8, 3.6, -7);
  schoolBuilding.add(engSign);

  const startupSignTex = createSignTexture(
    'CLB KHỞI NGHIỆP 8A3',
    'LÀM THÊM & ĐẦU TƯ',
    '#1e3a8a',
    '#ffffff',
    maxAniso
  );
  const startupSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 1.3, 4.4),
    new THREE.MeshStandardMaterial({ map: startupSignTex, roughness: 0.4 })
  );
  startupSign.position.set(19.8, 3.6, 2);
  schoolBuilding.add(startupSign);

  root.add(schoolBuilding);
  colliders.push({ minX: -20.5, maxX: 24.5, minZ: -29.8, maxZ: -17.0 });
  colliders.push({ minX: 19.8, maxX: 30.2, minZ: -15.2, maxZ: 7.2 });

  zones.push({
    id: 'english_room',
    label: 'Phòng Tiếng Anh 8',
    sublabel: 'Ghép từ vựng Tiếng Anh (+10.000đ / tiết)',
    x: 17.5,
    z: -7,
    radius: 3.9,
  });

  zones.push({
    id: 'startup_booth',
    label: 'Trung Tâm Khởi Nghiệp 8A3',
    sublabel: 'Làm thêm & Xây dựng Startup',
    x: 17.5,
    z: 2,
    radius: 3.9,
  });

  // 5. Red Plastic Stools (Ghế nhựa đỏ) & Basketball Hoop
  const stoolTopGeo = new THREE.BoxGeometry(0.46, 0.08, 0.46);
  const stoolMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const stoolRows = 6;
  const stoolCols = 8;
  const stoolInst = new THREE.InstancedMesh(stoolTopGeo, stoolMat, stoolRows * stoolCols);
  stoolInst.castShadow = true;
  stoolInst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let sIdx = 0;
  for (let r = 0; r < stoolRows; r++) {
    for (let c = 0; c < stoolCols; c++) {
      dummy.position.set(-7 + c * 1.85, 0.36, -2 + r * 1.85);
      dummy.rotation.y = ((r + c) % 3 - 1) * 0.04;
      dummy.updateMatrix();
      stoolInst.setMatrixAt(sIdx++, dummy.matrix);
    }
  }
  stoolInst.instanceMatrix.needsUpdate = true;
  stoolInst.computeBoundingSphere();
  root.add(stoolInst);

  const hoopGroup = new THREE.Group();
  hoopGroup.position.set(17, 0, 15);
  const hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 8), ironMat);
  hoopPole.position.y = 1.8;
  hoopGroup.add(hoopPole);
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.1, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  backboard.position.set(-0.35, 3.4, 0);
  hoopGroup.add(backboard);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.03, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.5, roughness: 0.4 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(-0.7, 3.1, 0);
  hoopGroup.add(rim);
  root.add(hoopGroup);

  // =========================================================================
  // 6. TOWN DISTRICT OUTSIDE SCHOOL GATE (z = 44..70)
  // =========================================================================

  // 6-PRE. CỬA HÀNG QUẦN ÁO THỜI TRANG 8A3 (x = -55, z = 57)
  const clothGroup = new THREE.Group();
  clothGroup.position.set(-55, 0, 57);
  const clothWallMat = new THREE.MeshStandardMaterial({ color: 0xfdf2f8, roughness: 0.55 });
  const clothAccentMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.35 });

  const clothMain = new THREE.Mesh(new THREE.BoxGeometry(13, 5.8, 10), clothWallMat);
  clothMain.position.set(0, 2.9, 0);
  clothMain.castShadow = true;
  clothMain.receiveShadow = true;
  clothGroup.add(clothMain);

  const clothRoofBand = new THREE.Mesh(new THREE.BoxGeometry(13.4, 1.3, 10.4), clothAccentMat);
  clothRoofBand.position.set(0, 5.5, 0);
  clothRoofBand.castShadow = true;
  clothGroup.add(clothRoofBand);

  const clothAwning = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.3, 2.0), clothAccentMat);
  clothAwning.position.set(0, 3.4, -5.7);
  clothAwning.rotation.x = -0.22;
  clothGroup.add(clothAwning);

  const clothGlass = new THREE.Mesh(new THREE.BoxGeometry(10.2, 2.9, 0.22), windowGlassMat);
  clothGlass.position.set(0, 1.6, -5.05);
  clothGroup.add(clothGlass);

  // Display garments inside boutique window
  const hangerBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.5, 8), ironMat);
  hangerBar.rotation.z = Math.PI / 2;
  hangerBar.position.set(0, 2.1, -4.4);
  clothGroup.add(hangerBar);
  [0xf97316, 0x0284c7, 0xbe185d, 0x84cc16, 0xfacc15].forEach((shirtHex, idx) => {
    const item = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.0, 0.25),
      new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.45 })
    );
    item.position.set(-2.0 + idx * 1.0, 1.55, -4.4);
    clothGroup.add(item);
  });

  const clothSignTex = createSignTexture(
    'CỬA HÀNG QUẦN ÁO 8A3',
    'HOODIE · THỂ THAO · ÁO DÀI · VEST',
    '#9d174d',
    '#ffffff',
    maxAniso
  );
  const clothSign = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 1.7, 0.3),
    new THREE.MeshStandardMaterial({ map: clothSignTex, roughness: 0.35 })
  );
  clothSign.position.set(0, 7.0, -4.8);
  clothGroup.add(clothSign);

  root.add(clothGroup);
  colliders.push({ minX: -61.8, maxX: -48.2, minZ: 51.5, maxZ: 62.5 });
  zones.push({
    id: 'clothing_shop',
    label: 'Cửa Hàng Quần Áo 8A3',
    sublabel: 'Mua & Mặc Hoodie, Bomber, Áo dài, Thể thao',
    x: -55,
    z: 47,
    radius: 4.5,
  });

  // 6A. JOLLIBEE & TIỆM GÀ RÁN (x = -34, z = 56)
  const jollibeeGroup = new THREE.Group();
  jollibeeGroup.position.set(-34, 0, 57);
  const jbRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38 });
  const jbCreamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
  const jbYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });

  const jbMain = new THREE.Mesh(new THREE.BoxGeometry(15, 6.2, 10), jbCreamMat);
  jbMain.position.set(0, 3.1, 0);
  jbMain.castShadow = true;
  jbMain.receiveShadow = true;
  jollibeeGroup.add(jbMain);

  // Red fascia & awning facing school (-Z)
  const jbFascia = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.4, 10.6), jbRedMat);
  jbFascia.position.set(0, 5.8, 0);
  jbFascia.castShadow = true;
  jollibeeGroup.add(jbFascia);

  const jbAwning = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.35, 2.2), jbRedMat);
  jbAwning.position.set(0, 3.4, -5.8);
  jbAwning.rotation.x = -0.22;
  jollibeeGroup.add(jbAwning);

  // Glass storefront
  const jbGlass = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.8, 0.25), windowGlassMat);
  jbGlass.position.set(0, 1.5, -5.05);
  jollibeeGroup.add(jbGlass);

  // Signs for Jollibee & Tiệm Gà Rán
  const jbSignTex = createSignTexture(
    'JOLLIBEE & GÀ RÁN',
    'GÀ GIÒN VUI VẺ · MÌ Ý · COMBO',
    '#b91c1c',
    '#ffffff',
    maxAniso
  );
  const jbSign = new THREE.Mesh(
    new THREE.BoxGeometry(11.5, 1.8, 0.3),
    new THREE.MeshStandardMaterial({ map: jbSignTex, roughness: 0.35 })
  );
  jbSign.position.set(0, 7.2, -4.8);
  jollibeeGroup.add(jbSign);

  // Cute 3D Golden Bee / Chicken Mascot Prop on roof
  const mascotBody = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 14), jbYellowMat);
  mascotBody.position.set(6.2, 7.3, -4.5);
  jollibeeGroup.add(mascotBody);
  const mascotHat = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 10), whiteTrimMat);
  mascotHat.position.set(6.2, 8.35, -4.5);
  jollibeeGroup.add(mascotHat);

  // Outdoor patio umbrella tables
  [-4.2, 4.2].forEach((tx) => {
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 12), whiteTrimMat);
    tableTop.position.set(tx, 0.85, -7.8);
    jollibeeGroup.add(tableTop);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), ironMat);
    pole.position.set(tx, 1.25, -7.8);
    jollibeeGroup.add(pole);
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.65, 8), jbRedMat);
    umbrella.position.set(tx, 2.6, -7.8);
    jollibeeGroup.add(umbrella);
  });

  root.add(jollibeeGroup);
  colliders.push({ minX: -41.8, maxX: -26.2, minZ: 51.5, maxZ: 62.5 });
  zones.push({
    id: 'jollibee',
    label: 'Jollibee & Tiệm Gà Rán',
    sublabel: 'Ăn gà rán hồi Năng lượng & Buff học tập',
    x: -34,
    z: 47,
    radius: 4.5,
  });

  // 6B. QUÁN NET CYBER 8A3 (x = -12, z = 57)
  const netGroup = new THREE.Group();
  netGroup.position.set(-12, 0, 57);
  const netWallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.35 });
  const netCyanMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.8,
  });

  const netBody = new THREE.Mesh(new THREE.BoxGeometry(13, 5.8, 10), netWallMat);
  netBody.position.set(0, 2.9, 0);
  netBody.castShadow = true;
  netGroup.add(netBody);

  const netStrip = new THREE.Mesh(new THREE.BoxGeometry(13.3, 0.25, 10.3), netCyanMat);
  netStrip.position.set(0, 5.65, 0);
  netGroup.add(netStrip);

  const netGlass = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.0, 0.2), windowGlassMat);
  netGlass.position.set(0, 1.7, -5.05);
  netGroup.add(netGlass);

  // Glowing PC Monitors visible through window
  for (let pc = -3.6; pc <= 3.6; pc += 2.4) {
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.12), netCyanMat);
    monitor.position.set(pc, 1.5, -4.3);
    netGroup.add(monitor);
  }

  const netSignTex = createSignTexture(
    'CYBER NET 8A3',
    'ESPOPTS GAMING · THI ĐẤU GIẢI TRÍ',
    '#0f172a',
    '#22d3ee',
    maxAniso
  );
  const netSign = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 1.8, 0.3),
    new THREE.MeshStandardMaterial({ map: netSignTex, roughness: 0.3 })
  );
  netSign.position.set(0, 6.9, -4.8);
  netGroup.add(netSign);

  root.add(netGroup);
  colliders.push({ minX: -18.8, maxX: -5.2, minZ: 51.5, maxZ: 62.5 });
  zones.push({
    id: 'net_cafe',
    label: 'Quán Net Cyber 8A3',
    sublabel: 'Thi đấu Gaming & Luyện phản xạ kiếm thưởng',
    x: -12,
    z: 47,
    radius: 4.5,
  });

  // 6C. CÔNG VIÊN & KHU VUI CHƠI (x = 13, z = 58)
  const parkGroup = new THREE.Group();
  parkGroup.position.set(13, 0, 58);

  const parkLawn = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.12, 22),
    new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.9 })
  );
  parkLawn.position.set(0, 0.05, 0);
  parkLawn.receiveShadow = true;
  parkGroup.add(parkLawn);

  // Rotating Ferris Wheel (Vòng quay Khu vui chơi!)
  const wheelStandMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.5 });
  const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 6.5, 8), wheelStandMat);
  leg1.position.set(-1.8, 3.1, 3.5);
  leg1.rotation.z = -0.22;
  const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 6.5, 8), wheelStandMat);
  leg2.position.set(1.8, 3.1, 3.5);
  leg2.rotation.z = 0.22;
  parkGroup.add(leg1, leg2);

  const ferrisWheel = new THREE.Group();
  ferrisWheel.position.set(0, 6.0, 3.5);
  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(4.2, 0.16, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, metalness: 0.4 })
  );
  ferrisWheel.add(wheelRim);

  const gondolaColors = [0x38bdf8, 0xfacc15, 0x22c55e, 0xa855f7, 0xf97316, 0xec4899];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 8.4, 6), wheelStandMat);
    spoke.rotation.z = angle;
    ferrisWheel.add(spoke);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.95, 0.9),
      new THREE.MeshStandardMaterial({ color: gondolaColors[i], roughness: 0.4 })
    );
    cabin.position.set(Math.cos(angle) * 4.2, Math.sin(angle) * 4.2, 0);
    ferrisWheel.add(cabin);
  }
  parkGroup.add(ferrisWheel);
  animatedProps.push((t) => {
    ferrisWheel.rotation.z = t * 0.45;
  });

  // Playground Slide (Cầu trượt)
  const slideMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 });
  const slidePlatform = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.4), jbRedMat);
  slidePlatform.position.set(-6.5, 1.1, -2.5);
  const slideChute = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 3.8), slideMat);
  slideChute.position.set(-6.5, 1.1, -4.8);
  slideChute.rotation.x = 0.52;
  parkGroup.add(slidePlatform, slideChute);

  // Decorative Park Pond + Fountain
  const pond = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 0.14, 20),
    new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, roughness: 0.1, clearcoat: 1.0 })
  );
  pond.position.set(5.5, 0.12, -3.5);
  parkGroup.add(pond);

  // Park Sign
  const parkSignTex = createSignTexture(
    'CÔNG VIÊN & KHU VUI CHƠI',
    'VÒNG QUAY · CẦU TRƯỢT · THƯ GIÃN',
    '#15803d',
    '#ffffff',
    maxAniso
  );
  const parkSign = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 1.4, 0.25),
    new THREE.MeshStandardMaterial({ map: parkSignTex, roughness: 0.4 })
  );
  parkSign.position.set(0, 2.5, -10.5);
  parkGroup.add(parkSign);

  root.add(parkGroup);
  colliders.push({ minX: 11.2, maxX: 14.8, minZ: 60.5, maxZ: 62.5 }); // Ferris wheel base
  zones.push({
    id: 'park',
    label: 'Công Viên & Khu Vui Chơi',
    sublabel: 'Đi vòng quay & Nghỉ ngơi hồi Năng lượng',
    x: 13,
    z: 48,
    radius: 4.8,
  });

  // 6D. NHÀ SÁCH & SHOWROOM PHƯƠNG TIỆN 3D (x = 36, z = 57)
  // Bookstore wing (x = 31)
  const bookshopGroup = new THREE.Group();
  bookshopGroup.position.set(31, 0, 57);
  const bookWallMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 });
  const bookBody = new THREE.Mesh(new THREE.BoxGeometry(9.5, 5.6, 10), jbCreamMat);
  bookBody.position.set(0, 2.8, 0);
  bookBody.castShadow = true;
  bookshopGroup.add(bookBody);

  const bookBand = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.3, 10.3), bookWallMat);
  bookBand.position.set(0, 5.2, 0);
  bookshopGroup.add(bookBand);

  const bookGlass = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.8, 0.2), windowGlassMat);
  bookGlass.position.set(0, 1.6, -5.05);
  bookshopGroup.add(bookGlass);

  const bookSignTex = createSignTexture(
    'NHÀ SÁCH 8A3',
    'MUA SÁCH VỞ & ĐỒ DÙNG XỊN',
    '#c2410c',
    '#ffffff',
    maxAniso
  );
  const bookSign = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 1.6, 0.25),
    new THREE.MeshStandardMaterial({ map: bookSignTex, roughness: 0.4 })
  );
  bookSign.position.set(0, 6.7, -4.8);
  bookshopGroup.add(bookSign);
  root.add(bookshopGroup);
  colliders.push({ minX: 26.0, maxX: 36.0, minZ: 51.5, maxZ: 62.5 });
  zones.push({
    id: 'bookstore',
    label: 'Nhà Sách & Đồ Dùng Học Tập',
    sublabel: 'Mua Casio, Ba lô, iPad Pro & Workstation',
    x: 31,
    z: 47,
    radius: 4.2,
  });

  // Vehicle Showroom wing (x = 42)
  const showroomGroup = new THREE.Group();
  showroomGroup.position.set(42, 0, 57);
  const showMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.5 });
  const showBody = new THREE.Mesh(new THREE.BoxGeometry(10.5, 5.8, 10), showMat);
  showBody.position.set(0, 2.9, 0);
  showBody.castShadow = true;
  showroomGroup.add(showBody);

  const showGlass = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.2, 0.2), windowGlassMat);
  showGlass.position.set(0, 1.7, -5.05);
  showroomGroup.add(showGlass);

  // Rotating display mini-car in front of showroom
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.2, 0.35, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 })
  );
  pedestal.position.set(0, 0.18, -7.5);
  showroomGroup.add(pedestal);

  const displayCar = new THREE.Group();
  displayCar.position.set(0, 0.6, -7.5);
  const carHull = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.45, 2.6),
    new THREE.MeshPhysicalMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2, clearcoat: 1 })
  );
  const carTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.38, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
  );
  carTop.position.y = 0.38;
  displayCar.add(carHull, carTop);
  showroomGroup.add(displayCar);
  animatedProps.push((t) => {
    displayCar.rotation.y = t * 0.9;
  });

  const showSignTex = createSignTexture(
    'SHOWROOM XE & PHI CƠ',
    'XE ĐẠP · Ô TÔ · MÁY BAY ĐI HỌC',
    '#0369a1',
    '#ffffff',
    maxAniso
  );
  const showSign = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 1.6, 0.25),
    new THREE.MeshStandardMaterial({ map: showSignTex, roughness: 0.35 })
  );
  showSign.position.set(0, 6.8, -4.8);
  showroomGroup.add(showSign);

  root.add(showroomGroup);
  colliders.push({ minX: 36.5, maxX: 47.5, minZ: 51.5, maxZ: 62.5 });
  zones.push({
    id: 'vehicle_shop',
    label: 'Showroom Phương Tiện 3D',
    sublabel: 'Mua Xe đạp, Xe máy điện, Ô tô & Máy bay',
    x: 42,
    z: 47,
    radius: 4.5,
  });

  // 6E. TRẠM GRAB 8A3 (x = -4.5, z = 44.5 right across the crosswalk)
  const grabGroup = new THREE.Group();
  grabGroup.position.set(-4.5, 0, 44.8);
  const grabGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
  const grabRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 2.6), grabGreenMat);
  grabRoof.position.set(0, 2.9, 0);
  grabRoof.castShadow = true;
  grabGroup.add(grabRoof);

  [-1.8, 1.8].forEach((gx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.9, 8), ironMat);
    post.position.set(gx, 1.45, 0.9);
    grabGroup.add(post);
  });

  const grabSignTex = createSignTexture(
    'TRẠM GRAB 8A3',
    'ĐẶT XE NHANH · CHẠY GRAB KIẾM TIỀN',
    '#15803d',
    '#ffffff',
    maxAniso
  );
  const grabSign = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 1.0, 0.2),
    new THREE.MeshStandardMaterial({ map: grabSignTex, roughness: 0.35 })
  );
  grabSign.position.set(0, 3.6, 0);
  grabGroup.add(grabSign);

  // Parked green Grab scooter prop
  const gWheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12), ironMat);
  gWheel1.rotation.z = Math.PI / 2;
  gWheel1.position.set(1.2, 0.24, -0.5);
  const gWheel2 = gWheel1.clone();
  gWheel2.position.set(1.2, 0.24, 0.5);
  const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 1.1), grabGreenMat);
  gBody.position.set(1.2, 0.55, 0);
  grabGroup.add(gWheel1, gWheel2, gBody);

  root.add(grabGroup);
  zones.push({
    id: 'grab_hub',
    label: 'Trạm GrabBike / GrabCar',
    sublabel: 'Gọi xe Grab đi học hoặc Chạy cuốc kiếm tiền',
    x: -4.5,
    z: 44.5,
    radius: 3.8,
  });

  // =========================================================================
  // 6F. BẢO TÀNG TỈNH LẠNG SƠN (2 Tầng - Dịch ra ngoài bên Đông x = 46..68)
  // =========================================================================
  const museumGroup = new THREE.Group();
  const musWallMat = new THREE.MeshStandardMaterial({ color: 0xfaf5e8, roughness: 0.75 });
  const musTrimMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.55 });
  const musFloor1Mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
  const musFloor2Mat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 });
  const musRoofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
  const musGoldFrameMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.75 });
  const musBalconyGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.42,
    roughness: 0.1,
    metalness: 0.1,
  });
  const musDoorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.65 });
  const musDoorGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.48,
    roughness: 0.08,
    clearcoat: 1.0,
  });
  const musBrassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.85 });

  // Longer Paved Walkway connecting School East Courtyard (x=30) -> Museum West Gate (x=46)
  const musWalkway = new THREE.Mesh(new THREE.BoxGeometry(16, 0.07, 12), sidewalkMat);
  musWalkway.position.set(38, 0.01, 6);
  musWalkway.receiveShadow = true;
  museumGroup.add(musWalkway);

  // Decorative Walkway Lantern Posts between School and Museum
  [36, 42].forEach((wx) => {
    [-1.2, 13.2].forEach((wz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8), musTrimMat);
      post.position.set(wx, 1.1, wz);
      museumGroup.add(post);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), musBrassMat);
      top.position.set(wx, 2.25, wz);
      museumGroup.add(top);
    });
  });

  // Floor 1 Base Platform (x = 46..68, z = -18..14 -> center x=57, z=-2)
  const musBase = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.18, 32.4), musFloor1Mat);
  musBase.position.set(57, 0.04, -2);
  musBase.receiveShadow = true;
  museumGroup.add(musBase);

  // Exterior Museum Sign above West Entrance (facing school yard)
  const musSignTex = createSignTexture(
    'BẢO TÀNG TỈNH LẠNG SƠN',
    'TẦNG 1: DI TÍCH & TỦ NƯỚC · TẦNG 2: GẮP THÚ & KỶ NIỆM',
    '#7f1d1d',
    '#fde047',
    maxAniso
  );
  const musSign = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 1.9, 10.5),
    new THREE.MeshStandardMaterial({ map: musSignTex, roughness: 0.35 })
  );
  musSign.position.set(45.7, 5.2, 6);
  museumGroup.add(musSign);

  // South facade sign visible from the street
  const musSouthSign = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 1.9, 0.35),
    new THREE.MeshStandardMaterial({ map: musSignTex, roughness: 0.35 })
  );
  musSouthSign.position.set(56, 5.2, 14.3);
  museumGroup.add(musSouthSign);

  // Perimeter Walls (2 stories = 10.4m tall, leaving West doorway z=1.5..10.5 and South doorway x=52..60 open!)
  // North Wall (z = -18, x = 46..68)
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(22.4, 10.4, 0.55), musWallMat);
  wallN.position.set(57, 5.2, -18);
  wallN.castShadow = true;
  wallN.receiveShadow = true;
  museumGroup.add(wallN);
  colliders.push({ minX: 45.6, maxX: 68.4, minZ: -18.4, maxZ: -17.5 });

  // East Wall (x = 68, z = -18..14)
  const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.55, 10.4, 32.4), musWallMat);
  wallE.position.set(68, 5.2, -2);
  wallE.castShadow = true;
  wallE.receiveShadow = true;
  museumGroup.add(wallE);
  colliders.push({ minX: 67.5, maxX: 68.4, minZ: -18.4, maxZ: 14.4 });

  // West-North Wall (x = 46, z = -18..1.5 -> length 19.5, center -8.25)
  const wallWN = new THREE.Mesh(new THREE.BoxGeometry(0.55, 10.4, 19.5), musWallMat);
  wallWN.position.set(46, 5.2, -8.25);
  wallWN.castShadow = true;
  museumGroup.add(wallWN);
  colliders.push({ minX: 45.6, maxX: 46.4, minZ: -18.4, maxZ: 1.5 });

  // West-South Wall (x = 46, z = 10.5..14 -> length 3.5, center 12.25)
  const wallWS = new THREE.Mesh(new THREE.BoxGeometry(0.55, 10.4, 3.5), musWallMat);
  wallWS.position.set(46, 5.2, 12.25);
  wallWS.castShadow = true;
  museumGroup.add(wallWS);
  colliders.push({ minX: 45.6, maxX: 46.4, minZ: 10.5, maxZ: 14.4 });

  // West Doorway Lintel above z = 1.5..10.5 (y = 4.2..10.4)
  const wallWLintel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 6.2, 9.2), musWallMat);
  wallWLintel.position.set(46, 7.3, 6);
  museumGroup.add(wallWLintel);

  // Helper: Build real framed glass double doors angled inward (~65 deg) so entrance looks authentic & stays passable
  const buildMuseumDoubleDoor = (
    cx: number,
    cz: number,
    width: number,
    rotBaseY: number
  ) => {
    const dg = new THREE.Group();
    dg.position.set(cx, 0, cz);
    dg.rotation.y = rotBaseY;

    const halfW = width / 2;
    const leafW = halfW - 0.15;

    // Jamb posts & transom header
    [-halfW, halfW].forEach((jx) => {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.1, 0.58), musDoorFrameMat);
      jamb.position.set(jx, 2.05, 0);
      dg.add(jamb);
    });
    const transom = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.24, 0.58), musDoorFrameMat);
    transom.position.set(0, 4.05, 0);
    dg.add(transom);

    // Left & Right swung glass door leaves
    [-1, 1].forEach((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * (halfW - 0.12), 0, 0);
      pivot.rotation.y = side * 1.15; // Swung inward into museum lobby!

      const pane = new THREE.Mesh(new THREE.BoxGeometry(leafW, 3.65, 0.08), musDoorGlassMat);
      pane.position.set(-side * (leafW / 2), 1.9, 0);
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.18, 0.12), musDoorFrameMat);
      topRail.position.set(-side * (leafW / 2), 3.72, 0);
      const kickPlate = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.35, 0.12), musDoorFrameMat);
      kickPlate.position.set(-side * (leafW / 2), 0.18, 0);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), musBrassMat);
      handle.position.set(-side * (leafW - 0.22), 1.35, 0.09);

      pivot.add(pane, topRail, kickPlate, handle);
      dg.add(pivot);
    });

    museumGroup.add(dg);
  };

  // West Entrance Double Glass Doors (x = 46, z = 6, facing -X -> +X inside)
  buildMuseumDoubleDoor(46, 6, 8.6, Math.PI / 2);

  // South-West Wall (z = 14, x = 46..52 -> length 6, center 49)
  const wallSW = new THREE.Mesh(new THREE.BoxGeometry(6, 10.4, 0.55), musWallMat);
  wallSW.position.set(49, 5.2, 14);
  museumGroup.add(wallSW);
  colliders.push({ minX: 45.6, maxX: 52.0, minZ: 13.6, maxZ: 14.4 });

  // South-East Wall (z = 14, x = 60..68 -> length 8, center 64)
  const wallSE = new THREE.Mesh(new THREE.BoxGeometry(8, 10.4, 0.55), musWallMat);
  wallSE.position.set(64, 5.2, 14);
  museumGroup.add(wallSE);
  colliders.push({ minX: 60.0, maxX: 68.4, minZ: 13.6, maxZ: 14.4 });

  // South Doorway Lintel above x = 52..60 (y = 4.2..10.4)
  const wallSLintel = new THREE.Mesh(new THREE.BoxGeometry(8.2, 6.2, 0.55), musWallMat);
  wallSLintel.position.set(56, 7.3, 14);
  museumGroup.add(wallSLintel);

  // South Entrance Double Glass Doors (x = 56, z = 14, facing +Z -> -Z inside)
  buildMuseumDoubleDoor(56, 14, 7.6, Math.PI);

  // Traditional Layered Pagoda-style Museum Roof (y = 10.4..13.5)
  const musRoofLower = new THREE.Mesh(new THREE.BoxGeometry(24.2, 0.7, 34.2), musRoofMat);
  musRoofLower.position.set(57, 10.6, -2);
  musRoofLower.castShadow = true;
  museumGroup.add(musRoofLower);

  const musRoofTop = new THREE.Mesh(new THREE.ConeGeometry(16, 3.2, 4), musRoofMat);
  musRoofTop.position.set(57, 12.4, -2);
  musRoofTop.rotation.y = Math.PI / 4;
  musRoofTop.scale.set(1.0, 1.0, 1.35);
  musRoofTop.castShadow = true;
  museumGroup.add(musRoofTop);

  // Floor 2 Deck Slab (y = 5.2) leaving stairwell cutout (x = 61..67.8, z = -12.5..2.5)
  const f2MainWest = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.35, 31.6), musFloor2Mat);
  f2MainWest.position.set(53.5, 5.05, -2);
  f2MainWest.receiveShadow = true;
  museumGroup.add(f2MainWest);

  const f2EastNorth = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 5.2), musFloor2Mat);
  f2EastNorth.position.set(64.4, 5.05, -15.2);
  f2EastNorth.receiveShadow = true;
  museumGroup.add(f2EastNorth);

  const f2EastSouth = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 11.2), musFloor2Mat);
  f2EastSouth.position.set(64.4, 5.05, 8.2);
  f2EastSouth.receiveShadow = true;
  museumGroup.add(f2EastSouth);

  // Grand 3D Staircase from Floor 1 (z=2, y=0) up to Floor 2 (z=-12, y=5.2)
  const stairSteps = 18;
  for (let i = 0; i < stairSteps; i++) {
    const frac = (i + 0.5) / stairSteps;
    const stepY = frac * 5.2;
    const stepZ = 2 - frac * 14;
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.32, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 })
    );
    stepMesh.position.set(64, stepY, stepZ);
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    museumGroup.add(stepMesh);
  }
  const railGeo = new THREE.BoxGeometry(0.14, 0.9, 14.2);
  const leftStairRail = new THREE.Mesh(railGeo, musGoldFrameMat);
  leftStairRail.position.set(61.5, 3.0, -5);
  leftStairRail.rotation.x = Math.atan2(5.2, 14);
  museumGroup.add(leftStairRail);

  const f2StairGuard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 15.2), musBalconyGlassMat);
  f2StairGuard.position.set(61.0, 5.7, -5);
  museumGroup.add(f2StairGuard);
  colliders.push({ minX: 60.7, maxX: 61.3, minZ: -12.5, maxZ: 2.6, minY: 4.5, maxY: 8.0 });

  // Floor 1 Central Heritage Display Pedestal (Ải Chi Lăng / Thành Nhà Mạc miniature diorama) + Stanchions
  const pedBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.9, 16), musTrimMat);
  pedBase.position.set(53.5, 0.45, -2);
  museumGroup.add(pedBase);
  const dioramaMtn = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 1.25, 6),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
  );
  dioramaMtn.position.set(53.5, 1.45, -2);
  museumGroup.add(dioramaMtn);
  colliders.push({ minX: 51.2, maxX: 55.8, minZ: -4.2, maxZ: 0.2, minY: 0, maxY: 3.5 });

  // Brass Stanchion posts around central diorama
  [
    [50.8, -4.6],
    [56.2, -4.6],
    [50.8, 0.6],
    [56.2, 0.6],
  ].forEach(([sx, sz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.85, 8), musBrassMat);
    post.position.set(sx, 0.425, sz);
    museumGroup.add(post);
  });

  // Floor 1 Extra Furniture: 4 Glass Artifact Vitrines (Tủ kính trưng bày cổ vật)
  const vitrinePositions: Array<[number, number, number]> = [
    [49.8, -10.5, 0xfacc15], // Trống đồng Đông Sơn
    [57.2, -10.5, 0x22c55e], // Ngọc bích Lạng Sơn
    [50.0, -5.8, 0xe2e8f0], // Bình gốm cổ
    [59.5, 7.5, 0xf97316], // Ấn triện lịch sử
  ];
  vitrinePositions.forEach(([vx, vz, relicHex]) => {
    const vPed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 1.5), musTrimMat);
    vPed.position.set(vx, 0.48, vz);
    museumGroup.add(vPed);
    const vGlass = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.15, 1.36), musDoorGlassMat);
    vGlass.position.set(vx, 1.52, vz);
    museumGroup.add(vGlass);
    const relic = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 0),
      new THREE.MeshStandardMaterial({
        color: relicHex,
        metalness: 0.55,
        roughness: 0.25,
        emissive: relicHex,
        emissiveIntensity: 0.2,
      })
    );
    relic.position.set(vx, 1.45, vz);
    museumGroup.add(relic);
    animatedProps.push((t) => {
      relic.rotation.y = t * 1.4 + vx;
    });
    colliders.push({ minX: vx - 0.85, maxX: vx + 0.85, minZ: vz - 0.85, maxZ: vz + 0.85, minY: 0, maxY: 3.0 });
  });

  // Floor 1 Reception Desk + Museum Benches + Potted Plants
  const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 1.2), musTrimMat);
  deskMesh.position.set(58.8, 0.525, -4.0);
  museumGroup.add(deskMesh);
  colliders.push({ minX: 57.1, maxX: 60.5, minZ: -4.7, maxZ: -3.3, minY: 0, maxY: 2.5 });

  [
    [53.5, 9.2],
    [53.5, -14.5],
  ].forEach(([bx, bz]) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.95), musTrimMat);
    bench.position.set(bx, 0.225, bz);
    museumGroup.add(bench);
    colliders.push({ minX: bx - 1.45, maxX: bx + 1.45, minZ: bz - 0.5, maxZ: bz + 0.5, minY: 0, maxY: 1.8 });
  });

  [
    [47.2, -16.4],
    [66.2, -16.4],
    [47.2, 0.6],
    [66.2, 12.6],
  ].forEach(([px, pz]) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.26, 0.5, 10),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 })
    );
    pot.position.set(px, 0.25, pz);
    const bush = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
    );
    bush.position.set(px, 0.9, pz);
    museumGroup.add(pot, bush);
  });

  // Floor 1 Interactive TỦ NƯỚC BÁN TỰ ĐỘNG (Vending Machine) at (49.5, 12.6)
  const vmGroup = new THREE.Group();
  vmGroup.position.set(49.5, 0, 12.6);
  const vmBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 2.35, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.3 })
  );
  vmBody.position.set(0, 1.18, 0);
  vmBody.castShadow = true;
  vmGroup.add(vmBody);

  const vmGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.25, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x38bdf8, emissiveIntensity: 0.35 })
  );
  vmGlass.position.set(-0.12, 1.45, -0.5);
  vmGroup.add(vmGlass);

  // Drink cans visible inside vending window
  [0xfb923c, 0xfacc15, 0x4ade80, 0x38bdf8].forEach((canHex, row) => {
    for (let col = 0; col < 3; col++) {
      const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: canHex, roughness: 0.3 })
      );
      can.position.set(-0.36 + col * 0.24, 1.05 + row * 0.27, -0.53);
      vmGroup.add(can);
    }
  });
  const vmDispenser = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.28, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
  );
  vmDispenser.position.set(-0.12, 0.45, -0.51);
  vmGroup.add(vmDispenser);
  museumGroup.add(vmGroup);
  colliders.push({ minX: 48.6, maxX: 50.4, minZ: 11.9, maxZ: 13.3, minY: 0, maxY: 2.8 });

  // 8 Ornate Golden Gallery Frames on Floor 1 Walls (Only Super Admin can hang paintings)
  const f1BannerTex = createSignTexture(
    'TẦNG 1: KHU DI TÍCH & TRANH LẠNG SƠN',
    'CHỈ ADMIN CHÍNH MỚI CÓ QUYỀN TREO TRANH',
    '#78350f',
    '#fef08a',
    maxAniso
  );
  const f1Banner = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 1.1, 0.2),
    new THREE.MeshStandardMaterial({ map: f1BannerTex, roughness: 0.4 })
  );
  f1Banner.position.set(53.5, 4.1, -17.4);
  museumGroup.add(f1Banner);

  const f1FrameLayout: Array<{ slotId: string; x: number; y: number; z: number; rotY: number }> = [
    { slotId: 'frame_chi_lang_1', x: 50.2, y: 2.35, z: -17.55, rotY: 0 },
    { slotId: 'frame_chi_lang_2', x: 56.8, y: 2.35, z: -17.55, rotY: 0 },
    { slotId: 'frame_tam_thanh_1', x: 46.42, y: 2.35, z: -12.5, rotY: Math.PI / 2 },
    { slotId: 'frame_tam_thanh_2', x: 46.42, y: 2.35, z: -5.5, rotY: Math.PI / 2 },
    { slotId: 'frame_mac_1', x: 67.58, y: 2.35, z: 7.5, rotY: -Math.PI / 2 },
    { slotId: 'frame_mac_2', x: 67.58, y: 2.35, z: 11.5, rotY: -Math.PI / 2 },
    { slotId: 'frame_hvt_1', x: 49.0, y: 2.35, z: 13.55, rotY: Math.PI },
    { slotId: 'frame_hvt_2', x: 64.0, y: 2.35, z: 13.55, rotY: Math.PI },
  ];

  f1FrameLayout.forEach((fl) => {
    const fg = new THREE.Group();
    fg.position.set(fl.x, fl.y, fl.z);
    fg.rotation.y = fl.rotY;

    const border = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.3, 0.14), musGoldFrameMat);
    fg.add(border);

    const canvasMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55 });
    const canvasPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.95), canvasMat);
    canvasPlane.position.z = 0.08;
    fg.add(canvasPlane);
    museumFrameMeshes.set(fl.slotId, canvasPlane);

    museumGroup.add(fg);
  });

  // Floor 2 Zones: Play Corner + Claw Machine (South) & Memory Wall (North)
  const f2PlayTex = createSignTexture(
    'TẦNG 2: GẮP THÚ BÔNG & KHU VUI CHƠI',
    'MÁY GẮP THÚ BÔNG · ĐỐ VUI XỨ LẠNG',
    '#0369a1',
    '#ffffff',
    maxAniso
  );
  const f2PlaySign = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 1.1, 0.2),
    new THREE.MeshStandardMaterial({ map: f2PlayTex, roughness: 0.35 })
  );
  f2PlaySign.position.set(52, 9.2, 13.4);
  museumGroup.add(f2PlaySign);

  // 3D MÁY GẮP THÚ BÔNG (Claw Machine) on Floor 2 at (49.2, 5.2, 10.2)
  const clawGroup = new THREE.Group();
  clawGroup.position.set(49.2, 5.2, 10.2);
  const clawBaseMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.35 });
  const clawTopMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d, emissiveIntensity: 0.3 });

  const clawBottom = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.95, 1.35), clawBaseMat);
  clawBottom.position.set(0, 0.48, 0);
  clawGroup.add(clawBottom);

  const clawGlassBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.25, 1.2), musDoorGlassMat);
  clawGlassBox.position.set(0, 1.58, 0);
  clawGroup.add(clawGlassBox);

  const clawHeader = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.38, 1.38), clawTopMat);
  clawHeader.position.set(0, 2.38, 0);
  clawGroup.add(clawHeader);

  // Plushie balls inside claw machine + swinging 3D crane hook
  [
    [-0.4, 1.12, -0.25, 0xfacc15],
    [0.0, 1.12, 0.2, 0x38bdf8],
    [0.38, 1.12, -0.15, 0xf472b6],
    [-0.2, 1.12, 0.28, 0xd97706],
    [0.28, 1.12, 0.24, 0x4ade80],
  ].forEach(([px, py, pz, pHex]) => {
    const plush = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: pHex, roughness: 0.65 })
    );
    plush.position.set(px, py, pz);
    clawGroup.add(plush);
  });

  const craneHook = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.08, 0.48, 8),
    musBrassMat
  );
  craneHook.position.set(0, 1.92, 0);
  clawGroup.add(craneHook);
  animatedProps.push((t) => {
    craneHook.position.x = Math.sin(t * 1.3) * 0.4;
    craneHook.position.z = Math.cos(t * 0.9) * 0.3;
  });
  museumGroup.add(clawGroup);
  colliders.push({ minX: 48.2, maxX: 50.2, minZ: 9.4, maxZ: 11.0, minY: 4.8, maxY: 8.2 });

  // Floor 2 Play Kiosk & Souvenir Table
  const arcadeBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.1, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  arcadeBody.position.set(53.5, 6.25, 11.2);
  museumGroup.add(arcadeBody);
  const arcadeScreen = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.85, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 })
  );
  arcadeScreen.position.set(53.5, 6.7, 10.65);
  museumGroup.add(arcadeScreen);

  const f2Bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.9), musTrimMat);
  f2Bench.position.set(57.2, 5.42, 11.2);
  museumGroup.add(f2Bench);

  // Floor 2 Memory & Signature Wall (North Wall y = 5.2..10)
  const memBannerTex = createSignTexture(
    'BỨC TƯỜNG KỶ NIỆM & CHỮ KÝ LỚP 8A3',
    'MỌI NGƯỜI CHƠI ĐƯỢC TREO ẢNH & KÝ TÊN',
    '#6d28d9',
    '#fef08a',
    maxAniso
  );
  const memBanner = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 1.1, 0.2),
    new THREE.MeshStandardMaterial({ map: memBannerTex, roughness: 0.35 })
  );
  memBanner.position.set(53.5, 9.3, -17.4);
  museumGroup.add(memBanner);

  // Big wooden memory board backing + 6 dynamic 3D Memory Plaques
  const memBoard = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 3.2, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  memBoard.position.set(53.5, 7.2, -17.55);
  museumGroup.add(memBoard);

  for (let m = 0; m < 6; m++) {
    const col = m % 3;
    const row = Math.floor(m / 3);
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.3),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
    );
    plaque.position.set(49.9 + col * 3.6, 7.95 - row * 1.48, -17.44);
    museumGroup.add(plaque);
    museumMemoryMeshes.push(plaque);
  }

  root.add(museumGroup);

  zones.push({
    id: 'museum_floor1',
    label: 'Bảo Tàng Lạng Sơn · Tầng 1',
    sublabel: 'Khu Di Tích & Khung Tranh (Admin Chính treo tranh)',
    x: 53.5,
    z: 4.0,
    radius: 4.5,
  });

  zones.push({
    id: 'vending_machine',
    label: 'Tủ Nước Bán Tự Động',
    sublabel: 'Mua nước giải khát hồi Năng lượng ngay trong Bảo Tàng',
    x: 49.5,
    z: 10.5,
    radius: 3.4,
  });

  zones.push({
    id: 'museum_stairs',
    label: 'Cầu Thang Bảo Tàng (Tầng 1 ↔ Tầng 2)',
    sublabel: 'Đi bộ lên thang hoặc bấm [E] để chuyển tầng nhanh',
    x: 64.0,
    z: 3.0,
    radius: 3.4,
  });

  zones.push({
    id: 'museum_floor2_play',
    label: 'Bảo Tàng Tầng 2 · Máy Gắp Thú & Đố Vui',
    sublabel: 'Gắp Thú Bông 8A3 & Đố Vui Di Sản Lạng Sơn',
    x: 51.0,
    z: 8.5,
    radius: 4.4,
  });

  zones.push({
    id: 'museum_floor2_wall',
    label: 'Bảo Tàng Tầng 2 · Bức Tường Kỷ Niệm',
    sublabel: 'Treo ảnh kỷ niệm & Ký tên của bạn lên bảng',
    x: 53.5,
    z: -13.5,
    radius: 4.8,
  });

  // 7. Shady Campus & Street Trees using InstancedMesh
  const treeCoords = [
    [-16, -13],
    [-8, -14],
    [13, -13],
    [-23, 18],
    [22, 19],
    [27, 21],
    [-26, -10],
    [-16, 26],
    [17, 26],
    [-63, 44],
    [-46, 44],
    [-23, 44],
    [26, 44],
    [54, 44],
    [4, 65],
    [22, 65],
  ];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2f853c, roughness: 0.85 });
  const canopyInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(2.6, 1),
    canopyMat,
    treeCoords.length * 2
  );
  canopyInst.castShadow = true;
  const tint = new THREE.Color();
  let cIdx = 0;

  treeCoords.forEach(([tx, tz], idx) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 3.6, 8), trunkMat);
    trunk.position.set(tx, 1.8, tz);
    trunk.castShadow = true;
    root.add(trunk);

    const scale = 0.88 + (idx % 3) * 0.14;
    dummy.position.set(tx, 4.6, tz);
    dummy.scale.set(scale, scale * 0.85, scale);
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(cIdx, dummy.matrix);
    tint.setHSL(0.33 + (idx % 4) * 0.015, 0.55, 0.34 + (idx % 3) * 0.04);
    canopyInst.setColorAt(cIdx++, tint);

    dummy.position.set(tx + 0.9, 5.5, tz - 0.6);
    dummy.scale.set(scale * 0.72, scale * 0.68, scale * 0.72);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(cIdx, dummy.matrix);
    canopyInst.setColorAt(cIdx++, tint);
  });
  canopyInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  canopyInst.computeBoundingSphere();
  root.add(canopyInst);

  // 8. Interactive Zone Beacons + Good Deed Quest Props
  const ringGeo = new THREE.RingGeometry(1.5, 1.8, 32);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
  });
  zones.forEach((z) => {
    const ring = new THREE.Mesh(ringGeo, beaconMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(z.x, 0.09, z.z);
    root.add(ring);
    animatedProps.push((t) => {
      const s = 0.94 + Math.sin(t * 3 + z.x) * 0.08;
      ring.scale.set(s, s, 1);
    });
  });

  const deedRingMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
  });
  GOOD_DEED_SPOTS.forEach((spot, i) => {
    const g = new THREE.Group();
    g.position.set(spot.x, 0, spot.z);

    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 24), deedRingMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.09;
    g.add(ring);

    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.5,
      })
    );
    gem.position.y = 1.4;
    g.add(gem);

    if (spot.type === 'trash') {
      const bin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.26, 0.7, 10),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 })
      );
      bin.position.set(0.6, 0.35, 0);
      g.add(bin);
    } else if (spot.type === 'books') {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.14, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 })
      );
      book.position.set(0.4, 0.12, 0.2);
      g.add(book);
    } else if (spot.type === 'plant') {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.35, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
      );
      pot.position.set(0.5, 0.25, 0);
      g.add(pot);
    }

    animatedProps.push((t) => {
      gem.rotation.y = t * 2.2 + i;
      gem.position.y = 1.45 + Math.sin(t * 2.8 + i) * 0.18;
    });

    root.add(g);
    deedMeshes.set(spot.id, g);
    zones.push({
      id: 'good_deed',
      label: spot.title,
      sublabel: `+${spot.goodPoints} Điểm Người Tốt · +${(spot.moneyReward / 1000).toFixed(0)}k`,
      x: spot.x,
      z: spot.z,
      radius: 3.3,
      deedSpot: spot,
    });
  });

  // 9. Evening Street & Courtyard Lamps
  const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 });
  const lampCoords: Array<[number, number]> = [
    [-13, 18],
    [13, 18],
    [-21, 33],
    [21, 33],
    [-19, 44],
    [19, 44],
  ];
  lampCoords.forEach(([lx, lz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.6, 8), lampPostMat);
    post.position.set(lx, 2.3, lz);
    post.castShadow = true;
    root.add(post);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfde047,
      emissiveIntensity: 0.08,
      roughness: 0.2,
    });
    nightGlowMats.push(bulbMat);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), bulbMat);
    bulb.position.set(lx, 4.75, lz);
    root.add(bulb);

    const ptLight = new THREE.PointLight(0xfde68a, 0, 20, 1.6);
    ptLight.position.set(lx, 4.6, lz);
    root.add(ptLight);
    streetLamps.push(ptLight);
  });

  // 10. Crosswalk Traffic Lights (Đèn Giao Thông Cổng Trường z = 33..43)
  const signalPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const trafficCoords: Array<{ x: number; z: number; rotY: number }> = [
    { x: -5.8, z: 32.8, rotY: 0 },
    { x: 5.8, z: 43.2, rotY: Math.PI },
  ];
  trafficCoords.forEach((tc) => {
    const tg = new THREE.Group();
    tg.position.set(tc.x, 0, tc.z);
    tg.rotation.y = tc.rotY;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 4.2, 10), signalPoleMat);
    pole.position.y = 2.1;
    pole.castShadow = true;
    tg.add(pole);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.45, 0.45), housingMat);
    box.position.set(0, 4.25, 0);
    box.castShadow = true;
    tg.add(box);

    const rMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0xef4444, emissiveIntensity: 0.05 });
    const yMat = new THREE.MeshStandardMaterial({ color: 0x713f12, emissive: 0xfacc15, emissiveIntensity: 0.05 });
    const gMat = new THREE.MeshStandardMaterial({ color: 0x14532d, emissive: 0x22c55e, emissiveIntensity: 1.4 });
    trafficRedMats.push(rMat);
    trafficYellowMats.push(yMat);
    trafficGreenMats.push(gMat);

    const makeSignalBulb = (mat: THREE.MeshStandardMaterial, yOffset: number) => {
      const mFront = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat);
      mFront.position.set(0, yOffset, 0.21);
      const mBack = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat);
      mBack.position.set(0, yOffset, -0.21);
      tg.add(mFront, mBack);
    };
    makeSignalBulb(rMat, 4.65);
    makeSignalBulb(yMat, 4.25);
    makeSignalBulb(gMat, 3.85);

    root.add(tg);
  });

  return {
    root,
    zones,
    deedMeshes,
    museumFrameMeshes,
    museumMemoryMeshes,
    colliders,
    animatedProps,
    nightGlowMats,
    streetLamps,
    trafficLights: {
      redMats: trafficRedMats,
      yellowMats: trafficYellowMats,
      greenMats: trafficGreenMats,
      stopLineMats,
    },
  };
}
