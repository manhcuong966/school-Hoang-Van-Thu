import React from 'react';
import { Check, Coffee, ShieldAlert, Shirt, Sparkles, X, Zap } from 'lucide-react';
import { formatVND, OUTFITS, VENDING_DRINKS } from '../data/gameData';
import { OutfitId, PlayerState, VendingDrinkDef } from '../types/game';

export type ShopServiceMode = 'clothing_shop' | 'vending_machine' | null;

interface ShopServicesModalProps {
  mode: ShopServiceMode;
  playerState: PlayerState;
  hasFullAccess: boolean;
  onBuyOrEquipOutfit: (id: OutfitId) => void;
  onBuyVendingDrink: (drink: VendingDrinkDef) => void;
  onClose: () => void;
}

export const ShopServicesModal: React.FC<ShopServicesModalProps> = ({
  mode,
  playerState,
  hasFullAccess,
  onBuyOrEquipOutfit,
  onBuyVendingDrink,
  onClose,
}) => {
  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                mode === 'clothing_shop'
                  ? 'bg-pink-500/15 border-pink-400/50 text-pink-300'
                  : 'bg-sky-500/15 border-sky-400/50 text-sky-300'
              }`}
            >
              {mode === 'clothing_shop' ? (
                <Shirt className="w-5 h-5" />
              ) : (
                <Coffee className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 font-mono-nums">
                Số dư của bạn: <span className="text-amber-400 font-bold">{formatVND(playerState.money)}</span>
                {' · '}Năng lượng: <span className="text-cyan-300 font-bold">{playerState.energy}%</span>
              </p>
              <h2 className="font-display text-lg font-bold text-white">
                {mode === 'clothing_shop'
                  ? 'Cửa Hàng Quần Áo Thời Trang 8A3'
                  : 'Tủ Nước Bán Tự Động · Bảo Tàng Lạng Sơn'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            aria-label="Đóng cửa hàng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!hasFullAccess && (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-700/70 flex items-center gap-2.5 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Chế độ Khách Tham Quan chỉ xem trưng bày. Thành viên lớp 8A3 mới được mua sắm và sử dụng đồ uống.
              </span>
            </div>
          )}

          {mode === 'clothing_shop' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {OUTFITS.map((item) => {
                const owned = playerState.ownedOutfits.includes(item.id);
                const equipped = playerState.equippedOutfit === item.id;
                const canAfford = playerState.money >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                      equipped
                        ? 'bg-pink-950/25 border-pink-400/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="h-20 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center bg-slate-900 gap-2 p-2">
                        <div
                          className="w-12 h-12 rounded-lg border border-white/20 shadow-inner"
                          style={{ backgroundColor: item.previewPrimary }}
                        />
                        <div
                          className="w-7 h-12 rounded-lg border border-white/20 shadow-inner"
                          style={{ backgroundColor: item.previewSecondary }}
                        />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-white">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {owned ? (
                      <button
                        type="button"
                        disabled={equipped || !hasFullAccess}
                        onClick={() => onBuyOrEquipOutfit(item.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                          equipped
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                            : !hasFullAccess
                              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-pink-500 hover:bg-pink-400 text-white'
                        }`}
                      >
                        {equipped && <Check className="w-3.5 h-3.5" />}
                        <span>{equipped ? 'Đang mặc' : 'Mặc trang phục này'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!hasFullAccess || !canAfford}
                        onClick={() => onBuyOrEquipOutfit(item.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono-nums transition-colors ${
                          !hasFullAccess || !canAfford
                            ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        }`}
                      >
                        {!hasFullAccess ? 'Chỉ dành cho 8A3' : `Mua ${formatVND(item.price)}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'vending_machine' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {VENDING_DRINKS.map((drink) => {
                const canAfford = playerState.money >= drink.price;
                return (
                  <div
                    key={drink.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-14 rounded-lg border border-white/20 shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: drink.colorHex }}
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm text-white truncate">
                          {drink.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {drink.description}
                        </p>
                        <p className="text-xs font-mono-nums text-cyan-300 mt-1.5 inline-flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> +{drink.energyRestore}% Năng lượng · +{drink.xpReward} XP
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!hasFullAccess || !canAfford}
                      onClick={() => onBuyVendingDrink(drink)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono-nums whitespace-nowrap shrink-0 transition-colors ${
                        !hasFullAccess || !canAfford
                          ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                      }`}
                    >
                      Mua {formatVND(drink.price)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
