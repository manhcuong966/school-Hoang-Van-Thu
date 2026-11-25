import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, ChevronDown, ChevronUp, RefreshCw, ShieldAlert, ShieldCheck, Upload, User } from 'lucide-react';
import { CLASS_8A3_ROSTER, findMatching8A3RosterName } from '../data/gameData';
import { CharacterLook, GenderType, HairStyleId } from '../types/game';
import { soundEngine } from '../utils/sound';

interface WebcamScannerModalProps {
  initialLook: CharacterLook;
  initialIsDelinquent: boolean;
  isInitialSetup: boolean;
  onSave: (look: CharacterLook, isDelinquent: boolean) => void;
  onClose?: () => void;
}

const MALE_HAIR_OPTIONS: Array<{ id: HairStyleId; label: string }> = [
  { id: 'short_boy', label: 'Tóc ngắn học sinh' },
  { id: 'spiky', label: 'Tóc dựng năng động' },
  { id: 'side_part', label: 'Tóc rẽ ngôi Hàn Quốc' },
  { id: 'curly_boy', label: 'Tóc xoăn bồng bềnh' },
  { id: 'undercut', label: 'Tóc Undercut vuốt ngược' },
];

const FEMALE_HAIR_OPTIONS: Array<{ id: HairStyleId; label: string }> = [
  { id: 'long_straight', label: 'Tóc dài thẳng + Bờm hồng' },
  { id: 'ponytail', label: 'Tóc buộc đuôi ngựa' },
  { id: 'bob_cut', label: 'Tóc bob ngang vai' },
  { id: 'twin_tails', label: 'Tóc buộc 2 bên dễ thương' },
  { id: 'high_bun', label: 'Tóc búi cao cài nơ' },
];

const MALE_HAIR_IDS = new Set<HairStyleId>(MALE_HAIR_OPTIONS.map((h) => h.id));
const FEMALE_HAIR_IDS = new Set<HairStyleId>(FEMALE_HAIR_OPTIONS.map((h) => h.id));

const SKIN_TONES = [
  { hex: '#fde0c8', label: 'Sáng' },
  { hex: '#f4c7a5', label: 'Tự nhiên' },
  { hex: '#d9a077', label: 'Khỏe khoắn' },
];

