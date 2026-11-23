import * as THREE from 'three';
import { OutfitId, UniformId } from '../types/game';

function configureColorTexture(tex: THREE.CanvasTexture, maxAniso: number, repeatX = 1, repeatY = 1) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAniso);
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createBrickCourtyardTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a86954';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 16;
  const w = 512 / cols;
  const h = 512 / rows;

  const tones = ['#b5735c', '#a4644e', '#985c48', '#bf7c64', '#ad6b55'];
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (w * 0.5);
    for (let c = -1; c <= cols; c++) {
      ctx.fillStyle = tones[(r * 7 + c * 3 + 10) % tones.length];
      ctx.fillRect(c * w + offset + 2, r * h + 2, w - 4, h - 4);
      ctx.fillStyle = 'rgba(255,235,220,0.08)';
      ctx.fillRect(c * w + offset + 2, r * h + 2, w - 4, 3);
    }
  }
  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso, 14, 14);
}

export function createRoadTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3c424d';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 2500; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Center dashed line
  ctx.fillStyle = '#f8fafc';
  for (let x = 20; x < 512; x += 86) {
    ctx.fillRect(x, 250, 48, 12);
  }
  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso, 8, 1);
}

export function createTurfTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3f9b2c';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const x = (i * 47) % 256;
    const y = (i * 89) % 256;
    ctx.fillStyle = i % 2 === 0 ? '#4cb335' : '#328221';
    ctx.fillRect(x, y, 3, 3);
  }
  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso, 4, 2);
}

