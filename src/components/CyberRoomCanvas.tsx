import React, { useEffect, useRef, useState } from 'react';
import {
  PersonaProfile,
  FurnitureItem,
  CameraPerceptionState,
  BrainActionType,
} from '../types/cyber';
import {
  Sparkles,
  Eye,
  Volume2,
  VolumeX,
  Home,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { loadCozyPixelAssets, LoadedPixelAssets } from '../services/pixelSpriteEngine';

interface CyberRoomCanvasProps {
  persona: PersonaProfile;
  furniture: FurnitureItem[];
  cameraState: CameraPerceptionState;
  currentAction: BrainActionType;
  targetCoord: { x: number; y: number };
  emoteBubble: string;
  speechText: string;
  innerThought: string;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onAvatarClick: () => void;
  onMoveFurniture: (id: string, x: number, y: number) => void;
  onResetEmptyRoom: () => void;
  onRestoreDefaultRoom: () => void;
  onMouseParallax: (nx: number, ny: number) => void;
}

export const CyberRoomCanvas: React.FC<CyberRoomCanvasProps> = ({
  persona,
  furniture,
  cameraState,
  currentAction,
  targetCoord,
  emoteBubble,
  speechText,
  innerThought,
  isMusicPlaying,
  onToggleMusic,
  onAvatarClick,
  onMoveFurniture,
  onResetEmptyRoom,
  onRestoreDefaultRoom,
  onMouseParallax,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const assetsRef = useRef<LoadedPixelAssets | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [lightingMode, setLightingMode] = useState<'sunlit' | 'sunset' | 'night'>('sunlit');
  const [draggingName, setDraggingName] = useState<string | null>(null);

  const avatarPosRef = useRef<{ x: number; y: number; facing: 'left' | 'right' }>({
    x: 0.48,
    y: 0.68,
    facing: 'right',
  });
  const draggingIdRef = useRef<string | null>(null);

  const placedItems = furniture.filter((f) => f.placed);

  // 加载高精度 32-Bit 像素房间与自动抠图后的角色/家具精灵表
  useEffect(() => {
    let mounted = true;
    loadCozyPixelAssets().then((loaded) => {
      if (mounted) {
        assetsRef.current = loaded;
        setAssetsReady(loaded.ready);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // 预生成阳光微尘粒子 (Cozy Sunbeam Dust Motes)
    const dustMotes = Array.from({ length: 22 }, (_, i) => ({
      x: ((i * 53) % 100) / 100,
      y: ((i * 31) % 100) / 100,
      size: 1.5 + (i % 3),
      speedY: 0.0003 + (i % 4) * 0.0001,
      phase: i * 0.7,
    }));

    const renderLoop = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;

      // 1. 平滑更新像素分身坐标
      const av = avatarPosRef.current;
      const dx = targetCoord.x - av.x;
      const dy = targetCoord.y - av.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.012) {
        av.x += dx * 0.048;
        av.y += dy * 0.048;
        av.facing = dx >= 0 ? 'right' : 'left';
      }

      // 2. 计算 2.5D 裸眼视差偏移 (Head-Coupled Perspective)
      const breathX = Math.sin(tick * 0.02) * 0.04;
      const breathY = Math.cos(tick * 0.016) * 0.03;
      const px = (cameraState.headX + breathX) * 26;
      const py = (cameraState.headY + breathY) * 16;

      const assets = assetsRef.current;

      // 3. 绘制 32-Bit 精绘阳光木屋底图（带视差缩放余量）
      if (assets && assets.roomBg) {
        const padX = 36;
        const padY = 24;
        ctx.drawImage(
          assets.roomBg,
          -padX - px * 0.75,
          -padY - py * 0.75,
          w + padX * 2,
          h + padY * 2
        );
      } else {
        // 备用暖色木屋背景
        ctx.fillStyle = '#F5E6D3';
        ctx.fillRect(0, 0, w, h);
      }

      // 若用户点击了“空白小屋初始态”（placedItems 为空），在地板中央铺设温和的米色编织地毯区域遮罩以便从零摆放
      if (placedItems.length === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(251, 246, 238, 0.72)';
        ctx.beginPath();
        ctx.roundRect(w * 0.12 - px * 0.5, h * 0.45 - py * 0.5, w * 0.76, h * 0.44, 16);
        ctx.fill();
        ctx.strokeStyle = '#D4B895';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#8C6D53';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ 空白小屋模式：点击下方「像素家具图鉴」或「AI造物工坊」开始布置专属小窝', w * 0.5, h * 0.84);
        ctx.restore();
      }

      // 4. 按 Y 轴深度排序并绘制精绘像素家具精灵 (Furniture Sprites)
      const sortedFurniture = [...placedItems].sort((a, b) => a.y - b.y);

      const drawFurnitureSprite = (item: FurnitureItem) => {
        const depthFactor = (item.y - 0.35) / 0.55;
        const shiftX = -px * (0.72 - depthFactor * 0.45);
        const shiftY = -py * (0.72 - depthFactor * 0.45);
        const fx = item.x * w + shiftX;
        const fy = item.y * h + shiftY;

        ctx.save();
        ctx.translate(fx, fy);

        // 柔和暖棕地面阴影
        ctx.fillStyle = 'rgba(92, 61, 38, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 36, 46, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        const furnSprites = assets?.furnitureSprites;
        let spriteCanvas: HTMLCanvasElement | null = null;
        let drawW = 112;
        let drawH = 112;

        if (item.interactiveTag === 'desk' && furnSprites?.desk) {
          spriteCanvas = furnSprites.desk;
          drawW = 128;
          drawH = 116;
        } else if (item.interactiveTag === 'bed' && furnSprites?.bed) {
          spriteCanvas = furnSprites.bed;
          drawW = 136;
          drawH = 118;
        } else if (item.interactiveTag === 'vending' && furnSprites?.vending) {
          spriteCanvas = furnSprites.vending;
          drawW = 110;
          drawH = 118;
        } else if (item.interactiveTag === 'music' && furnSprites?.music) {
          spriteCanvas = furnSprites.music;
          drawW = 104;
          drawH = 108;
        } else if (item.interactiveTag === 'arcade' && furnSprites?.arcade) {
          spriteCanvas = furnSprites.arcade;
          drawW = 106;
          drawH = 116;
        } else if (item.interactiveTag === 'plant' && furnSprites?.plant) {
          spriteCanvas = furnSprites.plant;
          drawW = 112;
          drawH = 112;
        }

        if (spriteCanvas) {
          // 轻微呼吸动效
          const floatOffset =
            item.interactiveTag === 'music' && isMusicPlaying
              ? Math.sin(tick * 0.18) * 3
              : 0;
          ctx.drawImage(
            spriteCanvas,
            -drawW / 2,
            -drawH / 2 - 8 + floatOffset,
            drawW,
            drawH
          );

          // 八音盒播放时的飘动音符特效
          if (item.interactiveTag === 'music' && isMusicPlaying) {
            const noteY = -52 - ((tick * 0.7) % 24);
            ctx.fillStyle = '#E07A5F';
            ctx.font = 'bold 16px serif';
            ctx.fillText('♪', -14 + Math.sin(tick * 0.12) * 8, noteY);
            ctx.fillStyle = '#D97706';
            ctx.fillText('♫', 12 + Math.cos(tick * 0.12) * 6, noteY - 8);
          }
        } else if (item.isCustomPixel && item.customMatrix && item.customPalette) {
          // AI 造物工坊生成的精致像素礼物带暖木底座展示
          ctx.fillStyle = '#FFFDF9';
          ctx.strokeStyle = '#D97742';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-30, -34, 60, 60, 12);
          ctx.fill();
          ctx.stroke();

          const pSize = 4;
          const offset = (12 * pSize) / 2;
          item.customMatrix.forEach((row, rIdx) => {
            row.forEach((colorIdx, cIdx) => {
              if (colorIdx > 0) {
                ctx.fillStyle = item.customPalette![colorIdx] || '#E07A5F';
                ctx.fillRect(
                  cIdx * pSize - offset,
                  rIdx * pSize - offset - 4,
                  pSize + 0.3,
                  pSize + 0.3
                );
              }
            });
          });
        }

        // 温馨奶油标签牌
        ctx.font = 'bold 11px sans-serif';
        const labelText = item.name.slice(0, 8);
        const lw = ctx.measureText(labelText).width + 16;
        ctx.fillStyle = 'rgba(255, 252, 245, 0.92)';
        ctx.strokeStyle = '#D4B895';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-lw / 2, 34, lw, 18, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#5C4028';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, 0, 47);

        ctx.restore();
      };

      // 先绘制在小人后方的家具
      sortedFurniture.filter((f) => f.y <= av.y).forEach(drawFurnitureSprite);

      // 5. 绘制 32-Bit 精绘像素数字人分身 (Chibi Pixel Character Sprite State Machine)
      const avDepth = (av.y - 0.35) / 0.55;
      const avScreenX = av.x * w - px * (0.68 - avDepth * 0.45);
      const avScreenY = av.y * h - py * (0.68 - avDepth * 0.45);
      const isMoving = dist > 0.014;
      const walkBounceY = isMoving
        ? Math.abs(Math.sin(tick * 0.26)) * -9
        : Math.sin(tick * 0.07) * -2.5;
      const walkTilt = isMoving ? Math.sin(tick * 0.26) * 0.06 : 0;

      ctx.save();
      ctx.translate(avScreenX, avScreenY);

      // 脚下温暖阳光光环
      ctx.fillStyle = 'rgba(224, 122, 95, 0.24)';
      ctx.beginPath();
      ctx.ellipse(0, 42, 34, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E07A5F';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.translate(0, walkBounceY);
      ctx.rotate(walkTilt);

      // 根据当前动作与人设选择最匹配的 32-Bit 精绘角色精灵
      const charSprites = assets?.characterSprites;
      let activeCharSprite = charSprites?.idleWave || null;
      if (currentAction === 'work_code' && charSprites?.workCoding) {
        activeCharSprite = charSprites.workCoding;
      } else if (currentAction === 'sleep' && charSprites?.sleepCloud) {
        activeCharSprite = charSprites.sleepCloud;
      } else if (
        (currentAction === 'drink_cola' || persona.avatarStyle === 'healing_artist') &&
        charSprites?.drinkSoda
      ) {
        activeCharSprite = charSprites.drinkSoda;
      }

      if (activeCharSprite) {
        ctx.save();
        if (av.facing === 'left' && currentAction !== 'work_code' && currentAction !== 'sleep') {
          ctx.scale(-1, 1);
        }
        const spriteW = 132;
        const spriteH = 132;
        ctx.drawImage(activeCharSprite, -spriteW / 2, -spriteH / 2 - 14, spriteW, spriteH);
        ctx.restore();
      }

      ctx.restore();

      // 绘制在小人前方的家具
      sortedFurniture.filter((f) => f.y > av.y).forEach(drawFurnitureSprite);

      // 6. 绘制小人头顶治愈系奶油气泡框
      ctx.save();
      ctx.translate(avScreenX, avScreenY + walkBounceY - 82);

      let statusBadge = emoteBubble || '☀️ 暖心陪伴中';
      if (currentAction === 'work_code') {
        statusBadge = `💻 认真写代码打工 (+${persona.hourlyWage}币/h)`;
      } else if (currentAction === 'drink_cola') {
        statusBadge = '🍓 吨吨吨喝冰镇草莓汽水~';
      } else if (currentAction === 'sleep') {
        statusBadge = '☁️ 云朵垫午睡充电中 Zzz';
      } else if (currentAction === 'interact_ui') {
        statusBadge = '👟 跑去右边踢醒逾期便签！';
      } else if (currentAction === 'look_at_camera') {
        statusBadge = '👀 趴在窗前看主人~';
      } else if (currentAction === 'play_music') {
        statusBadge = '🎵 摇动留声机放治愈音乐';
      }

      ctx.font = 'bold 12px sans-serif';
      const tw = ctx.measureText(statusBadge).width;
      const bw = tw + 24;
      ctx.fillStyle = '#FFFDF9';
      ctx.strokeStyle = '#E07A5F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, -16, bw, 26, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4A3525';
      ctx.textAlign = 'center';
      ctx.fillText(statusBadge, 0, 1);
      ctx.restore();

      // 7. 阳光微尘粒子与昼夜温馨光影滤镜 (Sunbeam Dust & Time-of-Day Filter)
      ctx.save();
      dustMotes.forEach((m) => {
        m.y -= m.speedY;
        if (m.y < 0.08) m.y = 0.88;
        const mx = m.x * w + Math.sin(tick * 0.02 + m.phase) * 14 - px * 0.3;
        const my = m.y * h - py * 0.3;
        const alpha = 0.35 + Math.sin(tick * 0.05 + m.phase) * 0.25;
        ctx.fillStyle =
          lightingMode === 'night'
            ? `rgba(253, 224, 71, ${alpha})`
            : `rgba(255, 247, 214, ${alpha + 0.15})`;
        ctx.beginPath();
        ctx.arc(mx, my, m.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (lightingMode === 'sunset') {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.12)';
        ctx.fillRect(0, 0, w, h);
      } else if (lightingMode === 'night') {
        ctx.fillStyle = 'rgba(30, 27, 75, 0.28)';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    persona,
    placedItems,
    cameraState.headX,
    cameraState.headY,
    currentAction,
    targetCoord,
    emoteBubble,
    isMusicPlaying,
    assetsReady,
    lightingMode,
  ]);

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    const hitFurniture = placedItems.find(
      (f) => Math.hypot(f.x - nx, f.y - ny) < 0.085
    );
    if (hitFurniture) {
      draggingIdRef.current = hitFurniture.id;
      setDraggingName(hitFurniture.name);
      return;
    }

    const av = avatarPosRef.current;
    if (Math.hypot(av.x - nx, av.y - ny) < 0.11) {
      onAvatarClick();
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.42, Math.min(0.84, (e.clientY - rect.top) / rect.height));

    if (draggingIdRef.current) {
      onMoveFurniture(draggingIdRef.current, nx, ny);
      return;
    }

    if (!cameraState.enabled) {
      const parallaxX = (nx - 0.5) * 1.3;
      const parallaxY = (ny - 0.5) * 1.1;
      onMouseParallax(parallaxX, parallaxY);
    }
  };

  const handlePointerUp = () => {
    draggingIdRef.current = null;
    setDraggingName(null);
  };

  return (
    <div className="flex flex-col rounded-2xl border-2 border-[#E2D0BA] bg-[#FFFDF9] shadow-md overflow-hidden">
      {/* 顶部温馨工具条：光影氛围切换 + 空白小屋/样板间 + 留声机开关 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE0D0] bg-[#FAF3E8] px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFFDF9] border border-[#DFCBB2] px-2.5 py-1 text-xs font-bold text-[#6E4F35] shadow-sm">
            <Eye className="h-3.5 w-3.5 text-[#E07A5F]" />
            32-Bit 精绘阳光箱庭 · 可直接拖拽家具或点击小人互动
          </span>
          {draggingName && (
            <span className="rounded-lg bg-[#FDE68A] border border-[#F59E0B]/40 px-2 py-0.5 text-xs font-bold text-[#92400E]">
              正在摆放：{draggingName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 昼夜光影切换器 (Spirit City 风格) */}
          <div className="flex items-center rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] p-0.5">
            <button
              type="button"
              onClick={() => setLightingMode('sunlit')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                lightingMode === 'sunlit'
                  ? 'bg-[#FDE68A]/70 text-[#92400E]'
                  : 'text-[#8A725E] hover:text-[#4A3525]'
              }`}
            >
              <Sun className="h-3 w-3" />
              暖阳
            </button>
            <button
              type="button"
              onClick={() => setLightingMode('sunset')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                lightingMode === 'sunset'
                  ? 'bg-[#FDBA74]/60 text-[#9A3412]'
                  : 'text-[#8A725E] hover:text-[#4A3525]'
              }`}
            >
              <Sunset className="h-3 w-3" />
              晚霞
            </button>
            <button
              type="button"
              onClick={() => setLightingMode('night')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                lightingMode === 'night'
                  ? 'bg-[#C7D2FE]/70 text-[#3730A3]'
                  : 'text-[#8A725E] hover:text-[#4A3525]'
              }`}
            >
              <Moon className="h-3 w-3" />
              夜灯
            </button>
          </div>

          <button
            type="button"
            onClick={onResetEmptyRoom}
            className="flex items-center gap-1 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] px-2.5 py-1 text-xs font-medium text-[#6E4F35] hover:bg-[#F5EBE0] transition"
            title="收起所有可移动家具，从空白地毯开始自由布置"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#E07A5F]" />
            清空家具
          </button>
          <button
            type="button"
            onClick={onRestoreDefaultRoom}
            className="flex items-center gap-1 rounded-xl border border-[#DFCBB2] bg-[#FFFDF9] px-2.5 py-1 text-xs font-medium text-[#6E4F35] hover:bg-[#F5EBE0] transition"
          >
            <Home className="h-3.5 w-3.5 text-[#6B9E78]" />
            温馨样板间
          </button>
          <button
            type="button"
            onClick={onToggleMusic}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-bold transition ${
              isMusicPlaying
                ? 'border-[#6B9E78] bg-[#E8F3EA] text-[#2F6B40]'
                : 'border-[#DFCBB2] bg-[#FFFDF9] text-[#6E4F35] hover:bg-[#F5EBE0]'
            }`}
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className="h-3.5 w-3.5 animate-bounce text-[#6B9E78]" />
                留声机演奏中
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                开启留声机
              </>
            )}
          </button>
        </div>
      </div>

      {/* 核心 32-Bit 精绘像素箱庭 Canvas */}
      <div className="relative bg-[#F5E6D3]">
        <canvas
          ref={canvasRef}
          width={860}
          height={460}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          className="pixel-canvas w-full h-[360px] xl:h-[395px] block cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* 底部：温馨手账风对话栏 + 大模型内部思考链可视化 */}
      <div className="border-t border-[#EDE0D0] bg-[#FAF4EB] px-4 py-2.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[#E07A5F] text-white font-extrabold text-xs shadow-sm">
            <span>Lv.{persona.level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#4A3525]">{persona.name}</span>
              <span className="rounded-full bg-[#EFE5D8] px-2 py-0.5 text-[10px] font-semibold text-[#7C5D41]">
                {persona.title}
              </span>
              <span className="rounded-full bg-[#E8F3EA] px-2 py-0.5 font-mono text-[10px] font-bold text-[#3B7A4B]">
                动作状态: {currentAction}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#3D2E24] mt-1 leading-relaxed">
              “{speechText}”
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8A725E]">
              <Sparkles className="h-3.5 w-3.5 text-[#D97742] shrink-0" />
              <span className="truncate">
                <strong className="text-[#6E4F35]">分身内心OS (Inner Thought)：</strong>
                {innerThought}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
