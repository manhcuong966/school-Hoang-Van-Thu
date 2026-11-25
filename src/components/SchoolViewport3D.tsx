import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getRequiredUniformForDay, MUSEUM_SLOTS, VEHICLES } from '../data/gameData';
import { buildHoangVanThuCampus, CampusBuildResult } from '../three/campusBuilder';
import {
  createFloatingNameTag,
  createStudentRig,
  FloatingNameTag,
  StudentRig,
} from '../three/characterBuilder';
import {
  ActiveGrabMission,
  DayOfWeek,
  InteractiveZone,
  MuseumArtwork,
  MuseumMemory,
  OutfitId,
  PlayerPresence,
  PlayerState,
  UniformId,
  VehicleId,
} from '../types/game';
import { PeriodOfDay } from '../utils/schoolTime';
import { getTrafficLightState } from '../utils/trafficLight';

export interface TeleportTarget {
  x: number;
  z: number;
  y?: number;
}

interface SchoolViewport3DProps {
  playerState: PlayerState;
  dayOfWeek: DayOfWeek;
  periodOfDay: PeriodOfDay;
  activeGrabMission: ActiveGrabMission | null;
  remotePlayers: PlayerPresence[];
  museumArtworks: Map<string, MuseumArtwork>;
  museumMemories: MuseumMemory[];
  moveInputRef: React.MutableRefObject<{ x: number; y: number }>;
  wheelieInputRef: React.MutableRefObject<boolean>;
  recklessInputRef: React.MutableRefObject<boolean>;
  teleportTargetRef: React.MutableRefObject<TeleportTarget | null>;
  onNearestZoneChange: (zone: InteractiveZone | null) => void;
  onInteractZone: (zone: InteractiveZone) => void;
  onPositionUpdate: (x: number, z: number, rotY: number, effectiveVehicle: VehicleId) => void;
  onRedLightViolation: () => void;
  onHelmetViolation: () => void;
  onStowStateChange: (stowed: boolean, effectiveVehicle: VehicleId) => void;
  onStuntStateChange: (isWheelie: boolean, isReckless: boolean) => void;
}

// Pre-allocated math helpers (zero GC inside render loop)
const _moveDir = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

interface RemotePlayerEntry {
  rig: StudentRig;
  tag: FloatingNameTag;
  targetX: number;
  targetZ: number;
  targetRotY: number;
  vehicleId: PlayerPresence['equippedVehicle'];
  uniformId: UniformId;
  outfitId: OutfitId;
  wearingHelmet: boolean;
  isWheelie: boolean;
  isReckless: boolean;
  hairKey: string;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[i];
      lineCount += 1;
      if (lineCount >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}

export const SchoolViewport3D: React.FC<SchoolViewport3DProps> = ({
  playerState,
  dayOfWeek,
  periodOfDay,
  activeGrabMission,
  remotePlayers,
  museumArtworks,
  museumMemories,
  moveInputRef,
  wheelieInputRef,
  recklessInputRef,
  teleportTargetRef,
  onNearestZoneChange,
  onInteractZone,
  onPositionUpdate,
  onRedLightViolation,
  onHelmetViolation,
  onStowStateChange,
  onStuntStateChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const stateRef = useRef(playerState);
  stateRef.current = playerState;

  const dayOfWeekRef = useRef(dayOfWeek);
  dayOfWeekRef.current = dayOfWeek;

  const periodOfDayRef = useRef(periodOfDay);
  periodOfDayRef.current = periodOfDay;

  const grabMissionRef = useRef<ActiveGrabMission | null>(activeGrabMission);
  grabMissionRef.current = activeGrabMission;

  const remotePlayersRef = useRef<PlayerPresence[]>(remotePlayers);
  remotePlayersRef.current = remotePlayers;

  const onNearestZoneRef = useRef(onNearestZoneChange);
  onNearestZoneRef.current = onNearestZoneChange;

  const onInteractRef = useRef(onInteractZone);
  onInteractRef.current = onInteractZone;

  const onPositionUpdateRef = useRef(onPositionUpdate);
  onPositionUpdateRef.current = onPositionUpdate;

  const onRedLightViolationRef = useRef(onRedLightViolation);
  onRedLightViolationRef.current = onRedLightViolation;

  const onHelmetViolationRef = useRef(onHelmetViolation);
  onHelmetViolationRef.current = onHelmetViolation;

  const onStowStateChangeRef = useRef(onStowStateChange);
  onStowStateChangeRef.current = onStowStateChange;

  const onStuntStateChangeRef = useRef(onStuntStateChange);
  onStuntStateChangeRef.current = onStuntStateChange;

  const rigRef = useRef<StudentRig | null>(null);
  const playerYRef = useRef(0);
  const effectiveVehicleRef = useRef<VehicleId>(playerState.equippedVehicle);
  const isStowedRef = useRef(false);
  const npcRigsRef = useRef<
    Array<{ rig: StudentRig; baseX: number; baseZ: number; phase: number; wander: boolean }>
  >([]);
  const remoteMapRef = useRef<Map<string, RemotePlayerEntry>>(new Map());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const maxAnisoRef = useRef(4);
  const deedMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const museumMeshesRef = useRef<{
    frames: Map<string, THREE.Mesh>;
    memories: THREE.Mesh[];
  } | null>(null);
  const grabBeaconRef = useRef<{
    group: THREE.Group;
    beamMat: THREE.MeshBasicMaterial;
    ringMat: THREE.MeshBasicMaterial;
    gemMat: THREE.MeshStandardMaterial;
    gem: THREE.Mesh;
  } | null>(null);
  const nearestZoneRef = useRef<InteractiveZone | null>(null);
  const envRefs = useRef<{
    scene: THREE.Scene;
    hemi: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
    nightGlowMats: THREE.MeshStandardMaterial[];
    streetLamps: THREE.PointLight[];
    trafficLights: CampusBuildResult['trafficLights'];
  } | null>(null);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    rig.updateLook(playerState.look, playerState.vipClaimedThisWeek);
  }, [playerState.look, playerState.vipClaimedThisWeek]);

