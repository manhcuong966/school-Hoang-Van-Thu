import React, { useState } from 'react';
import {
  Bike,
  BookOpen,
  Briefcase,
  Calculator,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  FerrisWheel,
  Flame,
  Gamepad2,
  HardHat,
  Heart,
  Landmark,
  Languages,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Music,
  Navigation,
  OctagonAlert,
  Palette,
  Settings,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trophy,
  User,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { MuseumTabId } from './MuseumModal';
import {
  DAY_LABELS,
  formatVND,
  getRequiredUniformForDay,
  VEHICLES,
} from '../data/gameData';
import {
  ActiveGrabMission,
  HubTab,
  InteractiveZone,
  PlayerState,
  RoleType,
  SubjectRoomId,
  VehicleId,
  VenueModalType,
} from '../types/game';
import { SchoolClockInfo } from '../utils/schoolTime';
import { TrafficLightStatus } from '../utils/trafficLight';

interface GameHUDProps {
  playerState: PlayerState;
  schoolClock: SchoolClockInfo;
  userEmail: string | null;
  roleType: RoleType;
  canOpenAdminPanel: boolean;
  pendingTasksCount: number;
  micEnabled: boolean;
  isSpeaking: boolean;
  isMicMutedByAdmin: boolean;
  micError: string | null;
  unreadChatCount: number;
  trafficLight: TrafficLightStatus;
  nearCrosswalk: boolean;
  nearestZone: InteractiveZone | null;
  activeGrabMission: ActiveGrabMission | null;
  soundEnabled: boolean;
  toastMessage: string | null;
  isVehicleStowed: boolean;
  effectiveVehicle: VehicleId;
  isWheelie: boolean;
  isReckless: boolean;
  moveInputRef: React.MutableRefObject<{ x: number; y: number }>;
  wheelieInputRef: React.MutableRefObject<boolean>;
  recklessInputRef: React.MutableRefObject<boolean>;
  onToggleMic: () => void;
  onToggleChat: () => void;
  onOpenAdminPanel: () => void;
  onOpenProfile: () => void;
  onToggleHelmet: () => void;
  onToggleSound: () => void;
  onSignOut: () => void;
  onOpenScanner: () => void;
  onOpenSubjectRoom: (roomId: SubjectRoomId) => void;
  onOpenHub: (tab: HubTab) => void;
  onOpenVenue: (venue: VenueModalType) => void;
  onOpenMuseum: (tab: MuseumTabId) => void;
  onInteractZone: (zone: InteractiveZone) => void;
  onQuickTravel: (x: number, z: number, y?: number) => void;
}

const SUBJECT_ROOMS: Array<{
  id: SubjectRoomId;
  label: string;
  x: number;
  z: number;
  icon: React.ReactNode;
}> = [
  { id: 'math', label: 'Toán 8', x: -14, z: -13.5, icon: <Calculator className="w-3.5 h-3.5 text-sky-400" /> },
  { id: 'literature', label: 'Ngữ Văn', x: -5, z: -13.5, icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'art', label: 'Mĩ Thuật', x: 4, z: -13.5, icon: <Palette className="w-3.5 h-3.5 text-pink-400" /> },
  { id: 'music', label: 'Âm Nhạc', x: 13, z: -13.5, icon: <Music className="w-3.5 h-3.5 text-violet-400" /> },
  { id: 'english', label: 'Tiếng Anh', x: 17.5, z: -7, icon: <Languages className="w-3.5 h-3.5 text-emerald-400" /> },
];

export const GameHUD: React.FC<GameHUDProps> = ({
  playerState,
  schoolClock,
  userEmail,
  roleType,
  canOpenAdminPanel,
  pendingTasksCount,
  micEnabled,
  isSpeaking,
  isMicMutedByAdmin,
  micError,
  unreadChatCount,
  trafficLight,
  nearCrosswalk,
  nearestZone,
  activeGrabMission,
  soundEnabled,
  toastMessage,
  isVehicleStowed,
  effectiveVehicle,
  isWheelie,
  isReckless,
  moveInputRef,
  wheelieInputRef,
  recklessInputRef,
  onToggleMic,
  onToggleChat,
  onOpenAdminPanel,
  onOpenProfile,
  onToggleHelmet,
  onToggleSound,
  onSignOut,
  onOpenScanner,
  onOpenSubjectRoom,
  onOpenHub,
  onOpenVenue,
  onOpenMuseum,
  onInteractZone,
  onQuickTravel,
}) => {
  const [dockExpanded, setDockExpanded] = useState(true);
  const [showRoomsPicker, setShowRoomsPicker] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const req = getRequiredUniformForDay(schoolClock.dayOfWeek);
  const uniformOk =
    req.required === 'any' ||
    playerState.equippedUniform === 'vip_8a3' ||
    playerState.equippedUniform === req.required;

  const vehicle = VEHICLES.find((v) => v.id === playerState.equippedVehicle) || VEHICLES[0];
  const needsHelmetOutdoors =
    !isVehicleStowed && (effectiveVehicle === 'scooter' || effectiveVehicle === 'motorbike');
  const canDoStunts =
    playerState.isDelinquent &&
    !isVehicleStowed &&
    (effectiveVehicle === 'bike' || effectiveVehicle === 'scooter' || effectiveVehicle === 'motorbike');

  const setPad = (x: number, y: number) => {
    moveInputRef.current.x = x;
    moveInputRef.current.y = y;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Compact Avatar Logo (opens ProfileModal) + Resource Strip */}
        <div className="pointer-events-auto bg-slate-900/92 border border-slate-700/80 rounded-2xl p-2.5 shadow-xl flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-lime-400/80 bg-slate-800 shrink-0 flex items-center justify-center hover:border-lime-300 transition-colors"
            title="Mở Hồ Sơ Cá Nhân (Tên, Level, XP, Mũ bảo hiểm)"
            aria-label="Mở Hồ Sơ Cá Nhân"
          >
            {playerState.look.faceDataUrl ? (
              <img
                src={playerState.look.faceDataUrl}
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-lime-400" />
            )}
            {playerState.vipClaimedThisWeek && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-tl-md bg-slate-950/90 flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
              </span>
            )}
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs pr-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Tiền</span>
              <span className="font-mono-nums font-bold text-amber-400 whitespace-nowrap">
                {formatVND(playerState.money)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Năng lượng</span>
              <span className="font-mono-nums font-bold text-cyan-300 inline-flex items-center gap-0.5 whitespace-nowrap">
                <Zap className="w-3 h-3" /> {playerState.energy}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Người tốt</span>
              <span className="font-mono-nums font-bold text-emerald-400 inline-flex items-center gap-1 whitespace-nowrap">
                <Heart className="w-3 h-3" /> {playerState.goodPoints}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Phương tiện</span>
              <span className="font-medium text-sky-300 whitespace-nowrap block">
                {vehicle.name.split(' ')[0]} {vehicle.name.split(' ')[1] || ''}
                {isVehicleStowed ? (
                  <span className="text-amber-300 text-[10px]"> (Đã cất)</span>
                ) : needsHelmetOutdoors && !playerState.wearingHelmet ? (
                  <span className="text-rose-400 text-[10px] font-bold"> · Ko Mũ!</span>
                ) : null}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: Traffic Light, School Clock, Mic, Chat & Admin Button */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-stretch justify-end gap-2">
            {/* Synchronized Traffic Light Status */}
            <div
              className={`bg-slate-900/92 border rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2 ${
                trafficLight.phase === 'red'
                  ? 'border-rose-500/70'
                  : trafficLight.phase === 'yellow'
                    ? 'border-amber-400/70'
                    : 'border-emerald-500/60'
              }`}
              title="Đèn giao thông cổng trường đồng bộ toàn server"
            >
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  trafficLight.phase === 'red'
                    ? 'bg-rose-500'
                    : trafficLight.phase === 'yellow'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                }`}
              />
              <div className="text-right">
                <p className="text-[11px] font-bold text-white leading-tight">
                  {trafficLight.phase === 'red'
                    ? 'Đèn Đỏ'
                    : trafficLight.phase === 'yellow'
                      ? 'Đèn Vàng'
                      : 'Đèn Xanh'}
                </p>
                <p className="text-[11px] font-mono-nums text-slate-300">
                  {trafficLight.secondsRemaining}s
                </p>
              </div>
            </div>

            <div className="bg-slate-900/92 border border-slate-700/80 rounded-2xl px-4 py-2 shadow-xl flex items-center">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Clock className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                  <p className="font-display font-bold text-sm text-white font-mono-nums">
                    {DAY_LABELS[schoolClock.dayOfWeek]} · {schoolClock.periodOfDayLabel} ·{' '}
                    {schoolClock.timeFormatted}
                  </p>
                </div>
                <p className="text-xs text-sky-300 font-mono-nums mt-0.5">
                  {schoolClock.classPeriodLabel} · Còn {schoolClock.countdownFormatted}
                </p>
                <p
                  className={`text-xs font-medium mt-0.5 ${
                    uniformOk ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {uniformOk
                    ? 'Đúng đồng phục quy định'
                    : `Cần mặc: ${req.label.split(' ')[0]} ${req.label.split(' ')[1]}`}
                </p>
              </div>
            </div>
          </div>

          {activeGrabMission && (
            <div
              className={`rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2.5 text-xs border ${
                activeGrabMission.stage === 'pickup'
                  ? 'bg-amber-950/95 border-amber-400/80'
                  : 'bg-green-950/95 border-green-500/70'
              }`}
            >
              <Navigation
                className={`w-4 h-4 shrink-0 ${
                  activeGrabMission.stage === 'pickup' ? 'text-amber-300' : 'text-green-400'
                }`}
              />
              <div>
                <p className="font-bold text-white">{activeGrabMission.title}</p>
                <p
                  className={
                    activeGrabMission.stage === 'pickup' ? 'text-amber-300' : 'text-green-300'
                  }
                >
                  {activeGrabMission.stage === 'pickup'
                    ? `Bước 1/2 · Tới lấy tại: ${activeGrabMission.pickupLabel}`
                    : `Bước 2/2 · Giao tới: ${activeGrabMission.targetLabel} (+${formatVND(
                        activeGrabMission.rewardMoney
                      )})`}
                </p>
              </div>
            </div>
          )}

          {micError && (
            <div className="bg-rose-950/95 border border-rose-500/70 rounded-lg px-3 py-1.5 text-[11px] text-rose-200 max-w-xs text-right">
              {micError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={onToggleMic}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${
                isMicMutedByAdmin
                  ? 'bg-rose-950/90 border-rose-600/80 text-rose-300'
                  : micEnabled
                    ? isSpeaking
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-900/92 border-slate-700/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isMicMutedByAdmin || !micEnabled ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              <span>
                {isMicMutedByAdmin
                  ? 'Mic bị khóa'
                  : micEnabled
                    ? isSpeaking
                      ? 'Đang nói...'
                      : 'Mic Đang Bật'
                    : 'Bật Mic'}
              </span>
            </button>

            {/* Social Chat Toggle */}
            <button
              type="button"
              onClick={onToggleChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/92 border border-slate-700/80 text-xs font-semibold text-sky-300 hover:bg-slate-800 whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Xã Hội{unreadChatCount > 0 ? ` (${unreadChatCount})` : ''}</span>
            </button>

            {/* Admin / Sub-Admin / Tasks Panel */}
            {canOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>
                  Quản Lý{pendingTasksCount > 0 ? ` (${pendingTasksCount})` : ''}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stop-Line Crosswalk Warning near road Z=33.3 / Z=42.7 */}
      {nearCrosswalk && (
        <div
          className={`pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 max-w-[92vw] ${
            trafficLight.phase === 'red'
              ? 'bg-rose-950/95 border-rose-500 text-rose-100'
              : trafficLight.phase === 'yellow'
                ? 'bg-amber-950/95 border-amber-400 text-amber-100'
                : 'bg-emerald-950/95 border-emerald-500 text-emerald-100'
          }`}
        >
          <OctagonAlert className="w-4 h-4 shrink-0" />
          <span>
            {trafficLight.phase === 'red'
              ? `DỪNG TRƯỚC VẠCH TRẮNG! Đèn đỏ (${trafficLight.secondsRemaining}s) — Vượt vạch Z=33.3 / Z=42.7 sẽ bị ghi nhận lỗi`
              : trafficLight.phase === 'yellow'
                ? `Đèn Vàng (${trafficLight.secondsRemaining}s) — Chuẩn bị dừng trước vạch trắng`
                : `Đèn Xanh (${trafficLight.secondsRemaining}s) — Được phép qua vạch trắng`}
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="pointer-events-none fixed top-32 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-lime-500/60 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 max-w-[92vw]">
          <Sparkles className="w-4 h-4 text-lime-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Optional On-screen D-pad */}
      {showTouchPad && (
        <div className="pointer-events-auto fixed bottom-24 left-4 z-30 grid grid-cols-3 gap-1.5 bg-slate-900/95 border border-slate-700/80 p-2 rounded-2xl">
          <div />
          <button
            type="button"
            onPointerDown={() => setPad(0, -1)}
            onPointerUp={() => setPad(0, 0)}
            onPointerLeave={() => setPad(0, 0)}
            className="w-11 h-11 rounded-lg bg-slate-800 active:bg-lime-500 active:text-slate-950 font-bold text-sm"
          >
            W
          </button>
          <div />
          <button
            type="button"
            onPointerDown={() => setPad(-1, 0)}
            onPointerUp={() => setPad(0, 0)}
            onPointerLeave={() => setPad(0, 0)}
            className="w-11 h-11 rounded-lg bg-slate-800 active:bg-lime-500 active:text-slate-950 font-bold text-sm"
          >
            A
          </button>
          <button
            type="button"
            onPointerDown={() => setPad(0, 1)}
            onPointerUp={() => setPad(0, 0)}
            onPointerLeave={() => setPad(0, 0)}
            className="w-11 h-11 rounded-lg bg-slate-800 active:bg-lime-500 active:text-slate-950 font-bold text-sm"
          >
            S
          </button>
          <button
            type="button"
            onPointerDown={() => setPad(1, 0)}
            onPointerUp={() => setPad(0, 0)}
            onPointerLeave={() => setPad(0, 0)}
            className="w-11 h-11 rounded-lg bg-slate-800 active:bg-lime-500 active:text-slate-950 font-bold text-sm"
          >
            D
          </button>
        </div>
      )}

      {/* Delinquent Stunt Buttons (Wheelie + Reckless Driving) */}
      {canDoStunts && (
        <div className="pointer-events-auto fixed bottom-4 left-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onPointerDown={() => {
              wheelieInputRef.current = true;
            }}
            onPointerUp={() => {
              wheelieInputRef.current = false;
            }}
            onPointerLeave={() => {
              wheelieInputRef.current = false;
            }}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isWheelie
                ? 'bg-orange-500 border-orange-300 text-slate-950'
                : 'bg-slate-900/95 border-orange-500/60 text-orange-300 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>[Space] Bốc đầu</span>
          </button>

          <button
            type="button"
            onPointerDown={() => {
              recklessInputRef.current = true;
            }}
            onPointerUp={() => {
              recklessInputRef.current = false;
            }}
            onPointerLeave={() => {
              recklessInputRef.current = false;
            }}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isReckless
                ? 'bg-rose-500 border-rose-300 text-white'
                : 'bg-slate-900/95 border-rose-500/60 text-rose-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>[Shift] Xe điên</span>
          </button>
        </div>
      )}

      {/* Bottom Area: Proximity Prompt + Admin-Only Collapsible Dock */}
      <div className="flex flex-col items-center gap-2.5">
        {nearestZone && (
          <div className="pointer-events-auto bg-slate-900/95 border border-amber-400/70 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-4">
            <div>
              <p className="font-display font-bold text-sm text-white">{nearestZone.label}</p>
              <p className="text-xs text-amber-300">{nearestZone.sublabel}</p>
            </div>
            <button
              type="button"
              onClick={() => onInteractZone(nearestZone)}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap"
            >
              [E] Thực hiện
            </button>
          </div>
        )}

        {/* Quick Control Dock: Super Admin ONLY */}
        {roleType === 'super_admin' && (
          <>
            {showRoomsPicker && dockExpanded && (
              <div className="pointer-events-auto bg-slate-900/95 border border-lime-500/60 rounded-2xl p-2 shadow-2xl flex flex-wrap items-center justify-center gap-1.5">
                {SUBJECT_ROOMS.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      onQuickTravel(room.x, room.z);
                      setShowRoomsPicker(false);
                      onOpenSubjectRoom(room.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    {room.icon}
                    <span>{room.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pointer-events-auto flex flex-col items-center">
              <button
                type="button"
                onClick={() => setDockExpanded((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-slate-900/92 border border-b-0 border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white"
              >
                {dockExpanded ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Thu gọn bảng điều khiển</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Mở bảng điều khiển</span>
                  </>
                )}
              </button>

              {dockExpanded && (
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl px-3 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-1.5 max-w-[92vw]">
                  <button
                    type="button"
                    onClick={() => setShowRoomsPicker((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>5 Phòng Học</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenVenue('grab')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Grab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onQuickTravel(-34, 47);
                      onOpenVenue('jollibee');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" />
                    <span>Jollibee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onQuickTravel(-12, 47);
                      onOpenVenue('net_cafe');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quán Net</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onQuickTravel(13, 48);
                      onOpenVenue('park');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <FerrisWheel className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Công Viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onQuickTravel(43.5, 6, 0);
                      onOpenMuseum('floor1');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 text-amber-200 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bảo Tàng LS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenHub('uniform')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <Shirt className="w-3.5 h-3.5 text-lime-400" />
                    <span>Tủ đồ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenHub('shop')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                    <span>Nhà Sách & Xe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenHub('career')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>Khởi nghiệp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenHub('streak')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>VIP ({playerState.streakDays}/7)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenHub('leaderboard')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span>BXH Tuần</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom-Right Corner: Settings Gear Popover */}
      <div className="pointer-events-auto fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
        {settingsOpen && (
          <div className="w-60 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl space-y-1 text-xs">
            <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
              Cài đặt hệ thống & Cá nhân
            </div>

            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                onOpenProfile();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-100 font-medium flex items-center gap-2.5 text-left"
            >
              <User className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Mục cá nhân & Thành tích</span>
            </button>

            <button
              type="button"
              onClick={onToggleHelmet}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-100 font-medium flex items-center justify-between gap-2 text-left"
            >
              <span className="inline-flex items-center gap-2.5">
                <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mũ bảo hiểm</span>
              </span>
              <span
                className={`text-[11px] font-bold ${
                  playerState.wearingHelmet ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {playerState.wearingHelmet ? 'Đang đội' : 'Đã tháo'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowTouchPad((v) => !v)}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-100 font-medium flex items-center justify-between gap-2 text-left"
            >
              <span className="inline-flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Phím ảo (W/A/S/D)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {showTouchPad ? 'Hiện' : 'Ẩn'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                onOpenScanner();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-100 font-medium flex items-center gap-2.5 text-left"
            >
              <Camera className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Quét mặt & Hư / Gương mẫu</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-100 font-medium flex items-center justify-between gap-2 text-left"
            >
              <span className="inline-flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>Âm thanh</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {soundEnabled ? 'Đang bật' : 'Đã tắt'}
              </span>
            </button>

            <div className="pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  onSignOut();
                }}
                title={userEmail ? `Đăng xuất (${userEmail})` : 'Đăng xuất Google'}
                className="w-full px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-300 font-semibold flex items-center gap-2.5 text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Đăng xuất Google</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className={`w-11 h-11 rounded-2xl border shadow-xl flex items-center justify-center transition-colors ${
            settingsOpen
              ? 'bg-lime-500 border-lime-400 text-slate-950'
              : 'bg-slate-900/95 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white'
          }`}
          aria-label="Mở Cài đặt"
          title="Cài đặt (Phím ảo, Quét mặt, Âm thanh, Mũ bảo hiểm, Đăng xuất)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
