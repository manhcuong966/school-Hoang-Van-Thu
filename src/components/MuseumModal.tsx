import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Crown,
  Eraser,
  Gamepad2,
  ImagePlus,
  Landmark,
  Layers,
  Lock,
  PenTool,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  buildLangSonPresetPainting,
  formatVND,
  MUSEUM_QUIZ_QUESTIONS,
  MUSEUM_SLOTS,
  PLUSHIE_PRIZES,
} from '../data/gameData';
import {
  MuseumArtwork,
  MuseumMemory,
  MuseumSectionId,
  MuseumSlotDef,
  PlushiePrizeDef,
} from '../types/game';

export type MuseumTabId = 'floor1' | 'floor2_play' | 'floor2_wall';

interface MuseumModalProps {
  isOpen: boolean;
  initialTab: MuseumTabId;
  onClose: () => void;
  isSuperAdmin: boolean;
  myUid: string;
  myName: string;
  myRoleLabel: string;
  hasFullAccess: boolean;
  playerMoney: number;
  artworks: Map<string, MuseumArtwork>;
  memories: MuseumMemory[];
  onSaveArtwork: (input: {
    slotId: string;
    section: MuseumSectionId;
    title: string;
    caption: string;
    imageDataUrl: string;
  }) => Promise<void>;
  onDeleteArtwork: (slotId: string) => Promise<void>;
  onCreateMemory: (input: {
    message: string;
    photoDataUrl: string;
    signatureDataUrl: string;
    cardColor: string;
  }) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onPlayMuseumQuizReward: (money: number, xp: number, note: string) => void;
  onClawMachineReward: (prize: PlushiePrizeDef | null, cost: number) => void;
  onTeleportFloor: (floor: 1 | 2) => void;
}

const SECTION_TABS: Array<{ id: MuseumSectionId | 'all'; label: string }> = [
  { id: 'all', label: 'Tất cả (8 khung)' },
  { id: 'chi_lang', label: 'Ải Chi Lăng' },
  { id: 'tam_thanh', label: 'Tam Thanh' },
  { id: 'mac_dynasty', label: 'Thành Nhà Mạc' },
  { id: 'hoang_van_thu', label: 'Hoàng Văn Thụ' },
];

const CARD_COLORS = [
  { hex: '#fef3c7', label: 'Giấy Vàng Cổ' },
  { hex: '#e0f2fe', label: 'Xanh Lạng Sơn' },
  { hex: '#fce7f3', label: 'Hoa Đào Mẫu Sơn' },
  { hex: '#dcfce7', label: 'Xanh Cốm 8A3' },
];

const PEN_COLORS = ['#0f172a', '#1d4ed8', '#b91c1c', '#15803d'];