  useEffect(() => {
    rigRef.current?.updateOutfit(playerState.equippedUniform, playerState.equippedOutfit || 'school_uniform');
  }, [playerState.equippedUniform, playerState.equippedOutfit]);

  useEffect(() => {
    rigRef.current?.updateSupply(playerState.equippedSupply);
  }, [playerState.equippedSupply]);

  useEffect(() => {
    const eff = isStowedRef.current ? 'walk' : playerState.equippedVehicle;
    effectiveVehicleRef.current = eff;
    rigRef.current?.updateVehicle(eff);
    const needsHelmet = eff === 'scooter' || eff === 'motorbike';
    rigRef.current?.updateHelmet(playerState.wearingHelmet && needsHelmet);
  }, [playerState.equippedVehicle, playerState.wearingHelmet]);

  useEffect(() => {
    const req = getRequiredUniformForDay(dayOfWeek);
    const npcUniform: UniformId = req.required === 'any' ? 'white_246' : req.required;
    npcRigsRef.current.forEach((n) => n.rig.updateUniform(npcUniform));
  }, [dayOfWeek]);

  // Synchronize Floor 1 Museum Painting Frames with Firestore /museumArtworks
  useEffect(() => {
    const museum = museumMeshesRef.current;
    if (!museum) return;
    let cancelled = false;

    museum.frames.forEach((mesh, slotId) => {
      const slotDef = MUSEUM_SLOTS.find((s) => s.slotId === slotId);
      const art = museumArtworks.get(slotId);
      const mat = mesh.material as THREE.MeshStandardMaterial;

      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawEmpty = () => {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, 384, 256);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, 360, 232);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, 336, 208);
        ctx.setLineDash([]);

        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(slotDef?.frameLabel || slotId, 192, 68);

        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(slotDef?.sectionLabel || 'Khu Di Tích Lạng Sơn', 192, 98);

        ctx.fillStyle = '#1e293b';
        ctx.font = '14px sans-serif';
        wrapCanvasText(
          ctx,
          slotDef?.defaultTitle || 'Khung Tranh Triển Lãm',
          192,
          136,
          300,
          20,
          2
        );

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Khung trống · Chỉ Admin Chính được treo tranh', 192, 206);
      };

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisoRef.current;

      if (!art || !art.imageDataUrl) {
        drawEmpty();
        tex.needsUpdate = true;
      } else {
        // Initial loading background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 384, 256);
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(art.title.slice(0, 32), 192, 128);
        tex.needsUpdate = true;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          ctx.drawImage(img, 0, 0, 384, 214);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(0, 214, 384, 42);
          ctx.fillStyle = '#fde047';
          ctx.textAlign = 'left';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(art.title.slice(0, 38), 12, 238);
          tex.needsUpdate = true;
        };
        img.onerror = () => {
          if (cancelled) return;
          drawEmpty();
          tex.needsUpdate = true;
        };
        img.src = art.imageDataUrl;
      }

