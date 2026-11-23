import React, { useEffect, useState } from 'react';
import {
  Bike,
  FerrisWheel,
  Flame,
  Gamepad2,
  MapPin,
  Navigation,
  Sparkles,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';
import {
  FOOD_DELIVERY_MISSIONS,
  FOOD_MENU,
  formatVND,
  GRAB_DESTINATIONS,
  GRAB_MISSIONS,
} from '../data/gameData';
import {
  ActiveGrabMission,
  FoodItemDef,
  GrabDestination,
  PlayerState,
  VenueModalType,
} from '../types/game';
import { soundEngine } from '../utils/sound';

interface TownVenueModalProps {
  venue: VenueModalType;
  playerState: PlayerState;
  activeGrabMission: ActiveGrabMission | null;
  onBuyFood: (item: FoodItemDef) => void;
  onWorkJollibee: () => void;
  onWinNetGame: (prizeMoney: number, xpGain: number, fee: number) => void;
  onParkPlay: (energyGain: number, xpGain: number, label: string) => void;
  onTakeGrabRide: (dest: GrabDestination) => void;
  onAcceptGrabMission: (mission: ActiveGrabMission) => void;
  onCancelGrabMission: () => void;
  onClose: () => void;
}

export const TownVenueModal: React.FC<TownVenueModalProps> = ({
  venue,
  playerState,
  activeGrabMission,
  onBuyFood,
  onWorkJollibee,
  onWinNetGame,
  onParkPlay,
  onTakeGrabRide,
  onAcceptGrabMission,
  onCancelGrabMission,
  onClose,
}) => {
  // Cyber Net Mini-game State
  const [netPlaying, setNetPlaying] = useState(false);
  const [netTimeLeft, setNetTimeLeft] = useState(8);
  const [netHits, setNetHits] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [netResult, setNetResult] = useState<{ hits: number; prize: number } | null>(null);

  // Grab modal sub-tab
  const [grabMode, setGrabMode] = useState<'ride' | 'driver'>('ride');

  useEffect(() => {
    if (!netPlaying) return;
    const timer = window.setInterval(() => {
      setNetTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timer);
          setNetPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [netPlaying]);

  useEffect(() => {
    if (!netPlaying && netTimeLeft === 0 && netResult === null) {
      const prize = netHits >= 10 ? 45000 : netHits >= 6 ? 25000 : 12000;
      const xp = netHits >= 10 ? 60 : 35;
      setNetResult({ hits: netHits, prize });
      soundEngine.playGoodDeed();
      onWinNetGame(prize, xp, 5000);
    }
  }, [netPlaying, netTimeLeft, netHits, netResult, onWinNetGame]);

  const startNetGame = () => {
    if (playerState.money < 5000 || playerState.energy < 15) return;
    setNetResult(null);
    setNetHits(0);
    setNetTimeLeft(8);
    setTargetPos({ x: 45, y: 50 });
    setNetPlaying(true);
  };

  const hitNetTarget = () => {
    if (!netPlaying) return;
    soundEngine.playCoin();
    setNetHits((h) => h + 1);
    setTargetPos({
      x: 12 + Math.floor(Math.random() * 76),
      y: 16 + Math.floor(Math.random() * 68),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {venue === 'jollibee' && <UtensilsCrossed className="w-5 h-5 text-rose-400" />}
            {venue === 'net_cafe' && <Gamepad2 className="w-5 h-5 text-cyan-400" />}
            {venue === 'park' && <FerrisWheel className="w-5 h-5 text-emerald-400" />}
            {venue === 'grab' && <Bike className="w-5 h-5 text-green-400" />}
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {venue === 'jollibee' && 'Jollibee & Tiệm Gà Rán Phố Trường'}
                {venue === 'net_cafe' && 'Quán Net Cyber 8A3'}
                {venue === 'park' && 'Công Viên & Khu Vui Chơi'}
                {venue === 'grab' && 'Trạm GrabBike & GrabCar 8A3'}
              </h2>
              <p className="text-xs text-slate-400 font-mono-nums">
                Số dư: <span className="text-amber-400 font-semibold">{formatVND(playerState.money)}</span>
                {' · '}
                Năng lượng: <span className="text-emerald-400 font-semibold">{playerState.energy}%</span>
              </p>
            </div>
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {venue === 'jollibee' && (
            <>
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-sm text-white">
                    Nạp năng lượng & Nhận Buff Học Tập (+30% tiền thưởng)
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Ăn gà rán giòn giúp bạn tràn đầy năng lượng để chạy Grab, thi đấu Net và học bài điểm cao!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onWorkJollibee}
                  disabled={playerState.energy < 20}
                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                    playerState.energy < 20
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  Làm thêm phục vụ (+16k / -15% NL)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FOOD_MENU.map((item) => {
                  const canAfford = playerState.money >= item.price;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <span className="text-xs font-semibold text-rose-400">{item.brand}</span>
                        <h3 className="font-display font-bold text-base text-white mt-0.5">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-3 space-y-1 text-xs font-mono-nums">
                          <p className="text-emerald-400">+{item.energyRestore}% Năng lượng</p>
                          <p className="text-lime-400">
                            +{item.xpReward} XP · Buff {item.buffLessons} tiết học
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onBuyFood(item)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold font-mono-nums transition-colors ${
                          canAfford
                            ? 'bg-rose-500 hover:bg-rose-400 text-white'
                            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        Đặt món ({formatVND(item.price)})
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 2-step Jollibee Food Delivery */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Nhận đơn Giao Đồ Ăn Jollibee (2 bước: Lấy tại quầy → Giao cho khách)</span>
                </h3>
                {activeGrabMission ? (
                  <div className="p-4 rounded-xl bg-amber-950/35 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-amber-300">
                        {activeGrabMission.stage === 'pickup'
                          ? 'Bước 1/2: Đến cột sáng vàng để lấy đồ ăn'
                          : 'Bước 2/2: Mang đồ ăn tới cột sáng xanh lá'}
                      </p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {activeGrabMission.title} ·{' '}
                        {activeGrabMission.stage === 'pickup'
                          ? activeGrabMission.pickupLabel
                          : activeGrabMission.targetLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onCancelGrabMission}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap"
                    >
                      Hủy đơn hiện tại
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {FOOD_DELIVERY_MISSIONS.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <span className="text-xs font-semibold text-amber-400">{m.customer}</span>
                          <h4 className="font-display font-bold text-sm text-white mt-0.5">
                            {m.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1.5">
                            Bước 1 (Lấy đồ ăn): <span className="text-amber-300">{m.pickupLabel}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Bước 2 (Giao tới): <span className="text-emerald-300">{m.targetLabel}</span>
                          </p>
                          <p className="text-xs font-mono-nums text-amber-400 mt-2">
                            Thù lao: +{formatVND(m.rewardMoney)} · +{m.rewardXp} XP
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onAcceptGrabMission({
                              ...m,
                              id: `food_${Date.now()}_${idx}`,
                              stage: 'pickup',
                            })
                          }
                          className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Nhận đơn Giao Đồ Ăn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {venue === 'net_cafe' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Giải Đấu Phản Xạ eSports 8A3
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phí máy: 5.000đ & 15% Năng lượng · Bấm trúng càng nhiều mục tiêu Cyber trong 8 giây, giải thưởng càng lớn (tới 45.000đ)!
                  </p>
                </div>
                {!netPlaying && (
                  <button
                    type="button"
                    onClick={startNetGame}
                    disabled={playerState.money < 5000 || playerState.energy < 15}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-colors ${
                      playerState.money < 5000 || playerState.energy < 15
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                    }`}
                  >
                    Bắt đầu trận đấu (5.000đ)
                  </button>
                )}
              </div>

              <div className="relative h-64 w-full rounded-2xl bg-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center">
                {netPlaying ? (
                  <>
                    <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs font-mono-nums">
                      <span className="text-cyan-300 font-bold">Điểm chạm: {netHits}</span>
                      <span className="text-amber-400 font-bold">Còn lại: {netTimeLeft}s</span>
                    </div>
                    <button
                      type="button"
                      onClick={hitNetTarget}
                      style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center transition-transform active:scale-90"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                  </>
                ) : netResult ? (
                  <div className="text-center space-y-2 p-6">
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="font-display text-xl font-bold text-white">
                      Kết quả: {netResult.hits} pha xử lý chuẩn!
                    </h4>
                    <p className="text-sm font-mono-nums text-emerald-400 font-bold">
                      Thắng giải: +{formatVND(netResult.prize)} & XP!
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <Gamepad2 className="w-10 h-10 text-cyan-400 mx-auto" />
                    <p className="text-sm text-slate-300">
                      Sẵn sàng trên dàn PC 240Hz tại Cyber Net 8A3. Bấm nút "Bắt đầu trận đấu" để thi tài!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {venue === 'park' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Ngồi Vòng Quay Mặt Trời Ngắm Toàn Trường
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thư giãn trên cabin vòng quay công viên giúp phục hồi nhanh năng lượng sau giờ học.
                  </p>
                  <p className="text-xs font-mono-nums text-emerald-400 mt-3">
                    +45% Năng lượng · +25 XP · Miễn phí
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onParkPlay(45, 25, 'Đi Vòng Quay Công Viên')}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Lên Vòng Quay Ngay
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Chơi Cầu Trượt & Dạo Hồ Nước Xanh
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Vận động nhẹ nhàng cùng bạn bè lớp 8A3 ngoài trời xanh mát.
                  </p>
                  <p className="text-xs font-mono-nums text-emerald-400 mt-3">
                    +30% Năng lượng · +20 XP · Miễn phí
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onParkPlay(30, 20, 'Vui chơi tại Công Viên')}
                  className="w-full py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Vui Chơi Thư Giãn
                </button>
              </div>
            </div>
          )}

          {venue === 'grab' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 w-fit">
                <button
                  type="button"
                  onClick={() => setGrabMode('ride')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    grabMode === 'ride'
                      ? 'bg-green-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Đặt xe Grab đi nhanh
                </button>
                <button
                  type="button"
                  onClick={() => setGrabMode('driver')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    grabMode === 'driver'
                      ? 'bg-green-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Chạy Grab kiếm tiền
                </button>
              </div>

              {grabMode === 'ride' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GRAB_DESTINATIONS.map((dest) => {
                    const canAfford = playerState.money >= dest.rideFee;
                    return (
                      <div
                        key={dest.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
                            <MapPin className="w-4 h-4 text-green-400 shrink-0" />
                            <span className="truncate">{dest.label}</span>
                          </div>
                          <p className="text-xs font-mono-nums text-slate-400 mt-1">
                            Cước Grab: {formatVND(dest.rideFee)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onTakeGrabRide(dest)}
                          disabled={!canAfford}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                            canAfford
                              ? 'bg-green-500 hover:bg-green-400 text-slate-950'
                              : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          Gọi xe
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGrabMission ? (
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        activeGrabMission.stage === 'pickup'
                          ? 'bg-amber-950/35 border-amber-500/50'
                          : 'bg-green-950/35 border-green-500/50'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            activeGrabMission.stage === 'pickup' ? 'text-amber-300' : 'text-green-400'
                          }`}
                        >
                          {activeGrabMission.stage === 'pickup'
                            ? 'Bước 1/2: Đến lấy hàng / đón khách'
                            : 'Bước 2/2: Đang trên đường đi giao'}
                        </p>
                        <h4 className="font-display font-bold text-base text-white mt-0.5">
                          {activeGrabMission.title} →{' '}
                          {activeGrabMission.stage === 'pickup'
                            ? activeGrabMission.pickupLabel
                            : activeGrabMission.targetLabel}
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {activeGrabMission.stage === 'pickup'
                            ? `Di chuyển tới cột sáng VÀNG tại "${activeGrabMission.pickupLabel}" và bấm [E] để nhận hàng/đón khách trước!`
                            : `Di chuyển tới cột sáng XANH LÁ tại "${activeGrabMission.targetLabel}" để hoàn thành & nhận ${formatVND(activeGrabMission.rewardMoney)}!`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onCancelGrabMission}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap"
                      >
                        Hủy đơn
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {GRAB_MISSIONS.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                              <Navigation className="w-3.5 h-3.5" />
                              <span>{m.customer}</span>
                            </div>
                            <h4 className="font-display font-bold text-sm text-white mt-1">
                              {m.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              Bước 1 (Lấy hàng/Đón): <span className="text-amber-300">{m.pickupLabel}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Bước 2 (Giao tới): <span className="text-emerald-300">{m.targetLabel}</span>
                            </p>
                            <p className="text-xs font-mono-nums text-amber-400 mt-2">
                              Thù lao: +{formatVND(m.rewardMoney)} · +{m.rewardXp} XP
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onAcceptGrabMission({
                                ...m,
                                id: `grab_${Date.now()}_${idx}`,
                                stage: 'pickup',
                              })
                            }
                            className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Nhận cuốc Grab này</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