async function compressImageFile(file: File, maxWidth = 380, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Trình duyệt không hỗ trợ nén ảnh.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 180000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export const MuseumModal: React.FC<MuseumModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  isSuperAdmin,
  myUid,
  myName,
  myRoleLabel,
  hasFullAccess,
  playerMoney,
  artworks,
  memories,
  onSaveArtwork,
  onDeleteArtwork,
  onCreateMemory,
  onDeleteMemory,
  onPlayMuseumQuizReward,
  onClawMachineReward,
  onTeleportFloor,
}) => {
  const [activeTab, setActiveTab] = useState<MuseumTabId>(initialTab);
  const [playSubMode, setPlaySubMode] = useState<'claw' | 'quiz'>('claw');
  const [sectionFilter, setSectionFilter] = useState<MuseumSectionId | 'all'>('all');
  const [selectedSlot, setSelectedSlot] = useState<MuseumSlotDef>(MUSEUM_SLOTS[0]);

  // Floor 1 Curator Form (Super Admin Only)
  const [artTitle, setArtTitle] = useState('');
  const [artCaption, setArtCaption] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artSaving, setArtSaving] = useState(false);
  const [artFeedback, setArtFeedback] = useState<string | null>(null);

  // Floor 2 Claw Machine State
  const [clawPos, setClawPos] = useState(50);
  const [clawDropping, setClawDropping] = useState(false);
  const [clawResult, setClawResult] = useState<{ prize: PlushiePrizeDef | null; note: string } | null>(null);
  const [caughtPlushies, setCaughtPlushies] = useState<PlushiePrizeDef[]>([]);
  const clawDirRef = useRef(1);

  // Floor 2 Heritage Quiz State
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizCompletedRound, setQuizCompletedRound] = useState(false);

  // Floor 2 Memory Wall & Signature Pad State
  const [memMessage, setMemMessage] = useState('');
  const [memPhotoUrl, setMemPhotoUrl] = useState('');
  const [memCardColor, setMemCardColor] = useState(CARD_COLORS[0].hex);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [hasSignature, setHasSignature] = useState(false);
  const [memSaving, setMemSaving] = useState(false);
  const [memFeedback, setMemFeedback] = useState<string | null>(null);

  // Webcam quick capture for Memory Wall
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamErr, setWebcamErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setArtFeedback(null);
      setMemFeedback(null);
      setClawResult(null);
    }
  }, [isOpen, initialTab]);

  // Smooth rail animation for Claw Machine
  useEffect(() => {
    if (!isOpen || activeTab !== 'floor2_play' || playSubMode !== 'claw' || clawDropping) return;
    let lastTs = performance.now();
    let rafId = 0;
    const step = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      setClawPos((prev) => {
        let next = prev + clawDirRef.current * dt * 68;
        if (next >= 90) {
          next = 90;
          clawDirRef.current = -1;
        } else if (next <= 10) {
          next = 10;
          clawDirRef.current = 1;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, activeTab, playSubMode, clawDropping]);

  // Sync curator inputs when selecting a slot
  useEffect(() => {
    const existing = artworks.get(selectedSlot.slotId);
    setArtTitle(existing?.title || selectedSlot.defaultTitle);
    setArtCaption(existing?.caption || selectedSlot.defaultCaption);
    setArtImageUrl(existing?.imageDataUrl || '');
    setArtFeedback(null);
  }, [selectedSlot, artworks]);

  // Clean up webcam stream on close or disable
  useEffect(() => {
    if (!isOpen || !webcamActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }
    let cancelled = false;
    setWebcamErr(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 480, height: 360 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWebcamErr('Không truy cập được webcam. Bạn có thể tải ảnh từ máy.');
          setWebcamActive(false);
        }
      });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, webcamActive]);

  if (!isOpen) return null;

  const visibleSlots =
    sectionFilter === 'all'
      ? MUSEUM_SLOTS
      : MUSEUM_SLOTS.filter((s) => s.section === sectionFilter);

  const selectedArtwork = artworks.get(selectedSlot.slotId);

  const handleUploadArtFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 380, 0.72);
      setArtImageUrl(compressed);
      setArtFeedback('Đã nén ảnh vừa khung tranh! Hãy bấm "Lưu & Treo Tranh".');
    } catch (err) {
      setArtFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh.');
    }
    e.target.value = '';
  };

  const handleGeneratePresetArt = () => {
    const dataUrl = buildLangSonPresetPainting(
      selectedSlot.section,
      artTitle || selectedSlot.defaultTitle
    );
    setArtImageUrl(dataUrl);
    setArtFeedback('Đã tạo tranh phong cảnh Lạng Sơn! Bấm "Lưu & Treo Tranh" để trưng bày.');
  };

  const handleSaveSlotArtwork = async () => {
    if (!isSuperAdmin) return;
    if (!artImageUrl.trim()) {
      setArtFeedback('Vui lòng chọn ảnh tải lên hoặc tạo tranh mẫu Lạng Sơn trước.');
      return;
    }
    setArtSaving(true);
    setArtFeedback(null);
    try {
      await onSaveArtwork({
        slotId: selectedSlot.slotId,
        section: selectedSlot.section,
        title: artTitle.trim() || selectedSlot.defaultTitle,
        caption: artCaption.trim() || selectedSlot.defaultCaption,
        imageDataUrl: artImageUrl,
      });
      setArtFeedback('Đã treo tranh thành công lên tường Bảo Tàng Tầng 1!');
    } catch (err) {
      setArtFeedback(err instanceof Error ? err.message : 'Không thể lưu tranh.');
    } finally {
      setArtSaving(false);
    }
  };

  const handleRemoveSlotArtwork = async () => {
    if (!isSuperAdmin) return;
    setArtSaving(true);
    setArtFeedback(null);
    try {
      await onDeleteArtwork(selectedSlot.slotId);
      setArtImageUrl('');
      setArtFeedback('Đã gỡ tranh khỏi khung trưng bày.');
    } catch (err) {
      setArtFeedback(err instanceof Error ? err.message : 'Không thể gỡ tranh.');
    } finally {
      setArtSaving(false);
    }
  };

  // Signature Pad Drawing Handlers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height,
    };
  };

  const handleSigDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    isDrawingRef.current = true;
    setHasSignature(true);
  };

  const handleSigMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = sigCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handleSigUp = () => {
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = sigCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSnapWebcamPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 240);
    setMemPhotoUrl(canvas.toDataURL('image/jpeg', 0.72));
    setWebcamActive(false);
  };

  const handleUploadMemoryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 320, 0.7);
      setMemPhotoUrl(compressed);
    } catch (err) {
      setMemFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh kỷ niệm.');
    }
    e.target.value = '';
  };

  const handlePostMemory = async () => {
    const sigUrl =
      hasSignature && sigCanvasRef.current
        ? sigCanvasRef.current.toDataURL('image/png')
        : '';
    if (!memMessage.trim() && !memPhotoUrl && !sigUrl) {
      setMemFeedback('Hãy viết lời nhắn, chụp/tải ảnh hoặc ký tên lên bảng trước khi đăng!');
      return;
    }
    setMemSaving(true);
    setMemFeedback(null);
    try {
      await onCreateMemory({
        message: memMessage.trim(),
        photoDataUrl: memPhotoUrl,
        signatureDataUrl: sigUrl,
        cardColor: memCardColor,
      });
      setMemMessage('');
      setMemPhotoUrl('');
      handleClearSignature();
      setMemFeedback('Đã treo ảnh & chữ ký của bạn lên Bức Tường Kỷ Niệm Tầng 2!');
    } catch (err) {
      setMemFeedback(err instanceof Error ? err.message : 'Không thể lưu kỷ niệm.');
    } finally {
      setMemSaving(false);
    }
  };

  // Floor 2 Quiz Handlers
  const currentQ = MUSEUM_QUIZ_QUESTIONS[quizIdx];
  const handleSelectQuizOption = (idx: number) => {
    if (quizAnswered !== null) return;
    setQuizAnswered(idx);
    if (idx === currentQ.correctIndex) {
      setQuizCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIdx + 1 < MUSEUM_QUIZ_QUESTIONS.length) {
      setQuizIdx((i) => i + 1);
      setQuizAnswered(null);
    } else {
      setQuizCompletedRound(true);
      const rewardMoney = quizCorrectCount >= 3 ? 8000 : 4000;
      const rewardXp = 20 + quizCorrectCount * 5;
      onPlayMuseumQuizReward(
        rewardMoney,
        rewardXp,
        `Hoàn thành Đố Vui Bảo Tàng Lạng Sơn (${quizCorrectCount}/${MUSEUM_QUIZ_QUESTIONS.length} câu đúng)`
      );
    }
  };

  const handleRestartQuiz = () => {
    setQuizIdx(0);
    setQuizCorrectCount(0);
    setQuizAnswered(null);
    setQuizCompletedRound(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Curatorial Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-amber-300/90 font-medium">
                Di Sản Văn Hóa Xứ Lạng · Cạnh Trường THCS Hoàng Văn Thụ
              </p>
              <h2 className="font-display text-lg font-bold text-white">
                Bảo Tàng Tỉnh Lạng Sơn (2 Tầng)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTeleportFloor(1);
                setActiveTab('floor1');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-200 whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ra Tầng 1 3D</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onTeleportFloor(2);
                setActiveTab('floor2_wall');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-200 whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lên Tầng 2 3D</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              aria-label="Đóng bảo tàng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('floor1')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === 'floor1'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Tầng 1: Khu Di Tích & Tranh ({artworks.size}/8)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('floor2_play')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === 'floor2_play'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Tầng 2: Khu Vui Chơi Bảo Tàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('floor2_wall')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === 'floor2_wall'
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Tầng 2: Treo Ảnh & Ký Tên ({memories.length})</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'floor1' && (
            <div className="space-y-5">
              {/* Role Notice & Section Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs">
                  {isSuperAdmin ? (
                    <>
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-amber-200 font-semibold">
                        Quyền Admin Chính: Chọn bất kỳ khung tranh nào bên dưới để treo ảnh, sửa chú thích hoặc gỡ tranh lên tường 3D.
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-300">
                        Chế độ Tham quan Tầng 1 · Chỉ <strong>Admin Chính</strong> mới được phép treo hoặc thay đổi tranh di tích.
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {SECTION_TABS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSectionFilter(st.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                        sectionFilter === st.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* 8 Gallery Slots Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {visibleSlots.map((slot) => {
                    const art = artworks.get(slot.slotId);
                    const isSelected = selectedSlot.slotId === slot.slotId;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`text-left rounded-xl border p-3 transition-colors bg-slate-950 ${
                          isSelected
                            ? 'border-amber-400 ring-1 ring-amber-400/60'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-stone-900 border border-amber-600/40 mb-2.5 flex items-center justify-center">
                          {art?.imageDataUrl ? (
                            <img
                              src={art.imageDataUrl}
                              alt={art.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center px-3 space-y-1">
                              <Landmark className="w-6 h-6 text-amber-500/60 mx-auto" />
                              <p className="text-xs font-semibold text-amber-200/80">
                                {slot.frameLabel} · Chưa treo tranh
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-400/90 font-medium truncate">
                          {slot.frameLabel} · {slot.sectionLabel.replace(/^Phần \d+: /, '')}
                        </p>
                        <h3 className="font-display font-bold text-sm text-white truncate mt-0.5">
                          {art?.title || slot.defaultTitle}
                        </h3>
                      </button>
                    );
                  })}
                </div>

                {/* Accession Viewer + Super Admin Hang Panel */}
                <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <p className="text-xs text-amber-400 font-medium">
                      {selectedSlot.frameLabel} · {selectedSlot.sectionLabel}
                    </p>
                    <h3 className="font-display text-base font-bold text-white mt-0.5">
                      {selectedArtwork?.title || selectedSlot.defaultTitle}
                    </h3>
                  </div>

                  <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-stone-900 border-2 border-amber-600/60 flex items-center justify-center">
                    {(isSuperAdmin ? artImageUrl : selectedArtwork?.imageDataUrl) ? (
                      <img
                        src={isSuperAdmin ? artImageUrl : selectedArtwork?.imageDataUrl}
                        alt={artTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-1.5">
                        <Landmark className="w-8 h-8 text-amber-500/50 mx-auto" />
                        <p className="text-xs text-slate-400">
                          Khung tranh hiện đang trống trên tường 3D Tầng 1.
                        </p>
                      </div>
                    )}
                  </div>

                  {!isSuperAdmin ? (
                    <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                      <p>{selectedArtwork?.caption || selectedSlot.defaultCaption}</p>
                      <p className="text-slate-500 pt-2 border-t border-slate-800">
                        Trạng thái: {selectedArtwork ? 'Đã được Admin Chính treo trưng bày' : 'Đang chờ Admin Chính cập nhật tác phẩm'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chọn ảnh từ máy</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadArtFile}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleGeneratePresetArt}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-xs font-semibold text-amber-300"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tạo tranh Lạng Sơn mẫu</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Tên tác phẩm / Di tích
                        </label>
                        <input
                          type="text"
                          value={artTitle}
                          maxLength={80}
                          onChange={(e) => setArtTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Thuyết minh lịch sử
                        </label>
                        <textarea
                          rows={2}
                          value={artCaption}
                          maxLength={220}
                          onChange={(e) => setArtCaption(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                        />
                      </div>

                      {artFeedback && (
                        <p className="text-xs text-amber-300 bg-amber-950/50 border border-amber-700/60 rounded-lg px-3 py-2">
                          {artFeedback}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={artSaving}
                          onClick={handleSaveSlotArtwork}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs"
                        >
                          {artSaving ? 'Đang lưu...' : 'Lưu & Treo Lên Tường 3D'}
                        </button>

                        {selectedArtwork && (
                          <button
                            type="button"
                            disabled={artSaving}
                            onClick={handleRemoveSlotArtwork}
                            className="p-2.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700/70 text-rose-300"
                            title="Gỡ tranh khỏi khung"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'floor2_play' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Sub-mode Switcher */}
              <div className="flex items-center justify-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-fit mx-auto">
                <button
                  type="button"
                  onClick={() => setPlaySubMode('claw')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    playSubMode === 'claw'
                      ? 'bg-pink-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Máy Gắp Thú Bông (5.000đ)
                </button>
                <button
                  type="button"
                  onClick={() => setPlaySubMode('quiz')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    playSubMode === 'quiz'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Đố Vui Văn Hóa Lạng Sơn
                </button>
              </div>

              {playSubMode === 'claw' ? (
                <div className="bg-slate-950 border border-pink-500/40 rounded-2xl p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-xs text-pink-300 font-medium">
                        Khu Vui Chơi Tầng 2 · Tủ Gắp Thú Bông 8A3
                      </p>
                      <h3 className="font-display text-lg font-bold text-white">
                        Canh Chuẩn Vị Trí & Thả Móc Gắp Thú!
                      </h3>
                    </div>
                    <span className="font-mono-nums text-xs font-bold text-amber-400">
                      Số dư: {formatVND(playerMoney)}
                    </span>
                  </div>

                  {/* Interactive Claw Stage */}
                  <div className="relative h-56 rounded-xl bg-slate-900 border-2 border-pink-500/50 overflow-hidden p-4 flex flex-col justify-between">
                    {/* Top Rail */}
                    <div className="relative h-2 bg-slate-700 rounded-full">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${clawPos}%` }}
                      >
                        <div className="w-6 h-4 rounded bg-pink-500 border border-white/40" />
                        <div
                          className={`w-1 bg-slate-300 transition-all duration-300 ${
                            clawDropping ? 'h-28' : 'h-8'
                          }`}
                        />
                        <div className="w-7 h-5 border-2 border-amber-300 border-t-0 rounded-b-lg" />
                      </div>
                    </div>

                    {/* 4 Plushie Slots */}
                    <div className="relative h-24">
                      {PLUSHIE_PRIZES.map((p, idx) => {
                        const slotCenters = [18, 39, 61, 82];
                        const cx = slotCenters[idx];
                        return (
                          <div
                            key={p.id}
                            className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center gap-1 w-20 text-center"
                            style={{ left: `${cx}%` }}
                          >
                            <div
                              className="w-12 h-12 rounded-2xl border-2 border-white/30 flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: p.colorHex }}
                            >
                              <Sparkles className="w-5 h-5 text-slate-950" />
                            </div>
                            <span className="text-[10px] font-bold text-white leading-tight truncate w-full">
                              {p.name.split(' ').slice(0, 2).join(' ')}
                            </span>
                            <span className="text-[10px] font-mono-nums text-amber-300">
                              +{(p.rewardMoney / 1000).toFixed(0)}k
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {clawResult && (
                    <div
                      className={`rounded-xl p-3.5 border text-xs font-semibold flex items-center justify-between gap-3 ${
                        clawResult.prize
                          ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
                          : 'bg-amber-950/50 border-amber-700/60 text-amber-200'
                      }`}
                    >
                      <span>{clawResult.note}</span>
                      {clawResult.prize && (
                        <span className="font-mono-nums text-amber-300 shrink-0">
                          +{formatVND(clawResult.prize.rewardMoney)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Đã gắp phiên này:{' '}
                      <span className="font-bold text-pink-300">
                        {caughtPlushies.length} thú bông
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={clawDropping || (hasFullAccess && playerMoney < 5000)}
                      onClick={() => {
                        if (clawDropping) return;
                        setClawDropping(true);
                        setClawResult(null);
                        const dropX = clawPos;
                        const slotCenters = [18, 39, 61, 82];
                        let matched: PlushiePrizeDef | null = null;
                        slotCenters.forEach((cx, idx) => {
                          if (Math.abs(dropX - cx) <= 10.5) {
                            matched = PLUSHIE_PRIZES[idx];
                          }
                        });
                        window.setTimeout(() => {
                          setClawDropping(false);
                          onClawMachineReward(matched, 5000);
                          if (matched) {
                            const prize = matched as PlushiePrizeDef;
                            setCaughtPlushies((prev) => [prize, ...prev].slice(0, 8));
                            setClawResult({
                              prize,
                              note: `Trúng lớn! Bạn gắp được "${prize.name}" (${prize.rarity})!`,
                            });
                          } else {
                            setClawResult({
                              prize: null,
                              note: 'Suýt trúng rồi! Móc gắp bị trượt nhẹ (+5 XP an ủi). Hãy canh giữa thú bông nhé!',
                            });
                          }
                        }, 520);
                      }}
                      className="px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white font-display font-bold text-sm transition-colors"
                    >
                      {clawDropping
                        ? 'Đang thả móc...'
                        : hasFullAccess && playerMoney < 5000
                          ? 'Không đủ 5.000đ'
                          : 'Thả Móc Gắp Thú! (5.000đ)'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-xs text-sky-400 font-medium">
                        Khu Vui Chơi Tầng 2 · Đố Vui Văn Hóa Lạng Sơn
                      </p>
                      <h3 className="font-display text-lg font-bold text-white">
                        Thử Thách Nhà Sử Học Trẻ 8A3
                      </h3>
                    </div>
                    <span className="font-mono-nums text-xs font-bold text-amber-300">
                      Câu {quizIdx + 1}/{MUSEUM_QUIZ_QUESTIONS.length} · Đúng {quizCorrectCount}
                    </span>
                  </div>

                  {!quizCompletedRound ? (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        {currentQ.prompt}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentQ.options.map((opt, idx) => {
                          const isChosen = quizAnswered === idx;
                          const isRight = idx === currentQ.correctIndex;
                          let btnStyle =
                            'bg-slate-900 border-slate-700 text-slate-200 hover:border-sky-400';
                          if (quizAnswered !== null) {
                            if (isRight) {
                              btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                            } else if (isChosen) {
                              btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                            } else {
                              btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500';
                            }
                          }
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectQuizOption(idx)}
                              className={`px-4 py-3 rounded-xl border text-left text-xs font-semibold transition-colors ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {quizAnswered !== null && (
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-slate-300 space-y-1">
                            <p className="font-bold text-sky-300">
                              {quizAnswered === currentQ.correctIndex
                                ? 'Chính xác!'
                                : 'Chưa đúng rồi!'}
                            </p>
                            <p>{currentQ.fact}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleNextQuizQuestion}
                            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0"
                          >
                            {quizIdx + 1 < MUSEUM_QUIZ_QUESTIONS.length ? 'Câu tiếp theo' : 'Hoàn thành & Nhận quà'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-4">
                      <Award className="w-12 h-12 text-amber-400 mx-auto" />
                      <div>
                        <h4 className="font-display text-xl font-bold text-white">
                          Hoàn Thành Vòng Chơi Bảo Tàng!
                        </h4>
                        <p className="text-sm text-slate-300 mt-1">
                          Bạn trả lời đúng {quizCorrectCount}/{MUSEUM_QUIZ_QUESTIONS.length} câu hỏi về xứ Lạng.
                        </p>
                        {hasFullAccess ? (
                          <p className="text-xs text-emerald-400 font-semibold mt-1">
                            Phần thưởng {formatVND(quizCorrectCount >= 3 ? 8000 : 4000)} & XP đã được cộng vào tài khoản!
                          </p>
                        ) : (
                          <p className="text-xs text-amber-300 mt-1">
                            Khách tham quan chơi giải trí không cộng tiền thưởng.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleRestartQuiz}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                        >
                          Chơi Lại Vòng Mới
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('floor2_wall')}
                          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
                        >
                          Sang Bức Tường Kỷ Niệm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'floor2_wall' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Composer: Photo + Signature Pad + Note */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
                <div className="border-b border-slate-800 pb-2.5">
                  <p className="text-xs text-violet-300 font-medium">
                    Người đăng: {myName} ({myRoleLabel})
                  </p>
                  <h3 className="font-display text-base font-bold text-white">
                    Treo Ảnh & Ký Tên Lên Tường Tầng 2
                  </h3>
                </div>

                {/* Photo Upload or Webcam */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">
                      <ImagePlus className="w-3.5 h-3.5 text-violet-400" />
                      <span>Tải ảnh lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadMemoryPhoto}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setWebcamActive((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{webcamActive ? 'Tắt Camera' : 'Chụp ảnh Webcam'}</span>
                    </button>
                    {memPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setMemPhotoUrl('')}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Bỏ ảnh
                      </button>
                    )}
                  </div>

                  {webcamErr && <p className="text-xs text-rose-300">{webcamErr}</p>}

                  {webcamActive && (
                    <div className="rounded-lg overflow-hidden border border-sky-500/60 bg-black space-y-2 p-2">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-40 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={handleSnapWebcamPhoto}
                        className="w-full py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                      >
                        Chụp Khoảnh Khắc Này
                      </button>
                    </div>
                  )}

                  {memPhotoUrl && !webcamActive && (
                    <div className="h-32 w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                      <img
                        src={memPhotoUrl}
                        alt="Ảnh kỷ niệm xem trước"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Interactive Signature Canvas */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">
                      Ký tên trực tiếp lên bảng:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {PEN_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPenColor(c)}
                          className={`w-4 h-4 rounded-full border ${
                            penColor === c ? 'border-white scale-110' : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Chọn màu bút ${c}`}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white ml-1"
                      >
                        <Eraser className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                  <canvas
                    ref={sigCanvasRef}
                    width={360}
                    height={120}
                    onPointerDown={handleSigDown}
                    onPointerMove={handleSigMove}
                    onPointerUp={handleSigUp}
                    onPointerLeave={handleSigUp}
                    className="w-full h-28 rounded-lg bg-white border border-slate-700 cursor-crosshair touch-none"
                  />
                </div>

                {/* Message & Card Color */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Lời nhắn lưu bút (tối đa 180 ký tự)
                  </label>
                  <input
                    type="text"
                    value={memMessage}
                    maxLength={180}
                    placeholder="VD: Lớp 8A3 mãi đỉnh! Ghé thăm Bảo tàng Lạng Sơn..."
                    onChange={(e) => setMemMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Màu bảng ghim:</span>
                  <div className="flex items-center gap-1.5">
                    {CARD_COLORS.map((cc) => (
                      <button
                        key={cc.hex}
                        type="button"
                        onClick={() => setMemCardColor(cc.hex)}
                        title={cc.label}
                        className={`w-6 h-6 rounded-md border-2 ${
                          memCardColor === cc.hex ? 'border-violet-400' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: cc.hex }}
                      />
                    ))}
                  </div>
                </div>

                {memFeedback && (
                  <p className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-700/60 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{memFeedback}</span>
                  </p>
                )}

                <button
                  type="button"
                  disabled={memSaving}
                  onClick={handlePostMemory}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-xs"
                >
                  {memSaving ? 'Đang treo lên tường...' : 'Treo Ảnh & Chữ Ký Lên Tường 3D'}
                </button>
              </div>

              {/* Memory Wall Gallery */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-white">
                    Bảng Kỷ Niệm Lớp 8A3 & Du Khách (6 bảng mới nhất hiện trên tường 3D)
                  </h3>
                </div>

                {memories.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                    <PenTool className="w-8 h-8 text-violet-400/60 mx-auto" />
                    <p className="text-sm font-semibold text-slate-200">
                      Bức tường kỷ niệm đang chờ chữ ký đầu tiên!
                    </p>
                    <p className="text-xs text-slate-400">
                      Hãy chụp ảnh hoặc ký tên ở khung bên trái để treo lên bảng Tầng 2.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memories.map((mem) => {
                      const canDelete = isSuperAdmin || mem.authorUid === myUid;
                      return (
                        <div
                          key={mem.id}
                          className="rounded-xl border border-slate-700 p-3 text-slate-900 shadow-md flex flex-col gap-2"
                          style={{ backgroundColor: mem.cardColor || '#fef3c7' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-display font-bold text-sm truncate">
                                {mem.authorName}
                              </p>
                              <p className="text-[11px] font-medium text-slate-600">
                                {mem.authorRoleLabel || 'Thành viên'}
                              </p>
                            </div>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => onDeleteMemory(mem.id)}
                                className="p-1 rounded hover:bg-black/10 text-rose-700 shrink-0"
                                title="Gỡ kỷ niệm này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {mem.photoDataUrl && (
                            <div className="h-32 w-full rounded-lg overflow-hidden border border-slate-900/15 bg-white">
                              <img
                                src={mem.photoDataUrl}
                                alt={`Ảnh kỷ niệm của ${mem.authorName}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {mem.message && (
                            <p className="text-xs text-slate-800 leading-relaxed break-words">
                              “{mem.message}”
                            </p>
                          )}

                          {mem.signatureDataUrl && (
                            <div className="bg-white/85 rounded-lg border border-slate-900/15 p-1.5">
                              <img
                                src={mem.signatureDataUrl}
                                alt={`Chữ ký ${mem.authorName}`}
                                referrerPolicy="no-referrer"
                                className="h-14 w-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
