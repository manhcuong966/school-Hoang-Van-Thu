import React from 'react';
import {
  Award,
  Camera,
  Copy,
  Crown,
  HardHat,
  Heart,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  formatVND,
  getLevelTitle,
  getXpForNextLevel,
  OUTFITS,
  UNIFORMS,
  VEHICLES,
} from '../data/gameData';
import { PlayerState, RoleType } from '../types/game';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  myUid: string;
  userEmail: string | null;
  roleType: RoleType;
  roleLabel: string;
  onlineCount: number;
  isVehicleStowed: boolean;
  onCopyUid: (uid: string) => void;
  onToggleHelmet: () => void;
  onOpenScanner: () => void;
  onOpenUniform: () => void;
  onOpenLeaderboard: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  playerState,
  myUid,
  userEmail,
  roleType,
  roleLabel,
  onlineCount,
  isVehicleStowed,
  onCopyUid,
  onToggleHelmet,
  onOpenScanner,
  onOpenUniform,
  onOpenLeaderboard,
}) => {
  if (!isOpen) return null;

  const xpNeeded = getXpForNextLevel(playerState.level);
  const xpPct = Math.min(100, Math.round((playerState.xp / xpNeeded) * 100));
  const vehicle = VEHICLES.find((v) => v.id === playerState.equippedVehicle) || VEHICLES[0];
  const outfit = OUTFITS.find((o) => o.id === playerState.equippedOutfit) || OUTFITS[0];
  const uniform = UNIFORMS[playerState.equippedUniform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/15 border border-lime-400/50 flex items-center justify-center text-lime-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-lime-400 font-medium">
                Hồ Sơ Cá Nhân · Trường THCS Hoàng Văn Thụ
              </p>
              <h2 className="font-display text-lg font-bold text-white">
                Thông Tin Học Sinh & Thành Tích
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            aria-label="Đóng hồ sơ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Identity & Level Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-lime-400/70 bg-slate-900 shrink-0 flex items-center justify-center">
              {playerState.look.faceDataUrl ? (
                <img
                  src={playerState.look.faceDataUrl}
                  alt={playerState.look.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-9 h-9 text-lime-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-bold text-white truncate">
                  {playerState.look.name}
                </h3>
                {playerState.vipClaimedThisWeek && (
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {roleType === 'super_admin' || roleType === 'sub_admin' ? (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    {roleLabel}
                  </span>
                ) : playerState.isClassMember ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Thành viên Lớp 8A3
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Khách Tham Quan
                  </span>
                )}
                <span className="text-slate-600">·</span>
                <span className="text-lime-300 font-bold font-mono-nums">
                  Level {playerState.level} ({getLevelTitle(playerState.level)})
                </span>
                {playerState.isDelinquent && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-fuchsia-300 font-bold">
                      Học sinh Hư Đầu Gấu
                    </span>
                  </>
                )}
              </div>

              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-nums">
                  <span>Kinh nghiệm (XP)</span>
                  <span>
                    {playerState.xp} / {xpNeeded} XP ({xpPct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-400 transition-all duration-300"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>

              {/* UID & Online */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => onCopyUid(myUid)}
                  className="inline-flex items-center gap-1.5 hover:text-white font-mono-nums"
                  title="Sao chép Mã UID gửi Admin"
                >
                  <span>UID: {myUid}</span>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono-nums">
                  <Users className="w-3.5 h-3.5" /> {onlineCount} đang online
                </span>
              </div>
              {userEmail && (
                <p className="text-[11px] text-slate-500">Google: {userEmail}</p>
              )}
            </div>
          </div>

          {/* Equipment & Safety Gear */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <p className="text-slate-400">Trang phục & Đồng phục</p>
              <p className="font-bold text-white truncate">{outfit.name}</p>
              <p className="text-slate-400 truncate">Đồng phục: {uniform.name}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-slate-400">Phương tiện & Mũ bảo hiểm</p>
                <p className="font-bold text-sky-300 truncate">
                  {vehicle.name} {isVehicleStowed ? '(Đã cất trong trường/bảo tàng)' : ''}
                </p>
                <p
                  className={`mt-0.5 font-semibold ${
                    playerState.wearingHelmet ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {playerState.wearingHelmet ? 'Đang đội mũ bảo hiểm' : 'Chưa đội mũ bảo hiểm'}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleHelmet}
                className={`px-3 py-2 rounded-lg font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors ${
                  playerState.wearingHelmet
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>{playerState.wearingHelmet ? 'Tháo mũ' : 'Đội mũ'}</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <p className="text-slate-400">Số dư hiện tại</p>
              <p className="font-mono-nums text-base font-bold text-amber-400 mt-1">
                {formatVND(playerState.money)}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <p className="text-slate-400">Điểm Tuần</p>
              <p className="font-mono-nums text-base font-bold text-lime-400 mt-1">
                {playerState.weeklyScore.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <p className="text-slate-400">Tiết học / Grab</p>
              <p className="font-mono-nums text-base font-bold text-sky-300 mt-1">
                {playerState.lessonsCompleted} tiết · {playerState.grabMissionsCompleted} đơn
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <p className="text-slate-400">Người tốt / VIP</p>
              <p className="font-mono-nums text-base font-bold text-emerald-400 mt-1 inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" /> {playerState.goodPoints} · {playerState.streakDays}/7
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 text-lime-400" />
              <span>Quét mặt & Đổi Gương mẫu / Đầu gấu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUniform();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Shirt className="w-3.5 h-3.5 text-sky-400" />
              <span>Tủ Đồng Phục & VIP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Xem BXH Tuần</span>
            </button>

            {playerState.vipClaimedThisWeek && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 ml-1">
                <Award className="w-3.5 h-3.5" /> VIP 8A3
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