export const WebcamScannerModal: React.FC<WebcamScannerModalProps> = ({
  initialLook,
  initialIsDelinquent,
  isInitialSetup,
  onSave,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(initialLook.name);
  const [gender, setGender] = useState<GenderType>(initialLook.gender || 'male');
  const [faceDataUrl, setFaceDataUrl] = useState<string | null>(initialLook.faceDataUrl);
  const [hairStyle, setHairStyle] = useState<HairStyleId>(initialLook.hairStyle);
  const [hasGlasses, setHasGlasses] = useState<boolean>(initialLook.hasGlasses);
  const [skinTone, setSkinTone] = useState<string>(initialLook.skinTone);
  const [isDelinquent, setIsDelinquent] = useState<boolean>(initialIsDelinquent);

  const handleSelectGender = (nextGender: GenderType) => {
    setGender(nextGender);
    if (nextGender === 'female' && MALE_HAIR_IDS.has(hairStyle)) {
      setHairStyle('long_straight');
    } else if (nextGender === 'male' && FEMALE_HAIR_IDS.has(hairStyle)) {
      setHairStyle('short_boy');
    }
  };

  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(false);
  const [showRosterList, setShowRosterList] = useState(false);

  const matchedRosterName = findMatching8A3RosterName(name);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCamError(null);
    setCamLoading(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ webcam.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamActive(true);
    } catch (err) {
      setCamError(
        err instanceof Error
          ? 'Không thể mở webcam. Bạn có thể tải ảnh chân dung lên hoặc dùng khuôn mặt mặc định.'
          : 'Không thể truy cập camera.'
      );
    } finally {
      setCamLoading(false);
    }
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    // Mirror horizontally to match webcam preview
    ctx.translate(320, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);

    soundEngine.playShutter();
    setFaceDataUrl(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        soundEngine.playShutter();
        setFaceDataUrl(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    stopCamera();
    const cleaned = name.trim() || 'Khách Tham Quan';
    onSave(
      {
        name: matchedRosterName || cleaned,
        gender,
        faceDataUrl,
        hairStyle,
        hasGlasses,
        skinTone,
      },
      isDelinquent
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 overflow-y-auto">
      <form
        onSubmit={handleConfirm}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-lime-400">
              Trường THCS Hoàng Văn Thụ · Nhập học Lớp 8A3
            </p>
            <h2 className="font-display text-2xl font-bold text-white mt-0.5">
              Quét Khuôn Mặt Tạo Nhân Vật 3D
            </h2>
          </div>
          {!isInitialSetup && onClose && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              Đóng
            </button>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Webcam Scanner Viewport */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${camActive ? 'block' : 'hidden'}`}
              />

              {camActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-72 rounded-full border-2 border-dashed border-lime-400/90 shadow-[0_0_0_999px_rgba(2,6,23,0.45)]" />
                </div>
              )}

              {!camActive && faceDataUrl && (
                <img
                  src={faceDataUrl}
                  alt="Khuôn mặt đã quét"
                  className="w-full h-full object-cover"
                />
              )}

              {!camActive && !faceDataUrl && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-lime-400">
                    <User className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Bật webcam để quét khuôn mặt thật của bạn lên nhân vật 3D lớp 8A3, hoặc tải ảnh chân dung lên.
                  </p>
                </div>
              )}
            </div>

            {camError && (
              <p className="text-xs text-amber-300 bg-amber-950/50 border border-amber-800/60 rounded-lg px-3 py-2">
                {camError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {!camActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={camLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <Camera className="w-4 h-4" />
                  {camLoading ? 'Đang mở camera...' : faceDataUrl ? 'Quét lại Webcam' : 'Mở Webcam Quét Mặt'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={captureFromWebcam}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  Chụp & Ghép Mặt 3D
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                Tải Ảnh
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {faceDataUrl && !camActive && (
                <button
                  type="button"
                  onClick={() => setFaceDataUrl(null)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                  title="Dùng khuôn mặt mặc định"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Student Profile & Appearance */}
          <div className="flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Họ và Tên (Theo danh sách lớp 8A3)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRosterList((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs text-lime-400 hover:text-lime-300"
                  >
                    <span>Xem DS 8A3 ({CLASS_8A3_ROSTER.length} bạn)</span>
                    {showRosterList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={48}
                  placeholder="Nhập đúng Họ và Tên lớp 8A3..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-lime-400"
                />
                {matchedRosterName ? (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/60 flex items-start gap-2 text-xs text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Xác thực thành viên chính thức <strong>{matchedRosterName}</strong> — Mở khóa toàn bộ tiết học, nhiệm vụ, khởi nghiệp & BXH Tuần!
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-950/50 border border-amber-700/60 flex items-start gap-2 text-xs text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Tên chưa có trong danh sách lớp 8A3 — Bạn sẽ vào <strong>Chế độ Khách Tham Quan</strong> (chỉ đi dạo tham quan trường, không làm nhiệm vụ & không lên BXH).
                    </span>
                  </div>
                )}
                {showRosterList && (
                  <div className="mt-2 max-h-32 overflow-y-auto p-2 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 text-xs">
                    {CLASS_8A3_ROSTER.map((student) => (
                      <button
                        key={student}
                        type="button"
                        onClick={() => {
                          setName(student);
                          setShowRosterList(false);
                        }}
                        className="text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-lime-300 truncate"
                      >
                        {student}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Giới tính nhân vật 3D
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectGender('male')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      gender === 'male'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Nhân vật Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectGender('female')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      gender === 'female'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Nhân vật Nữ (Váy / Lông mi)
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-medium text-slate-300">
                  Kiểu tóc nhân vật 3D (Nam & Nữ)
                </label>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  <div>
                    <p className="text-[11px] font-semibold text-pink-300 mb-1">
                      Kiểu tóc Nữ ({FEMALE_HAIR_OPTIONS.length})
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FEMALE_HAIR_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHairStyle(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border transition-colors ${
                            hairStyle === opt.id
                              ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-sky-300 mb-1">
                      Kiểu tóc Nam ({MALE_HAIR_OPTIONS.length})
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MALE_HAIR_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHairStyle(opt.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border transition-colors ${
                            hairStyle === opt.id
                              ? 'bg-lime-500/20 border-lime-400 text-lime-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Màu da 3D
                  </label>
                  <div className="flex items-center gap-2">
                    {SKIN_TONES.map((st) => (
                      <button
                        key={st.hex}
                        type="button"
                        onClick={() => setSkinTone(st.hex)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                          skinTone === st.hex
                            ? 'border-lime-400 bg-slate-800 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: st.hex }}
                        />
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phụ kiện kính mắt
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasGlasses((v) => !v)}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      hasGlasses
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {hasGlasses ? 'Đang đeo kính cận' : 'Không đeo kính'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phong cách Học sinh (Trải nghiệm Lái xe)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDelinquent(false)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      !isDelinquent
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Học sinh Gương mẫu</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tuân thủ luật giao thông & nề nếp trường học.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDelinquent(true)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      isDelinquent
                        ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-100'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Học sinh Hư Đầu Gấu</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Được phép bốc đầu [Space] & đi xe điên [Shift] ngoài đường!
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">Nội quy trường Hoàng Văn Thụ:</p>
                <p>Thứ 2-4-6 mặc đồng phục Trắng · Thứ 3-5 mặc đồng phục Xanh · Vào trường/Bảo tàng tự cất xe.</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-display font-bold text-base transition-colors"
            >
              {isInitialSetup ? 'Vào Cổng Trường 8A3 Ngay' : 'Lưu Nhân Vật 3D'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