      if (mat.map) {
        mat.map.dispose();
      }
      mat.map = tex;
      mat.color.setHex(0xffffff);
      mat.needsUpdate = true;
    });

    return () => {
      cancelled = true;
    };
  }, [museumArtworks]);

  // Synchronize Floor 2 Memory & Signature Wall Plaques with Firestore /museumMemories
  useEffect(() => {
    const museum = museumMeshesRef.current;
    if (!museum) return;
    let cancelled = false;

    museum.memories.forEach((mesh, idx) => {
      const mem = museumMemories[idx];
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const canvas = document.createElement('canvas');
      canvas.width = 420;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisoRef.current;

      if (!mem) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, 420, 180);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.strokeRect(10, 10, 400, 160);
        ctx.setLineDash([]);
        ctx.fillStyle = '#78350f';
        ctx.textAlign = 'center';
        ctx.font = 'bold 17px sans-serif';
        ctx.fillText(`Bảng Kỷ Niệm #${idx + 1}`, 210, 78);
        ctx.fillStyle = '#92400e';
        ctx.font = '14px sans-serif';
        ctx.fillText('Bấm [E] để treo ảnh & ký tên của bạn!', 210, 110);
        tex.needsUpdate = true;
      } else {
        const drawCardBase = (photoImg?: HTMLImageElement, sigImg?: HTMLImageElement) => {
          ctx.fillStyle = mem.cardColor || '#fef3c7';
          ctx.fillRect(0, 0, 420, 180);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 4;
          ctx.strokeRect(4, 4, 412, 172);

          // Left photo frame
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(14, 16, 128, 148);
          if (photoImg) {
            ctx.drawImage(photoImg, 14, 16, 128, 148);
          } else {
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText('KỶ NIỆM 8A3', 78, 94);
          }

          // Author & message
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(mem.authorName.slice(0, 22), 156, 34);

          ctx.fillStyle = '#475569';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(mem.authorRoleLabel || 'Thành viên 8A3', 156, 52);

          ctx.fillStyle = '#1e293b';
          ctx.font = '13px sans-serif';
          wrapCanvasText(ctx, mem.message || 'Ghé thăm Bảo Tàng Lạng Sơn!', 156, 76, 248, 17, 3);

          // Signature area bottom right
          ctx.fillStyle = 'rgba(255,255,255,0.82)';
          ctx.fillRect(156, 124, 248, 44);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(156, 124, 248, 44);
          if (sigImg) {
            ctx.drawImage(sigImg, 160, 126, 240, 40);
          } else {
            ctx.fillStyle = '#64748b';
            ctx.font = 'italic 12px sans-serif';
            ctx.fillText(`Ký tên: ${mem.authorName}`, 166, 150);
          }
          tex.needsUpdate = true;
        };

        let loadedPhoto: HTMLImageElement | undefined;
        let loadedSig: HTMLImageElement | undefined;
        drawCardBase();

        if (mem.photoDataUrl) {
          const pImg = new Image();
          pImg.crossOrigin = 'anonymous';
          pImg.onload = () => {
            if (cancelled) return;
            loadedPhoto = pImg;
            drawCardBase(loadedPhoto, loadedSig);
          };
          pImg.src = mem.photoDataUrl;
        }
        if (mem.signatureDataUrl) {
          const sImg = new Image();
          sImg.crossOrigin = 'anonymous';
          sImg.onload = () => {
            if (cancelled) return;
            loadedSig = sImg;
            drawCardBase(loadedPhoto, loadedSig);
          };
          sImg.src = mem.signatureDataUrl;
        }
      }

      if (mat.map) {
        mat.map.dispose();
      }
      mat.map = tex;
      mat.color.setHex(0xffffff);
      mat.needsUpdate = true;
    });

    return () => {
      cancelled = true;
    };
  }, [museumMemories]);

  // Synchronize remote multiplayer 3D characters
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const map = remoteMapRef.current;
    const activeIds = new Set(remotePlayers.map((p) => p.uid));

    Array.from(map.entries()).forEach(([uid, entry]) => {
      if (!activeIds.has(uid)) {
        scene.remove(entry.rig.root);
        entry.tag.dispose();
        map.delete(uid);
      }
    });

    const now = Date.now();
    remotePlayers.forEach((rp) => {
      const hasViolation = rp.redLightViolationAt > 0 && now - rp.redLightViolationAt < 60000;
      const needsHel = rp.equippedVehicle === 'scooter' || rp.equippedVehicle === 'motorbike';
      const noHelmet =
        (needsHel && !rp.wearingHelmet) ||
        (rp.helmetViolationAt > 0 && now - rp.helmetViolationAt < 60000);
      const rpOutfit: OutfitId = rp.equippedOutfit || 'school_uniform';
      const rpGender = rp.gender || 'male';
      const hairKey = `${rpGender}|${rp.hairStyle}|${rp.hasGlasses}|${rp.skinTone}|${rp.vipClaimed}`;
      let entry = map.get(rp.uid);
      if (!entry) {
        const rig = createStudentRig(
          {
            name: rp.studentName,
            gender: rpGender,
            faceDataUrl: null,
            hairStyle: rp.hairStyle,
            hasGlasses: rp.hasGlasses,
            skinTone: rp.skinTone,
          },
          rp.equippedUniform,
          'basic_books',
          rp.equippedVehicle,
          rp.vipClaimed,
          maxAnisoRef.current
        );
        if (rpOutfit !== 'school_uniform') {
          rig.updateOutfit(rp.equippedUniform, rpOutfit);
        }
        rig.updateHelmet(Boolean(rp.wearingHelmet) && needsHel);
        const tag = createFloatingNameTag();
        tag.sprite.position.y = rp.equippedVehicle === 'plane' ? 4.5 : 2.75;
        tag.update(
          rp.studentName,
          rp.roleType,
          rp.roleLabel,
          rp.micActive,
          rp.micMuted,
          hasViolation,
          {
            isDelinquent: rp.isDelinquent,
            noHelmet,
            isReckless: rp.isReckless,
            isWheelie: rp.isWheelie,
          }
        );
        rig.root.add(tag.sprite);
        rig.root.position.set(rp.x, 0, rp.z);
        rig.root.rotation.y = rp.rotY;
        scene.add(rig.root);
        entry = {
          rig,
          tag,
          targetX: rp.x,
          targetZ: rp.z,
          targetRotY: rp.rotY,
          vehicleId: rp.equippedVehicle,
          uniformId: rp.equippedUniform,
          outfitId: rpOutfit,
          wearingHelmet: Boolean(rp.wearingHelmet),
          isWheelie: Boolean(rp.isWheelie),
          isReckless: Boolean(rp.isReckless),
          hairKey,
        };
        map.set(rp.uid, entry);
      } else {
        entry.targetX = rp.x;
        entry.targetZ = rp.z;
        entry.targetRotY = rp.rotY;
        entry.isWheelie = Boolean(rp.isWheelie);
        entry.isReckless = Boolean(rp.isReckless);
        if (entry.uniformId !== rp.equippedUniform || entry.outfitId !== rpOutfit) {
          entry.uniformId = rp.equippedUniform;
          entry.outfitId = rpOutfit;
          entry.rig.updateOutfit(rp.equippedUniform, rpOutfit);
        }
        if (entry.vehicleId !== rp.equippedVehicle || entry.wearingHelmet !== Boolean(rp.wearingHelmet)) {
          entry.vehicleId = rp.equippedVehicle;
          entry.wearingHelmet = Boolean(rp.wearingHelmet);
          entry.rig.updateVehicle(rp.equippedVehicle);
          entry.rig.updateHelmet(entry.wearingHelmet && needsHel);
          entry.tag.sprite.position.y = rp.equippedVehicle === 'plane' ? 4.5 : 2.75;
        }
        if (entry.hairKey !== hairKey) {
          entry.hairKey = hairKey;
          entry.rig.updateLook(
            {
              name: rp.studentName,
              gender: rpGender,
              faceDataUrl: null,
              hairStyle: rp.hairStyle,
              hasGlasses: rp.hasGlasses,
              skinTone: rp.skinTone,
            },
            rp.vipClaimed
          );
        }
        entry.tag.update(
          rp.studentName,
          rp.roleType,
          rp.roleLabel,
          rp.micActive,
          rp.micMuted,
          hasViolation,
          {
            isDelinquent: rp.isDelinquent,
            noHelmet,
            isReckless: rp.isReckless,
            isWheelie: rp.isWheelie,
          }
        );
      }
    });
  }, [remotePlayers]);

  useEffect(() => {
    const env = envRefs.current;
    if (!env) return;

    const applyPeriod = (p: PeriodOfDay) => {
      if (p === 'morning') {
        env.scene.background = new THREE.Color(0xc5e3ff);
        env.scene.fog = new THREE.FogExp2(0xc5e3ff, 0.0065);
        env.hemi.color.setHex(0xdbeafe);
        env.hemi.groundColor.setHex(0x78716c);
        env.hemi.intensity = 0.78;
        env.sun.color.setHex(0xfff4db);
        env.sun.intensity = 1.48;
        env.sun.position.set(32, 48, 36);
        env.rimLight.color.setHex(0xbae6fd);
        env.rimLight.intensity = 0.42;
        env.streetLamps.forEach((l) => {
          l.intensity = 0;
        });
        env.nightGlowMats.forEach((m) => {
          m.emissiveIntensity = 0.08;
        });
      } else if (p === 'afternoon') {
        env.scene.background = new THREE.Color(0xfcd9b6);
        env.scene.fog = new THREE.FogExp2(0xfcd9b6, 0.0072);
        env.hemi.color.setHex(0xfef3c7);
        env.hemi.groundColor.setHex(0x78716c);
        env.hemi.intensity = 0.72;
        env.sun.color.setHex(0xfdba74);
        env.sun.intensity = 1.38;
        env.sun.position.set(-42, 26, 28);
        env.rimLight.color.setHex(0xfde68a);
        env.rimLight.intensity = 0.48;
        env.streetLamps.forEach((l) => {
          l.intensity = 0.25;
        });
        env.nightGlowMats.forEach((m) => {
          m.emissiveIntensity = 0.25;
        });
      } else {
        env.scene.background = new THREE.Color(0x0f172a);
        env.scene.fog = new THREE.FogExp2(0x0f172a, 0.0085);
        env.hemi.color.setHex(0x334155);
        env.hemi.groundColor.setHex(0x1e293b);
        env.hemi.intensity = 0.55;
        env.sun.color.setHex(0x93c5fd);
        env.sun.intensity = 0.62;
        env.sun.position.set(-22, 40, -24);
        env.rimLight.color.setHex(0x60a5fa);
        env.rimLight.intensity = 0.35;
        env.streetLamps.forEach((l) => {
          l.intensity = 2.2;
        });
        env.nightGlowMats.forEach((m) => {
          m.emissiveIntensity = 1.1;
        });
      }
    };

    applyPeriod(periodOfDay);
  }, [periodOfDay]);

  useEffect(() => {
    deedMeshesRef.current.forEach((group, id) => {
      group.visible = !playerState.completedDeedIdsToday.includes(id);
    });
  }, [playerState.completedDeedIdsToday]);

  useEffect(() => {
    const beacon = grabBeaconRef.current;
    if (!beacon) return;
    if (activeGrabMission) {
      beacon.group.visible = true;
      const isPickup = activeGrabMission.stage === 'pickup';
      const bx = isPickup ? activeGrabMission.pickupX : activeGrabMission.targetX;
      const bz = isPickup ? activeGrabMission.pickupZ : activeGrabMission.targetZ;
      beacon.group.position.set(bx, 0, bz);
      beacon.beamMat.color.setHex(isPickup ? 0xf59e0b : 0x22c55e);
      beacon.ringMat.color.setHex(isPickup ? 0xfbbf24 : 0x4ade80);
      beacon.gemMat.color.setHex(isPickup ? 0xf59e0b : 0x22c55e);
      beacon.gemMat.emissive.setHex(isPickup ? 0xd97706 : 0x16a34a);
    } else {
      beacon.group.visible = false;
    }
  }, [activeGrabMission]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const skyColor = 0xc5e3ff;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.007);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.2,
      300
    );

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x78716c, 0.72);
    hemi.position.set(0, 40, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4db, 1.45);
    sun.position.set(32, 48, 36);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 175;
    sun.shadow.camera.left = -76;
    sun.shadow.camera.right = 76;
    sun.shadow.camera.top = 76;
    sun.shadow.camera.bottom = -76;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.42);
    rimLight.position.set(-25, 18, -32);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    maxAnisoRef.current = maxAniso;
    const campus = buildHoangVanThuCampus(maxAniso);
    scene.add(campus.root);
    deedMeshesRef.current = campus.deedMeshes;
    museumMeshesRef.current = {
      frames: campus.museumFrameMeshes,
      memories: campus.museumMemoryMeshes,
    };

    envRefs.current = {
      scene,
      hemi,
      sun,
      rimLight,
      nightGlowMats: campus.nightGlowMats,
      streetLamps: campus.streetLamps,
      trafficLights: campus.trafficLights,
    };

    const curPeriod = periodOfDayRef.current;
    if (curPeriod === 'afternoon') {
      scene.background = new THREE.Color(0xfcd9b6);
      scene.fog = new THREE.FogExp2(0xfcd9b6, 0.0072);
      hemi.color.setHex(0xfef3c7);
      hemi.intensity = 0.72;
      sun.color.setHex(0xfdba74);
      sun.intensity = 1.38;
      sun.position.set(-42, 26, 28);
      campus.streetLamps.forEach((l) => {
        l.intensity = 0.25;
      });
      campus.nightGlowMats.forEach((m) => {
        m.emissiveIntensity = 0.25;
      });
    } else if (curPeriod === 'evening') {
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.FogExp2(0x0f172a, 0.0085);
      hemi.color.setHex(0x334155);
      hemi.groundColor.setHex(0x1e293b);
      hemi.intensity = 0.55;
      sun.color.setHex(0x93c5fd);
      sun.intensity = 0.62;
      sun.position.set(-22, 40, -24);
      campus.streetLamps.forEach((l) => {
        l.intensity = 2.2;
      });
      campus.nightGlowMats.forEach((m) => {
        m.emissiveIntensity = 1.1;
      });
    }

    campus.deedMeshes.forEach((group, id) => {
      group.visible = !stateRef.current.completedDeedIdsToday.includes(id);
    });

    // Dynamic Grab Pickup / Delivery Beacon
    const grabGroup = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 14, 16, 1, true), beamMat);
    beam.position.y = 7;
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
    const beaconRing = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.2, 28), ringMat);
    beaconRing.rotation.x = -Math.PI / 2;
    beaconRing.position.y = 0.12;
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const beaconGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), gemMat);
    beaconGem.position.y = 2.6;
    grabGroup.add(beam, beaconRing, beaconGem);
    grabGroup.visible = Boolean(grabMissionRef.current);
    if (grabMissionRef.current) {
      const m = grabMissionRef.current;
      const isPickup = m.stage === 'pickup';
      grabGroup.position.set(isPickup ? m.pickupX : m.targetX, 0, isPickup ? m.pickupZ : m.targetZ);
      beamMat.color.setHex(isPickup ? 0xf59e0b : 0x22c55e);
      ringMat.color.setHex(isPickup ? 0xfbbf24 : 0x4ade80);
      gemMat.color.setHex(isPickup ? 0xf59e0b : 0x22c55e);
      gemMat.emissive.setHex(isPickup ? 0xd97706 : 0x16a34a);
    }
    scene.add(grabGroup);
    grabBeaconRef.current = {
      group: grabGroup,
      beamMat,
      ringMat,
      gemMat,
      gem: beaconGem,
    };

    // Build Main Player Rig outside school gate
    const initial = stateRef.current;
    const playerRig = createStudentRig(
      initial.look,
      initial.equippedUniform,
      initial.equippedSupply,
      initial.equippedVehicle,
      initial.vipClaimedThisWeek,
      maxAniso
    );
    playerRig.updateOutfit(initial.equippedUniform, initial.equippedOutfit || 'school_uniform');
    playerRig.updateHelmet(
      initial.wearingHelmet &&
        (initial.equippedVehicle === 'scooter' || initial.equippedVehicle === 'motorbike')
    );
    playerRig.root.position.set(0, 0, 31.0);
    playerRig.root.rotation.y = Math.PI;
    scene.add(playerRig.root);
    rigRef.current = playerRig;

    // Ambient NPC Classmates around campus
    const reqInit = getRequiredUniformForDay(dayOfWeekRef.current);
    const initNpcUniform: UniformId = reqInit.required === 'any' ? 'white_246' : reqInit.required;
    const npcConfigs = [
      { name: 'Minh Anh', gender: 'female' as const, x: -3.5, z: 12, hair: 'long_straight' as const, glasses: false, wander: true },
      { name: 'Gia Bảo', gender: 'male' as const, x: 5.5, z: 10, hair: 'side_part' as const, glasses: true, wander: true },
      { name: 'Khánh Linh', gender: 'female' as const, x: -16.8, z: 0.5, hair: 'twin_tails' as const, glasses: false, wander: false },
    ];
    npcRigsRef.current = npcConfigs.map((cfg, idx) => {
      const rig = createStudentRig(
        {
          name: cfg.name,
          gender: cfg.gender,
          faceDataUrl: null,
          hairStyle: cfg.hair,
          hasGlasses: cfg.glasses,
          skinTone: '#f4c7a5',
        },
        initNpcUniform,
        'basic_books',
        'walk',
        false,
        maxAniso
      );
      rig.root.position.set(cfg.x, 0, cfg.z);
      scene.add(rig.root);
      return { rig, baseX: cfg.x, baseZ: cfg.z, phase: idx * 1.4, wander: cfg.wander };
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const keys: Record<string, boolean> = {};
    let camYaw = 0;
    let camPitch = 0.42;
    let camDist = 9.8;
    let isDragging = false;
    let lastPtrX = 0;
    let lastPtrY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys[e.code] = true;
      if (e.code === 'KeyE' && nearestZoneRef.current) {
        onInteractRef.current(nearestZoneRef.current);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPtrX = e.clientX;
      lastPtrY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPtrX;
      const dy = e.clientY - lastPtrY;
      lastPtrX = e.clientX;
      lastPtrY = e.clientY;
      camYaw -= dx * 0.0065;
      camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.005, 0.16, 1.15);
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.008, 5, 24);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    camera.position.set(0, 5.2, 40.5);
    camera.lookAt(0, 1.4, 31);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let lastNetEmitMs = 0;
    let lastViolationTriggerMs = 0;
    let lastHelmetWarnMs = 0;
    let prevStuntWheelie = false;
    let prevStuntReckless = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const checkCollision = (
      nx: number,
      ny: number,
      nz: number,
      prevX: number,
      prevZ: number,
      canFly: boolean
    ): boolean => {
      if (nx < -68 || nx > 76 || nz < -38 || nz > 78) return true;
      if (canFly) return false;

      // Prevent falling backward into the stairwell from Floor 2 South edge (Museum X shifted +12)
      if (ny >= 3.2 && prevZ > 2.45 && nz <= 2.45 && nx >= 60.8 && nx <= 67.8) {
        return true;
      }

      // Prevent clipping under the concrete staircase from Ground Floor sides/back
      const wasInStairOpening = prevX >= 60.8 && prevX <= 67.8 && prevZ <= 2.5 && prevZ >= -12.5;
      if (ny < 0.35 && !wasInStairOpening && nx >= 60.8 && nx <= 67.8 && nz >= -12.5 && nz <= 0.6) {
        return true;
      }

      for (let i = 0; i < campus.colliders.length; i++) {
        const c = campus.colliders[i];
        const minY = c.minY ?? -1;
        const maxY = c.maxY ?? 20;
        if (ny < maxY && ny + 1.6 > minY) {
          if (nx > c.minX - 0.45 && nx < c.maxX + 0.45 && nz > c.minZ - 0.45 && nz < c.maxZ + 0.45) {
            return true;
          }
        }
      }
      return false;
    };

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.elapsedTime;
      const nowMs = Date.now();

      const curState = stateRef.current;

      let teleported = false;
      if (teleportTargetRef.current) {
        const ty = teleportTargetRef.current.y ?? 0;
        playerYRef.current = ty;
        playerRig.root.position.set(teleportTargetRef.current.x, ty, teleportTargetRef.current.z);
        teleportTargetRef.current = null;
        teleported = true;
      }

      const curX = playerRig.root.position.x;
      const curZ = playerRig.root.position.z;
      const prevZ = curZ;

      const curInSchool = curX >= -26 && curX <= 31 && curZ >= -30 && curZ <= 29.2;
      const curInMuseum = curX >= 45.5 && curX <= 68.5 && curZ >= -18.5 && curZ <= 14.5;
      const curStowed = (curInSchool || curInMuseum) && curState.equippedVehicle !== 'walk';
      const activeVehiclePre: VehicleId = curStowed ? 'walk' : curState.equippedVehicle;
      const vehicleDefPre = VEHICLES.find((v) => v.id === activeVehiclePre) || VEHICLES[0];

      const canPreStunt =
        curState.isDelinquent &&
        !curStowed &&
        (activeVehiclePre === 'bike' || activeVehiclePre === 'scooter' || activeVehiclePre === 'motorbike');
      const isWheelieNow = canPreStunt && Boolean(keys['Space'] || wheelieInputRef.current);
      const isRecklessNow =
        canPreStunt && Boolean(keys['ShiftLeft'] || keys['ShiftRight'] || recklessInputRef.current);

      let inX = moveInputRef.current.x;
      let inY = moveInputRef.current.y;
      if (keys['KeyW'] || keys['ArrowUp']) inY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) inY += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) inX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) inX += 1;

      const mag = Math.hypot(inX, inY);
      const isMoving = mag > 0.05;
      if (isMoving) {
        const normX = inX / Math.max(1, mag);
        const normY = inY / Math.max(1, mag);
        const sinY = Math.sin(camYaw);
        const cosY = Math.cos(camYaw);
        _moveDir.set(normX * cosY + normY * sinY, 0, -normX * sinY + normY * cosY).normalize();

        const moveSpeed = vehicleDefPre.speed * (isRecklessNow ? 1.45 : 1.0);
        const step = moveSpeed * dt;
        const curY = playerYRef.current;
        const nextX = curX + _moveDir.x * step;
        const nextZ = curZ + _moveDir.z * step;

        if (!checkCollision(nextX, curY, curZ, curX, curZ, vehicleDefPre.canFly)) {
          playerRig.root.position.x = nextX;
        }
        const afterX = playerRig.root.position.x;
        if (!checkCollision(afterX, curY, nextZ, afterX, curZ, vehicleDefPre.canFly)) {
          playerRig.root.position.z = nextZ;
        }

        const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
        let diff = targetAngle - playerRig.root.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerRig.root.rotation.y += diff * Math.min(1, dt * 12);
      }

      const pxNow = playerRig.root.position.x;
      const pzNow = playerRig.root.position.z;

      // Re-evaluate indoor auto-stow immediately after movement or teleport
      const isInSchool = pxNow >= -26 && pxNow <= 31 && pzNow >= -30 && pzNow <= 29.2;
      const isInMuseum = pxNow >= 45.5 && pxNow <= 68.5 && pzNow >= -18.5 && pzNow <= 14.5;
      const isStowed = (isInSchool || isInMuseum) && curState.equippedVehicle !== 'walk';
      const effectiveVehicle: VehicleId = isStowed ? 'walk' : curState.equippedVehicle;
      const effectiveDef = VEHICLES.find((v) => v.id === effectiveVehicle) || VEHICLES[0];

      if (effectiveVehicle !== effectiveVehicleRef.current || isStowed !== isStowedRef.current) {
        effectiveVehicleRef.current = effectiveVehicle;
        isStowedRef.current = isStowed;
        playerRig.updateVehicle(effectiveVehicle);
        const needsHelmet = effectiveVehicle === 'scooter' || effectiveVehicle === 'motorbike';
        playerRig.updateHelmet(curState.wearingHelmet && needsHelmet);
        onStowStateChangeRef.current(isStowed, effectiveVehicle);
        onPositionUpdateRef.current(pxNow, pzNow, playerRig.root.rotation.y, effectiveVehicle);
      }

      if (isWheelieNow !== prevStuntWheelie || isRecklessNow !== prevStuntReckless) {
        prevStuntWheelie = isWheelieNow;
        prevStuntReckless = isRecklessNow;
        onStuntStateChangeRef.current(isWheelieNow, isRecklessNow);
      }

      // Mandatory helmet check when riding electric scooter / motorbike outdoors
      if (
        !isStowed &&
        (effectiveVehicle === 'scooter' || effectiveVehicle === 'motorbike') &&
        isMoving &&
        !curState.wearingHelmet &&
        nowMs - lastHelmetWarnMs > 12000
      ) {
        lastHelmetWarnMs = nowMs;
        onHelmetViolationRef.current();
      }

      // Compute 2-Story Museum floor / ramp elevation (shifted +12m East)
      if (!effectiveDef.canFly) {
        const inMuseumFootprint = pxNow >= 46.0 && pxNow <= 68.0 && pzNow >= -18.0 && pzNow <= 14.0;
        const inStairwell = pxNow >= 61.0 && pxNow <= 67.6 && pzNow >= -12.5 && pzNow <= 2.5;
        if (inStairwell) {
          const frac = THREE.MathUtils.clamp((2.0 - pzNow) / 14.0, 0, 1);
          playerYRef.current = frac * 5.2;
        } else if (inMuseumFootprint && playerYRef.current >= 2.8) {
          playerYRef.current = 5.2;
        } else {
          playerYRef.current = 0;
        }
      } else {
        playerYRef.current = 0;
      }
      playerRig.root.position.y = playerYRef.current;

      playerRig.animate(
        elapsed,
        (effectiveDef.speed * (isRecklessNow ? 1.45 : 1.0)) / 6.5,
        isMoving,
        effectiveVehicle,
        isWheelieNow,
        isRecklessNow
      );

      // Emit local player transform for multiplayer & crosswalk HUD
      if ((isMoving || teleported) && nowMs - lastNetEmitMs > 160) {
        lastNetEmitMs = nowMs;
        onPositionUpdateRef.current(
          pxNow,
          pzNow,
          playerRig.root.rotation.y,
          effectiveVehicle
        );
      }

      // Synchronized 3D Traffic Light & Stop-Line Glow + Exact Stop-Line Violation Detection
      const tl = getTrafficLightState(nowMs);
      campus.trafficLights.redMats.forEach((m) => {
        m.emissiveIntensity = tl.phase === 'red' ? 2.4 : 0.04;
      });
      campus.trafficLights.yellowMats.forEach((m) => {
        m.emissiveIntensity = tl.phase === 'yellow' ? 2.4 : 0.04;
      });
      campus.trafficLights.greenMats.forEach((m) => {
        m.emissiveIntensity = tl.phase === 'green' ? 2.4 : 0.04;
      });

      const stopHex =
        tl.phase === 'red' ? 0xef4444 : tl.phase === 'yellow' ? 0xfacc15 : 0x22c55e;
      campus.trafficLights.stopLineMats.forEach((m) => {
        m.color.setHex(stopHex);
        m.emissive.setHex(stopHex);
        m.emissiveIntensity = tl.phase === 'red' ? 1.5 : 0.85;
      });

      // Exact stop-line crossing: Z = 33.3 (school side -> road) or Z = 42.7 (town side -> road)
      const crossedSouthStop = prevZ < 33.3 && pzNow >= 33.3;
      const crossedNorthStop = prevZ > 42.7 && pzNow <= 42.7;
      if (
        !teleported &&
        !effectiveDef.canFly &&
        tl.phase === 'red' &&
        (crossedSouthStop || crossedNorthStop) &&
        Math.abs(pxNow) <= 24 &&
        nowMs - lastViolationTriggerMs > 8000
      ) {
        lastViolationTriggerMs = nowMs;
        onRedLightViolationRef.current();
      }

      for (let i = 0; i < campus.animatedProps.length; i++) {
        campus.animatedProps[i](elapsed);
      }

      if (grabGroup.visible) {
        beaconGem.rotation.y = elapsed * 3.0;
        beaconGem.position.y = 2.6 + Math.sin(elapsed * 4) * 0.3;
      }

      // Smoothly interpolate & animate real multiplayer players
      remoteMapRef.current.forEach((entry, uid) => {
        const dx = entry.targetX - entry.rig.root.position.x;
        const dz = entry.targetZ - entry.rig.root.position.z;
        const dist = Math.hypot(dx, dz);
        const lerpF = 1 - Math.exp(-9.0 * dt);
        entry.rig.root.position.x += dx * lerpF;
        entry.rig.root.position.z += dz * lerpF;
        let rDiff = entry.targetRotY - entry.rig.root.rotation.y;
        while (rDiff > Math.PI) rDiff -= Math.PI * 2;
        while (rDiff < -Math.PI) rDiff += Math.PI * 2;
        entry.rig.root.rotation.y += rDiff * lerpF;
        const rv = VEHICLES.find((v) => v.id === entry.vehicleId) || VEHICLES[0];
        entry.rig.animate(
          elapsed + uid.charCodeAt(0) * 0.2,
          (rv.speed * (entry.isReckless ? 1.45 : 1.0)) / 6.5,
          dist > 0.08,
          entry.vehicleId,
          entry.isWheelie,
          entry.isReckless
        );
      });

      for (let i = 0; i < npcRigsRef.current.length; i++) {
        const npc = npcRigsRef.current[i];
        if (npc.wander) {
          const t = elapsed * 0.65 + npc.phase;
          const nx = npc.baseX + Math.cos(t) * 2.1;
          const nz = npc.baseZ + Math.sin(t) * 1.6;
          const dx = nx - npc.rig.root.position.x;
          const dz = nz - npc.rig.root.position.z;
          npc.rig.root.position.set(nx, 0, nz);
          npc.rig.root.rotation.y = Math.atan2(dx, dz);
          npc.rig.animate(elapsed + npc.phase, 0.75, true, 'walk');
        } else {
          npc.rig.animate(elapsed + npc.phase, 0, false, 'walk');
        }
      }

      // Proximity check (prioritize 2-stage Grab Pickup / Dropoff!)
      let foundZone: InteractiveZone | null = null;
      const mission = grabMissionRef.current;
      if (mission && playerYRef.current < 2.6) {
        if (mission.stage === 'pickup') {
          const distToPickup = Math.hypot(pxNow - mission.pickupX, pzNow - mission.pickupZ);
          if (distToPickup <= 4.8) {
            foundZone = {
              id: 'grab_pickup',
              label:
                mission.missionKind === 'food'
                  ? `Lấy đồ ăn tại: ${mission.pickupLabel}`
                  : `Lấy hàng / Đón khách: ${mission.pickupLabel}`,
              sublabel: `Sau đó giao tới ${mission.targetLabel}`,
              x: mission.pickupX,
              z: mission.pickupZ,
              radius: 4.8,
            };
          }
        } else {
          const distToDrop = Math.hypot(pxNow - mission.targetX, pzNow - mission.targetZ);
          if (distToDrop <= 4.8) {
            foundZone = {
              id: 'grab_dropoff',
              label: `Giao đơn tới: ${mission.targetLabel}`,
              sublabel: `Khách hàng: ${mission.customer} (+${(mission.rewardMoney / 1000).toFixed(0)}k)`,
              x: mission.targetX,
              z: mission.targetZ,
              radius: 4.8,
            };
          }
        }
      }

      if (!foundZone) {
        let bestDist = Infinity;
        const onFloor2 = playerYRef.current >= 2.6;
        for (let i = 0; i < campus.zones.length; i++) {
          const z = campus.zones[i];
          if (z.id === 'good_deed' && z.deedSpot && curState.completedDeedIdsToday.includes(z.deedSpot.id)) {
            continue;
          }
          if (z.id === 'museum_floor1' && onFloor2) continue;
          if ((z.id === 'museum_floor2_play' || z.id === 'museum_floor2_wall') && !onFloor2) continue;

          if (z.id === 'museum_stairs') {
            const stairTargetZ = onFloor2 ? -13.5 : 3.0;
            const dStairs = Math.hypot(pxNow - z.x, pzNow - stairTargetZ);
            if (dStairs <= z.radius && dStairs < bestDist) {
              bestDist = dStairs;
              foundZone = {
                ...z,
                label: onFloor2 ? 'Cầu Thang · Xuống Tầng 1' : 'Cầu Thang · Lên Tầng 2',
                sublabel: onFloor2
                  ? 'Bấm [E] để xuống Khu Di Tích Tầng 1'
                  : 'Đi bộ lên thang hoặc bấm [E] lên Tầng 2',
              };
            }
            continue;
          }

          if (
            onFloor2 &&
            z.id !== 'museum_floor2_play' &&
            z.id !== 'museum_floor2_wall'
          ) {
            continue;
          }

          const d = Math.hypot(pxNow - z.x, pzNow - z.z);
          if (d <= z.radius && d < bestDist) {
            bestDist = d;
            foundZone = z;
          }
        }
      }

      if (
        nearestZoneRef.current?.id !== foundZone?.id ||
        nearestZoneRef.current?.label !== foundZone?.label ||
        nearestZoneRef.current?.deedSpot?.id !== foundZone?.deedSpot?.id
      ) {
        nearestZoneRef.current = foundZone;
        onNearestZoneRef.current(foundZone);
      }

      const flyLift = effectiveDef.canFly ? 2.1 : 0;
      const py = playerYRef.current;
      const horizDist = camDist * Math.cos(camPitch);
      const vertDist = camDist * Math.sin(camPitch) + 1.6 + flyLift + py;
      _desiredCamPos.set(
        pxNow + Math.sin(camYaw) * horizDist,
        vertDist,
        pzNow + Math.cos(camYaw) * horizDist
      );
      const dampFactor = 1 - Math.exp(-8.5 * dt);
      camera.position.lerp(_desiredCamPos, dampFactor);
      _lookTarget.set(pxNow, 1.35 + flyLift + py, pzNow);
      camera.lookAt(_lookTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      campus.museumFrameMeshes.forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
      });
      campus.museumMemoryMeshes.forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
      });
      museumMeshesRef.current = null;
      remoteMapRef.current.forEach((entry) => entry.tag.dispose());
      remoteMapRef.current.clear();
      sceneRef.current = null;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.dispose();
      if (dom.parentNode === container) {
        container.removeChild(dom);
      }
    };
  }, [moveInputRef, wheelieInputRef, recklessInputRef, teleportTargetRef]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-slate-100 p-6">
          <div className="max-w-md text-center space-y-2">
            <h2 className="font-display text-xl font-bold">Đang khôi phục đồ họa 3D</h2>
            <p className="text-sm text-slate-300">
              Ngữ cảnh WebGL tạm thời bị gián đoạn. Vui lòng đợi trong giây lát hoặc tải lại trang.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
