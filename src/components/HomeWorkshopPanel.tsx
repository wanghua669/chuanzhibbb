import React, { useState } from 'react';
import {
  Hammer,
  Sparkles,
  Gift,
  Coins,
  Check,
  Plus,
  Download,
  BookOpen,
  Coffee,
  Briefcase,
} from 'lucide-react';
import { FurnitureItem, CyberGiftItem, PersonaProfile } from '../types/cyber';
import { synthesizeAIPixelItem } from '../services/llmBrain';

interface HomeWorkshopPanelProps {
  persona: PersonaProfile;
  furniture: FurnitureItem[];
  gifts: CyberGiftItem[];
  onToggleFurniture: (id: string) => void;
  onCreateCustomPixelItem: (item: FurnitureItem) => void;
  onTriggerWorkEarn: () => void;
  onTriggerBuyCola: () => void;
  onUnlockNewGift: () => void;
}

export const HomeWorkshopPanel: React.FC<HomeWorkshopPanelProps> = ({
  persona,
  furniture,
  gifts,
  onToggleFurniture,
  onCreateCustomPixelItem,
  onTriggerWorkEarn,
  onTriggerBuyCola,
  onUnlockNewGift,
}) => {
  const [activeTab, setActiveTab] = useState<'furniture' | 'ai_craft' | 'economy_gifts'>('furniture');
  const [craftPrompt, setCraftPrompt] = useState('');
  const [selectedGift, setSelectedGift] = useState<CyberGiftItem | null>(gifts[0] || null);

  const handleSynthesizeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!craftPrompt.trim()) return;
    const result = synthesizeAIPixelItem(craftPrompt.trim());
    const newItem: FurnitureItem = {
      id: `custom-${Date.now()}`,
      type: 'ai_custom_pixel',
      name: result.name,
      category: 'ai_custom',
      x: 0.35 + Math.random() * 0.3,
      y: 0.58 + Math.random() * 0.18,
      zLayer: 2,
      placed: true,
      price: 0,
      affectionBonus: 25,
      interactiveTag: 'custom_gift',
      description: result.description,
      isCustomPixel: true,
      customMatrix: result.matrix,
      customPalette: result.palette,
    };
    onCreateCustomPixelItem(newItem);
    setCraftPrompt('');
  };

  // 一键将赛博小人画的像素纪念壁纸导出为 PNG 保存到本地
  const handleDownloadWallpaper = (gift: CyberGiftItem) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    // 像素繁星
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : '#fde047';
      ctx.fillRect((i * 73) % 620, (i * 41) % 260, 4, 4);
    }

    // 纪念文字
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`CyberTwin Box · ${gift.title}`, 40, 290);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Created by ${persona.name} (Lv.${persona.level} 赛博伴生分身亲手绘制)`, 40, 322);

    const link = document.createElement('a');
    link.download = `CyberTwin-${persona.name}-Wallpaper.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-4 backdrop-blur-md">
      {/* 顶部选项卡与小人独立经济金库概览 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('furniture')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'furniture'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Hammer className="h-3.5 w-3.5" />
            像素家具图鉴 ({furniture.filter((f) => f.placed).length}/{furniture.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_craft')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'ai_craft'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 像素造物工坊
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('economy_gifts')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'economy_gifts'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            好感度打工金库 & 分身回礼 ({gifts.length})
          </button>
        </div>

        {/* 小人独立金库状态徽章 */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-mono font-semibold">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            小人金库: {persona.cyberCoins} 币 (时薪 +{persona.hourlyWage}/h)
          </span>
        </div>
      </div>

      {/* Tab 1: 像素家具图鉴拼装 */}
      {activeTab === 'furniture' && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {furniture.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleFurniture(item.id)}
              className={`cursor-pointer rounded-xl border p-2.5 transition flex flex-col justify-between ${
                item.placed
                  ? 'border-cyan-500/40 bg-cyan-950/25 shadow-inner'
                  : 'border-slate-800 bg-slate-950/50 opacity-75 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate">{item.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      item.placed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.placed ? '已摆放' : '点击放入'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-cyan-300/90 pt-1.5 border-t border-slate-800/80">
                <span>好感度 +{item.affectionBonus}</span>
                <span>{item.placed ? '可在画面内拖拽移动' : '点击布置到房间'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: AI 一键生成专属像素物品/礼物 */}
      {activeTab === 'ai_craft' && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-purple-500/25 bg-purple-950/15 p-3">
            <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              主人专属造物权：小人自己不能生成物品，但您可以用自然语言为它生成 32-Bit 像素礼物空投到房间！
            </div>
            <form onSubmit={handleSynthesizeItem} className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={craftPrompt}
                onChange={(e) => setCraftPrompt(e.target.value)}
                placeholder="例如：送他一台复古红白机游戏机 / 一只像素橘猫 / 一杯冰美式咖啡..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:opacity-95 transition shrink-0"
              >
                <Plus className="h-4 w-4" />
                生成像素礼物并空投
              </button>
            </form>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              <span>快捷灵感：</span>
              {[
                '送他一台复古红白机游戏机',
                '生成一只治愈像素橘猫',
                '送一杯冰镇手冲咖啡',
                '全息赛博能量水晶',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCraftPrompt(preset)}
                  className="rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-slate-300 hover:border-purple-400/50 hover:text-purple-300 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 好感度经济学（赛博打工、自主买可乐、回赠主人礼物） */}
      {activeTab === 'economy_gifts' && (
        <div className="mt-3 grid grid-cols-12 gap-3">
          <div className="col-span-12 sm:col-span-5 space-y-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>赛博分身自主经济循环</span>
                <span className="text-amber-300 font-mono">好感度 {persona.affection}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                随着关系提升，小人会在电脑桌前自主敲代码赚钱，攒够赛博币不仅能自己买像素可乐喝，还会主动为您准备回礼！
              </p>
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={onTriggerWorkEarn}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  让小人去电脑桌打工赚钱 (+{persona.hourlyWage}币)
                </button>
                <button
                  type="button"
                  onClick={onTriggerBuyCola}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  小人花 15 币去售货机买可乐犒劳自己
                </button>
                <button
                  type="button"
                  onClick={onUnlockNewGift}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition"
                >
                  <Gift className="h-3.5 w-3.5" />
                  用打工金币为主人撰写新《观察日记》(-25币)
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-7 rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              {gifts.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGift(g)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    selectedGift?.id === g.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {g.type === 'observation_diary' ? '📔 观察手记' : '🎨 像素纪念画'}
                </button>
              ))}
            </div>

            {selectedGift && (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                    {selectedGift.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">{selectedGift.createdAt}</span>
                </div>
                <p className="text-[11px] text-slate-300 whitespace-pre-line bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 max-h-28 overflow-y-auto leading-relaxed">
                  {selectedGift.diaryContent || selectedGift.subtitle}
                </p>
                {selectedGift.type === 'pixel_wallpaper' && (
                  <button
                    type="button"
                    onClick={() => handleDownloadWallpaper(selectedGift)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    保存小人手绘像素壁纸到电脑 (.PNG)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