export function createStageCanopySignTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 160);

  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 1008, 144);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('THÀNH CÔNG CỦA HỌC TRÒ LÀ VINH QUANG CỦA NGƯỜI THẦY', 512, 82);

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createStageFasciaTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#881337';
  ctx.fillRect(0, 0, 1024, 140);

  // Gold star top center
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  const cx = 512;
  const cy = 36;
  const outer = 20;
  const inner = 8;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 31px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NƯỚC CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM MUÔN NĂM', 512, 98);

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createStageLedTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 1024, 512);
  grad.addColorStop(0, '#0ea5e9');
  grad.addColorStop(0.5, '#38bdf8');
  grad.addColorStop(1, '#22c55e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Sunburst rays
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(512, 240);
    const a1 = (i * Math.PI) / 6;
    const a2 = a1 + 0.14;
    ctx.lineTo(512 + Math.cos(a1) * 700, 240 + Math.sin(a1) * 700);
    ctx.lineTo(512 + Math.cos(a2) * 700, 240 + Math.sin(a2) * 700);
    ctx.closePath();
    ctx.fill();
  }

  // School crest badge
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(512, 85, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 24px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1962', 512, 93);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px Outfit, sans-serif';
  ctx.fillText('UBND PHƯỜNG KỲ LỪA · TP. LẠNG SƠN', 512, 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 50px Outfit, sans-serif';
  ctx.fillText('TRƯỜNG THCS HOÀNG VĂN THỤ', 512, 230);

  ctx.fillStyle = '#fef08a';
  ctx.font = '800 64px Outfit, sans-serif';
  ctx.fillText('CHÀO MỪNG TẬP THỂ LỚP 8A3', 512, 330);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px Outfit, sans-serif';
  ctx.fillText('ĐOÀN KẾT · KỶ CƯƠNG · HỌC TỐT · KHỞI NGHIỆP', 512, 415);

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createMottoBannerTexture(lines: string[], maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e7d58b';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 236, 492);

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 34px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const startY = 110;
  const step = 95;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 128, startY + idx * step);
  });

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createSignTexture(
  title: string,
  subtitle: string,
  bgColor: string,
  textColor: string,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 180);

  ctx.fillStyle = textColor;
  ctx.font = '800 44px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 84);

  ctx.fillStyle = '#fef08a';
  ctx.font = '600 24px Outfit, sans-serif';
  ctx.fillText(subtitle, 256, 138);

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createUniformTorsoTexture(uniformId: UniformId, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (uniformId === 'green_35') {
    // Image 1: Áo lacoste xanh cốm - cổ bẻ xanh than - 2 cúc trắng - logo ngực
    ctx.fillStyle = '#84cc16'; // Xanh cốm
    ctx.fillRect(0, 0, 512, 512);

    // Subtle fabric texture
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < 512; y += 6) {
      ctx.fillRect(0, y, 512, 2);
    }

    // Navy collar (cổ bẻ dệt xanh than)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(155, 0);
    ctx.lineTo(357, 0);
    ctx.lineTo(335, 76);
    ctx.lineTo(256, 44);
    ctx.lineTo(177, 76);
    ctx.closePath();
    ctx.fill();

    // Placket + 2 white buttons
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(240, 44, 32, 115);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 82, 7, 0, Math.PI * 2);
    ctx.arc(256, 126, 7, 0, Math.PI * 2);
    ctx.fill();

    // Yellow circular school badge on left chest (viewer right)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(348, 175, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(348, 172, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1962', 348, 205);
  } else if (uniformId === 'white_246') {
    // Image 2: Đồng phục trắng, cổ xanh cốm, khăn quàng đỏ, logo ngực
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Lime-green polo collar
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.moveTo(155, 0);
    ctx.lineTo(357, 0);
    ctx.lineTo(335, 72);
    ctx.lineTo(256, 42);
    ctx.lineTo(177, 72);
    ctx.closePath();
    ctx.fill();

    // Placket
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(242, 42, 28, 105);

    // Red pioneer scarf (Khăn quàng đỏ)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(190, 26);
    ctx.lineTo(322, 26);
    ctx.lineTo(278, 132);
    ctx.lineTo(256, 265);
    ctx.lineTo(222, 132);
    ctx.closePath();
    ctx.fill();

    // Hanging scarf tails
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(240, 128);
    ctx.lineTo(220, 290);
    ctx.lineTo(246, 290);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(272, 128);
    ctx.lineTo(296, 285);
    ctx.lineTo(268, 285);
    ctx.closePath();
    ctx.fill();

    // Scarf knot
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(236, 98, 40, 32);

    // Left chest crest
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(356, 178, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else {
    // VIP 8A3 Royal Varsity Jacket
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(200, 0, 112, 512);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(194, 0, 8, 512);
    ctx.fillRect(310, 0, 8, 512);

    ctx.fillStyle = '#facc15';
    ctx.font = '800 44px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('8A3', 385, 190);
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillText('VIP', 385, 224);
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createOutfitTorsoTexture(outfitId: OutfitId, maxAniso: number): THREE.CanvasTexture {
  if (outfitId === 'school_uniform') {
    return createUniformTorsoTexture('white_246', maxAniso);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (outfitId === 'street_hoodie') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);
    // Orange chest stripe + pocket + 8A3 print
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 140, 512, 46);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(120, 310, 272, 140, 22);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(228, 30);
    ctx.lineTo(228, 128);
    ctx.moveTo(284, 30);
    ctx.lineTo(284, 128);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STREET 8A3', 256, 255);
  } else if (outfitId === 'bomber_ls') {
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 0, 512, 512);
    // Collar + zipper + varsity patch
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(150, 0, 212, 42);
    ctx.fillRect(0, 455, 512, 57);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(250, 42, 12, 413);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(348, 175, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.font = '800 28px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LS', 348, 185);
  } else if (outfitId === 'sport_track') {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(110, 0, 24, 512);
    ctx.fillRect(378, 0, 24, 512);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(190, 0, 132, 85);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 54px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('08', 256, 235);
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.fillText('LẠNG SƠN RUN', 256, 280);
  } else if (outfitId === 'ao_dai_vn') {
    ctx.fillStyle = '#be185d';
    ctx.fillRect(0, 0, 512, 512);
    // Traditional collar + lotus pattern
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(175, 0, 162, 44);
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(256, 150 + i * 70, 18 - i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 150, 34, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // formal_suit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);
    // White dress shirt V + crimson tie + lapels
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(185, 0);
    ctx.lineTo(327, 0);
    ctx.lineTo(256, 230);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(240, 26);
    ctx.lineTo(272, 26);
    ctx.lineTo(268, 210);
    ctx.lineTo(256, 238);
    ctx.lineTo(244, 210);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(246, 270, 20, 20);
    ctx.fillRect(246, 340, 20, 20);
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createDefaultFaceTexture(
  skinTone: string,
  hasGlasses: boolean,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = skinTone;
  ctx.fillRect(0, 0, 256, 256);

  // Cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
  ctx.beginPath();
  ctx.arc(68, 152, 22, 0, Math.PI * 2);
  ctx.arc(188, 152, 22, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(64, 96);
  ctx.lineTo(100, 92);
  ctx.moveTo(156, 92);
  ctx.lineTo(192, 96);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(84, 122, 12, 0, Math.PI * 2);
  ctx.arc(172, 122, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(88, 118, 4, 0, Math.PI * 2);
  ctx.arc(176, 118, 4, 0, Math.PI * 2);
  ctx.fill();

  // Glasses if enabled
  if (hasGlasses) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(52, 102, 62, 42);
    ctx.strokeRect(142, 102, 62, 42);
    ctx.beginPath();
    ctx.moveTo(114, 120);
    ctx.lineTo(142, 120);
    ctx.stroke();
  }

  // Smile
  ctx.strokeStyle = '#9f1239';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(128, 174, 28, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso);
}

export function createFaceTextureFromImage(
  dataUrl: string,
  skinTone: string,
  hasGlasses: boolean,
  maxAniso: number
): Promise<THREE.CanvasTexture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = skinTone;
      ctx.fillRect(0, 0, 256, 256);

      // Draw centered square crop of face photo
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(14, 14, 228, 228, 36);
      ctx.clip();

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 14, 14, 228, 228);
      ctx.restore();

      // Optional stylish glasses overlay
      if (hasGlasses) {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.lineWidth = 5;
        ctx.strokeRect(54, 100, 58, 38);
        ctx.strokeRect(144, 100, 58, 38);
        ctx.beginPath();
        ctx.moveTo(112, 118);
        ctx.lineTo(144, 118);
        ctx.stroke();
      }

      resolve(configureColorTexture(new THREE.CanvasTexture(canvas), maxAniso));
    };
    img.onerror = () => {
      resolve(createDefaultFaceTexture(skinTone, hasGlasses, maxAniso));
    };
    img.src = dataUrl;
  });
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
