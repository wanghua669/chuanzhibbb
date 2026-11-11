import React, { useState } from 'react';
import {
  Hammer,
  Sparkles,
  Gift,
  Coins,
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
      y: 0.6 + Math.random() * 0.16,
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

  const handleDownloadWallpaper = (gift: CyberGiftItem) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#FDF8F0');
    grad.addColorStop(0.5, '#F9E5D0');
    grad.addColorStop(1, '#F2D0B6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    ctx.fillStyle = '#4A3525';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`CyberTwin Cozy Studio · ${gift.title}`, 40, 280);
    ctx.fillStyle = '#E07A5F';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Hand-drawn by ${persona.name} (Lv.${persona.level} 治愈系伴生分身亲手绘制)`, 40, 316);

    const link = document.createElement('a');
    link.download = `CyberTwin-${persona.name}-CozyCard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="rounded-2xl border-2 border-[#E2D0BA] bg-[#FFFDF9] p-3.5 shadow-sm">
      {/* 顶部温馨选项卡与小人金库 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE0D0] pb-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('furniture')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
              activeTab === 'furniture'
                ? 'bg-[#E07A5F] text-white shadow-sm'
                : 'bg-[#FAF3E8] text-[#6E4F35] hover:bg-[#EFE4D4]'
            }`}
          >
            <Hammer className="h-3.5 w-3.5" />
            精绘家具图鉴 ({furniture.filter((f) => f.placed).length}/{furniture.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_craft')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
              activeTab === 'ai_craft'
                ? 'bg-[#6B9E78] text-white shadow-sm'
                : 'bg-[#FAF3E8] text-[#6E4F35] hover:bg-[#EFE4D4]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 像素造物工坊
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('economy_gifts')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
              activeTab === 'economy_gifts'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'bg-[#FAF3E8] text-[#6E4F35] hover:bg-[#EFE4D4]'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            打工金库 & 伴生手账回礼 ({gifts.length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/40 px-2.5 py-1 text-[#92400E] font-mono font-bold">
            <Coins className="h-3.5 w-3.5 text-[#D97706]" />
            小人储蓄罐: {persona.cyberCoins} 币 (+{persona.hourlyWage}/h)
          </span>
        </div>
      </div>

      {/* Tab 1: 32-Bit 精绘家具图鉴 */}
      {activeTab === 'furniture' && (
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
          {furniture.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleFurniture(item.id)}
              className={`cursor-pointer rounded-xl border p-2.5 transition flex flex-col justify-between ${
                item.placed
                  ? 'border-[#E07A5F] bg-[#FFF7F2] shadow-sm'
                  : 'border-[#E2D0BA] bg-[#FAF5EE] opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-[#4A3525] truncate">{item.name}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      item.placed
                        ? 'bg-[#E8F3EA] text-[#2F6B40]'
                        : 'bg-[#EBE0D0] text-[#7C5D41]'
                    }`}
                  >
                    {item.placed ? '已摆放' : '放入房间'}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A725E] mt-1 line-clamp-1">{item.description}</p>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-[#B07D54] pt-1 border-t border-[#EDE0D0]">
                <span>羁绊 +{item.affectionBonus}</span>
                <span>{item.placed ? '支持画布内拖拽' : '点击摆入'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: AI 像素礼物合成工坊 */}
      {activeTab === 'ai_craft' && (
        <div className="mt-2.5">
          <div className="rounded-xl border border-[#D4B895] bg-[#FAF4EB] p-3">
            <div className="text-xs font-bold text-[#5C4028] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#E07A5F]" />
              主人专属造物台：输入任何你想送给分身的礼物描述，实时合成像素摆件放到阳光木屋里！
            </div>
            <form onSubmit={handleSynthesizeItem} className="mt-2 flex gap-2">
              <input
                type="text"
                value={craftPrompt}
                onChange={(e) => setCraftPrompt(e.target.value)}
                placeholder="例如：送他一台复古红白机 / 生成一只像素橘猫 / 一杯手冲焦糖拿铁..."
                className="flex-1 rounded-xl border border-[#D4B895] bg-[#FFFDF9] px-3 py-1.5 text-xs text-[#4A3525] placeholder-[#A68E78] focus:border-[#E07A5F] focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-xl bg-[#E07A5F] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#D0694E] transition shrink-0 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                合成并送出礼物
              </button>
            </form>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#7C5D41]">
              <span>快捷礼物贴纸：</span>
              {[
                '送他一台复古红白机游戏机',
                '生成一只治愈像素橘猫',
                '送一杯热气腾腾的拿铁咖啡',
                '星空水晶音乐摆件',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCraftPrompt(preset)}
                  className="rounded-lg border border-[#DFCBB2] bg-[#FFFDF9] px-2 py-0.5 text-[#5C4028] hover:border-[#E07A5F] hover:text-[#E07A5F] transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 好感度打工金库与手账回礼 */}
      {activeTab === 'economy_gifts' && (
        <div className="mt-2.5 grid grid-cols-12 gap-3">
          <div className="col-span-12 sm:col-span-5 rounded-xl border border-[#E2D0BA] bg-[#FAF4EB] p-2.5 space-y-1.5">
            <div className="text-xs font-extrabold text-[#4A3525] flex items-center justify-between">
              <span>小人自主打工与消费闭环</span>
              <span className="text-[#E07A5F]">羁绊 {persona.affection}</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <button
                type="button"
                onClick={onTriggerWorkEarn}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#6B9E78] bg-[#E8F3EA] px-3 py-1.5 text-xs font-bold text-[#2F6B40] hover:bg-[#D8EBDD] transition"
              >
                <Briefcase className="h-3.5 w-3.5" />
                去原木双屏桌写代码打工 (+{persona.hourlyWage}币)
              </button>
              <button
                type="button"
                onClick={onTriggerBuyCola}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E07A5F] bg-[#FFF0EB] px-3 py-1.5 text-xs font-bold text-[#B84A2E] hover:bg-[#FDE2D9] transition"
              >
                <Coffee className="h-3.5 w-3.5" />
                花 15 币去售货机买草莓汽水喝
              </button>
              <button
                type="button"
                onClick={onUnlockNewGift}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#D97706] bg-[#FEF3C7] px-3 py-1.5 text-xs font-bold text-[#92400E] hover:bg-[#FDE68A] transition"
              >
                <Gift className="h-3.5 w-3.5" />
                为主人写新《陪伴观察手账》(-25币)
              </button>
            </div>
          </div>

          <div className="col-span-12 sm:col-span-7 rounded-xl border border-[#E2D0BA] bg-[#FAF4EB] p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 border-b border-[#E2D0BA] pb-1.5">
              {gifts.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGift(g)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                    selectedGift?.id === g.id
                      ? 'bg-[#E07A5F] text-white'
                      : 'bg-[#FFFDF9] text-[#7C5D41] hover:bg-[#EFE4D4]'
                  }`}
                >
                  {g.type === 'observation_diary' ? '📔 陪伴手记' : '🎨 像素纪念画'}
                </button>
              ))}
            </div>

            {selectedGift && (
              <div className="mt-1.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#4A3525] flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-[#E07A5F]" />
                    {selectedGift.title}
                  </h4>
                  <span className="text-[10px] text-[#8A725E]">{selectedGift.createdAt}</span>
                </div>
                <p className="text-[11px] text-[#5C4028] whitespace-pre-line bg-[#FFFDF9] rounded-lg p-2 border border-[#E2D0BA] max-h-20 overflow-y-auto leading-relaxed">
                  {selectedGift.diaryContent || selectedGift.subtitle}
                </p>
                {selectedGift.type === 'pixel_wallpaper' && (
                  <button
                    type="button"
                    onClick={() => handleDownloadWallpaper(selectedGift)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#6B9E78] px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-95 transition"
                  >
                    <Download className="h-3 w-3" />
                    保存手绘纪念卡到本地 (.PNG)
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
