import React from 'react';
import {
  Award,
  Briefcase,
  CalendarCheck,
  Car,
  Check,
  Crown,
  Lock,
  Plane,
  ShieldAlert,
  Shirt,
  ShoppingBag,
  Trophy,
  X,
} from 'lucide-react';
import {
  DAY_LABELS,
  formatVND,
  getRequiredUniformForDay,
  PART_TIME_JOBS,
  STARTUPS,
  SUPPLIES,
  UNIFORMS,
  VEHICLES,
} from '../data/gameData';
import {
  HubTab,
  LeaderboardEntry,
  PlayerState,
  StartupId,
  SupplyId,
  UniformId,
  VehicleId,
} from '../types/game';
import { SchoolClockInfo } from '../utils/schoolTime';

interface HubModalProps {
  activeTab: HubTab;
  playerState: PlayerState;
  schoolClock: SchoolClockInfo;
  leaderboardEntries: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  onChangeTab: (tab: HubTab) => void;
  onSelectUniform: (id: UniformId) => void;
  onBuyOrEquipVehicle: (id: VehicleId) => void;
  onBuyOrEquipSupply: (id: SupplyId) => void;
  onDoPartTimeJob: (jobId: string) => void;
  onBuyStartup: (id: StartupId) => void;
  onClaimDailyStreak: () => void;
  onClose: () => void;
}

const TABS: Array<{ id: HubTab; label: string; icon: React.ReactNode }> = [
  { id: 'uniform', label: 'Tủ Đồ & Đồng Phục', icon: <Shirt className="w-4 h-4" /> },
  { id: 'shop', label: 'Phương Tiện & Đồ Dùng', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'career', label: 'Làm Thêm & Khởi Nghiệp', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'streak', label: 'Điểm Danh & Quà VIP', icon: <CalendarCheck className="w-4 h-4" /> },
  { id: 'leaderboard', label: 'Bảng Xếp Hạng Tuần', icon: <Trophy className="w-4 h-4" /> },
];

export const HubModal: React.FC<HubModalProps> = ({
  activeTab,
  playerState,
  schoolClock,
  leaderboardEntries,
  leaderboardLoading,
  leaderboardError,
  onChangeTab,
  onSelectUniform,
  onBuyOrEquipVehicle,
  onBuyOrEquipSupply,
  onDoPartTimeJob,
  onBuyStartup,
  onClaimDailyStreak,
  onClose,
}) => {
  const req = getRequiredUniformForDay(schoolClock.dayOfWeek);
  const alreadyClaimedToday = playerState.lastClaimedDateStr === schoolClock.dateStr;
  const playerRankIdx = leaderboardEntries.findIndex((e) => e.isPlayer);
  const playerRank = playerRankIdx >= 0 ? `#${playerRankIdx + 1}` : 'Chưa xếp hạng';
  const isVisitor = !playerState.isClassMember;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Trung Tâm Học Sinh 8A3 · Trường THCS Hoàng Văn Thụ
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono-nums">
              Số dư: <span className="text-amber-400 font-semibold">{formatVND(playerState.money)}</span>
              {' · '}
              Level {playerState.level}
              {' · '}
              {DAY_LABELS[schoolClock.dayOfWeek]} ({schoolClock.periodOfDayLabel} · {schoolClock.weekKey})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === t.id
                  ? 'bg-lime-500 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isVisitor && activeTab !== 'leaderboard' && (
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-700/70 flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Chế độ Khách Tham Quan (Người ngoài lớp 8A3)</p>
                <p className="mt-0.5">
                  Chỉ học sinh có tên trong danh sách chính thức lớp 8A3 mới được thay đồng phục thi đua, mua sắm, làm thêm, nhận quà VIP và ghi tên trên Bảng Xếp Hạng.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'uniform' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">
                    Quy định hôm nay ({DAY_LABELS[schoolClock.dayOfWeek]})
                  </p>
                  <p className="font-display text-base font-bold text-white mt-0.5">
                    {req.label}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap ${
                    req.required === 'any' ||
                    playerState.equippedUniform === 'vip_8a3' ||
                    playerState.equippedUniform === req.required
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                  }`}
                >
                  {req.required === 'any' ||
                  playerState.equippedUniform === 'vip_8a3' ||
                  playerState.equippedUniform === req.required
                    ? 'Đúng đồng phục quy định'
                    : 'Chưa đúng đồng phục thứ hôm nay'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['white_246', 'green_35', 'vip_8a3'] as UniformId[]).map((uId) => {
                  const u = UNIFORMS[uId];
                  const owned = playerState.ownedUniforms.includes(uId);
                  const equipped = playerState.equippedUniform === uId;
                  const refImage =
                    uId === 'white_246'
                      ? '/assets/aistudio/image_408ef4d3.png'
                      : uId === 'green_35'
                        ? '/assets/aistudio/image_2b24881c.png'
                        : null;

                  return (
                    <div
                      key={uId}
                      className={`rounded-xl border p-4 flex flex-col justify-between gap-4 ${
                        equipped
                          ? 'bg-lime-950/25 border-lime-500/70'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="h-36 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                          {refImage ? (
                            <img
                              src={refImage}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain bg-white/95"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Crown className="w-10 h-10 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-semibold text-amber-300">
                                Áo Khoác Hoàng Gia 8A3
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-white text-sm">{u.name}</h3>
                          <p className="text-xs text-lime-400 mt-0.5">{u.scheduleNote}</p>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            {u.description}
                          </p>
                        </div>
                      </div>

                      {owned ? (
                        <button
                          type="button"
                          onClick={() => onSelectUniform(uId)}
                          disabled={equipped || isVisitor}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : isVisitor
                                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                : 'bg-lime-500 hover:bg-lime-400 text-slate-950'
                          }`}
                        >
                          {equipped ? 'Đang mặc' : isVisitor ? 'Chỉ dành cho 8A3' : 'Mặc đồng phục này'}
                        </button>
                      ) : (
                        <div className="w-full py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Mở khóa qua Quà VIP Tuần (7 ngày)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Phương tiện đi học 3D
                  </h3>
                  <p className="text-xs text-slate-400">
                    Khởi đầu đi bộ, kiếm tiền từ học tập & khởi nghiệp để mua ô tô, máy bay đi học!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {VEHICLES.map((v) => {
                    const owned = playerState.ownedVehicles.includes(v.id);
                    const equipped = playerState.equippedVehicle === v.id;
                    const levelLocked = playerState.level < v.unlockLevel && !owned;
                    const canAfford = playerState.money >= v.price;

                    return (
                      <div
                        key={v.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          equipped
                            ? 'bg-sky-950/30 border-sky-400/70'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-sm text-white">
                              {v.name}
                            </span>
                            {v.canFly ? (
                              <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                            ) : v.id === 'car' ? (
                              <Car className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {v.description}
                          </p>
                          <p className="text-xs font-mono-nums text-sky-300 mt-2">
                            Tốc độ: {v.speed} m/s {v.canFly ? '· Bay trên không' : ''}
                          </p>
                        </div>

                        {owned ? (
                          <button
                            type="button"
                            onClick={() => onBuyOrEquipVehicle(v.id)}
                            disabled={equipped || isVisitor}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                              equipped
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                : isVisitor
                                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                            }`}
                          >
                            {equipped ? 'Đang sử dụng' : 'Chọn phương tiện'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onBuyOrEquipVehicle(v.id)}
                            disabled={isVisitor || levelLocked || !canAfford}
                            className={`w-full py-2 rounded-lg text-xs font-bold font-mono-nums transition-colors ${
                              isVisitor || levelLocked || !canAfford
                                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                          >
                            {isVisitor
                              ? 'Chỉ dành cho 8A3'
                              : levelLocked
                                ? `Cần Level ${v.unlockLevel}`
                                : `Mua ${formatVND(v.price)}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Đồ dùng học tập (Basic đến Xịn xò)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Nâng cấp đồ dùng giúp nhân hệ số tiền thưởng và điểm kinh nghiệm mỗi tiết học!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {SUPPLIES.map((s) => {
                    const owned = playerState.ownedSupplies.includes(s.id);
                    const equipped = playerState.equippedSupply === s.id;
                    const canAfford = playerState.money >= s.price;

                    return (
                      <div
                        key={s.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          equipped
                            ? 'bg-lime-950/25 border-lime-500/70'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">{s.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {s.description}
                          </p>
                          <p className="text-xs font-mono-nums text-lime-400 mt-2">
                            Hệ số học tập: ×{s.bonusMultiplier.toFixed(1)}
                          </p>
                        </div>

                        {owned ? (
                          <button
                            type="button"
                            onClick={() => onBuyOrEquipSupply(s.id)}
                            disabled={equipped || isVisitor}
                            className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                              equipped
                                ? 'bg-lime-500/20 text-lime-300 border border-lime-500/40'
                                : isVisitor
                                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                  : 'bg-lime-500 hover:bg-lime-400 text-slate-950'
                            }`}
                          >
                            {equipped ? 'Đang trang bị' : 'Trang bị'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onBuyOrEquipSupply(s.id)}
                            disabled={isVisitor || !canAfford}
                            className={`w-full py-2 rounded-lg text-xs font-bold font-mono-nums transition-colors ${
                              isVisitor || !canAfford
                                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                          >
                            {isVisitor ? 'Chỉ dành cho 8A3' : `Mua ${formatVND(s.price)}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'career' && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      Làm thêm ngoài giờ học
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kiếm thêm thu nhập tích lũy vốn khởi nghiệp (tối đa 3 ca/ngày thực).
                    </p>
                  </div>
                  <span className="text-xs font-mono-nums text-slate-300">
                    Hôm nay: {playerState.jobsWorkedToday}/3 ca
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {PART_TIME_JOBS.map((job) => {
                    const locked = playerState.level < job.minLevel;
                    const limitReached = playerState.jobsWorkedToday >= 3;
                    return (
                      <div
                        key={job.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">{job.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{job.description}</p>
                          <p className="text-xs font-mono-nums text-amber-400 mt-2">
                            +{formatVND(job.pay)} · +{job.xp} XP
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDoPartTimeJob(job.id)}
                          disabled={isVisitor || locked || limitReached}
                          className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                            isVisitor || locked || limitReached
                              ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                              : 'bg-lime-500 hover:bg-lime-400 text-slate-950'
                          }`}
                        >
                          {isVisitor
                            ? 'Chỉ dành cho 8A3'
                            : locked
                              ? `Cần Level ${job.minLevel}`
                              : limitReached
                                ? 'Hết ca hôm nay'
                                : 'Nhận việc ngay'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Khởi nghiệp Học đường 8A3 (Thu nhập thụ động mỗi ngày)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mỗi ngày mới theo thời gian thực khi bạn đăng nhập vào trường, các dự án khởi nghiệp sẽ tự động sinh lời cho bạn!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {STARTUPS.map((st) => {
                    const owned = playerState.ownedStartups.includes(st.id);
                    const locked = playerState.level < st.unlockLevel && !owned;
                    const canAfford = playerState.money >= st.cost;

                    return (
                      <div
                        key={st.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          owned
                            ? 'bg-emerald-950/25 border-emerald-500/50'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-display font-bold text-sm text-white">{st.name}</h4>
                            {owned && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> Đang vận hành
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{st.description}</p>
                          <p className="text-xs font-mono-nums text-emerald-400 mt-2">
                            Thu nhập mỗi ngày: +{formatVND(st.dailyIncome)}
                          </p>
                        </div>

                        {!owned && (
                          <button
                            type="button"
                            onClick={() => onBuyStartup(st.id)}
                            disabled={isVisitor || locked || !canAfford}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold font-mono-nums transition-colors ${
                              isVisitor || locked || !canAfford
                                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                          >
                            {isVisitor
                              ? 'Chỉ dành cho 8A3'
                              : locked
                                ? `Cần Level ${st.unlockLevel}`
                                : `Đầu tư mở Startup (${formatVND(st.cost)})`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'streak' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Crown className="w-5 h-5" />
                    <span className="font-display font-bold text-base">
                      Tích Điểm 7 Ngày Nhận Quà VIP Tuần
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Vào game và điểm danh mỗi ngày thực để tích lũy đủ 7 ngày trong tuần mở Rương Quà VIP: +200.000đ, +500 XP, Vương miện 3D & Áo Khoác Hoàng Gia 8A3!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClaimDailyStreak}
                  disabled={isVisitor || (alreadyClaimedToday && playerState.streakDays < 7)}
                  className={`px-5 py-3 rounded-xl font-display font-bold text-sm whitespace-nowrap shrink-0 transition-colors ${
                    isVisitor
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : playerState.streakDays >= 7 && !playerState.vipClaimedThisWeek
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : alreadyClaimedToday
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-lime-500 hover:bg-lime-400 text-slate-950'
                  }`}
                >
                  {isVisitor
                    ? 'Chỉ dành cho 8A3'
                    : playerState.streakDays >= 7 && !playerState.vipClaimedThisWeek
                      ? 'Mở Rương Quà VIP Tuần!'
                      : alreadyClaimedToday
                        ? 'Đã điểm danh hôm nay'
                        : `Điểm danh Ngày ${playerState.streakDays}/7`}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const completed =
                    dayNum < playerState.streakDays ||
                    (dayNum === 7 && playerState.vipClaimedThisWeek);
                  const isCurrent = dayNum === playerState.streakDays && !completed;
                  const isVip = dayNum === 7;
                  return (
                    <div
                      key={dayNum}
                      className={`p-3.5 rounded-xl border text-center space-y-2 ${
                        completed
                          ? 'bg-emerald-950/40 border-emerald-500/60'
                          : isCurrent
                            ? 'bg-lime-950/30 border-lime-400'
                            : isVip
                              ? 'bg-amber-950/25 border-amber-500/50'
                              : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-400">Ngày {dayNum}</p>
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        {isVip ? (
                          <Crown className="w-5 h-5 text-amber-400" />
                        ) : completed ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Award className="w-5 h-5 text-lime-400" />
                        )}
                      </div>
                      <p className="text-xs font-mono-nums font-bold text-white">
                        {isVip ? 'QUÀ VIP' : `+${(dayNum * 5).toFixed(0)}k`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Bảng Xếp Hạng Tuần {schoolClock.weekKey} · Tập Thể Lớp 8A3
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chỉ hiển thị thành viên lớp 8A3 đã đăng nhập Google và xác thực đúng danh sách lớp.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Thứ hạng của bạn</p>
                  <p className="font-display text-xl font-extrabold text-amber-400 font-mono-nums">
                    {isVisitor ? 'Khách' : playerRank}
                  </p>
                </div>
              </div>

              {leaderboardError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-700/70 text-xs text-rose-200">
                  Không thể tải bảng xếp hạng: {leaderboardError}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400">
                      <th className="py-3 px-4 font-semibold">Hạng</th>
                      <th className="py-3 px-4 font-semibold">Học sinh 8A3</th>
                      <th className="py-3 px-4 font-semibold">Level</th>
                      <th className="py-3 px-4 font-semibold">Điểm Người Tốt</th>
                      <th className="py-3 px-4 font-semibold">Phương tiện</th>
                      <th className="py-3 px-4 font-semibold text-right">Điểm Tuần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-sm">
                    {leaderboardLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center text-xs text-slate-400">
                          Đang đồng bộ bảng xếp hạng trực tuyến lớp 8A3...
                        </td>
                      </tr>
                    ) : leaderboardEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center text-xs text-slate-400">
                          Chưa có thành viên lớp 8A3 nào ghi điểm tuần này. Hãy vào lớp học hoặc làm việc tốt để dẫn đầu BXH!
                        </td>
                      </tr>
                    ) : (
                      leaderboardEntries.map((entry, idx) => {
                        const vName =
                          VEHICLES.find((v) => v.id === entry.vehicleId)?.name || 'Đi bộ';
                        return (
                          <tr
                            key={entry.id}
                            className={
                              entry.isPlayer
                                ? 'bg-lime-500/15 text-white font-semibold'
                                : 'text-slate-300'
                            }
                          >
                            <td className="py-3 px-4 font-mono-nums font-bold">#{idx + 1}</td>
                            <td className="py-3 px-4">
                              {entry.name} {entry.isPlayer ? '(Bạn)' : ''}
                            </td>
                            <td className="py-3 px-4 font-mono-nums">Lv.{entry.level}</td>
                            <td className="py-3 px-4 font-mono-nums text-emerald-400">
                              {entry.goodPoints}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">{vName}</td>
                            <td className="py-3 px-4 font-mono-nums text-right text-amber-400 font-bold">
                              {entry.weeklyScore.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
