import React, { useEffect, useRef, useState } from 'react';
import {
  PersonaProfile,
  FurnitureItem,
  CameraPerceptionState,
  BrainActionType,
} from '../types/cyber';
import { Sparkles, Eye, Volume2, VolumeX, Home, RotateCcw } from 'lucide-react';

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
  const avatarPosRef = useRef<{ x: number; y: number; facing: 'left' | 'right' }>({
    x: 0.5,
    y: 0.65,
    facing: 'right',
  });
  const draggingIdRef = useRef<string | null>(null);
  const [draggingName, setDraggingName] = useState<string | null>(null);

  const placedItems = furniture.filter((f) => f.placed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const renderLoop = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. 平滑更新像素小人物理坐标
      const av = avatarPosRef.current;
      const dx = targetCoord.x - av.x;
      const dy = targetCoord.y - av.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.012) {
        av.x += dx * 0.045;
        av.y += dy * 0.045;
        av.facing = dx >= 0 ? 'right' : 'left';
      }

      // 2. 计算 2.5D 裸眼 3D 视差偏移 (Head-Coupled Perspective)
      const idleBreathX = Math.sin(tick * 0.02) * 0.06;
      const idleBreathY = Math.cos(tick * 0.016) * 0.04;
      const px = (cameraState.headX + idleBreathX) * 32;
      const py = (cameraState.headY + idleBreathY) * 20;

      // 3. 绘制深空背景与 2.5D 凹陷玻璃房盒子 (後墙 + 左右侧壁 + 顶棚 + 网格地板)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#070b19');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 后墙矩形（随头部移动产生深度反向偏移，形成凹入屏幕的立体箱庭感）
      const backLeft = w * 0.14 - px * 0.85;
      const backRight = w * 0.86 - px * 0.85;
      const backTop = h * 0.13 - py * 0.85;
      const backBottom = h * 0.62 - py * 0.85;

      // 左墙面
      ctx.fillStyle = '#0d1528';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(backLeft, backTop);
      ctx.lineTo(backLeft, backBottom);
      ctx.lineTo(0, h * 0.92);
      ctx.closePath();
      ctx.fill();

      // 右墙面
      ctx.fillStyle = '#0b1122';
      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(backRight, backTop);
      ctx.lineTo(backRight, backBottom);
      ctx.lineTo(w, h * 0.92);
      ctx.closePath();
      ctx.fill();

      // 天花板
      ctx.fillStyle = '#090e1c';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(backRight, backTop);
      ctx.lineTo(backLeft, backTop);
      ctx.closePath();
      ctx.fill();

      // 地板 (2.5D 透视梯形)
      const floorGrad = ctx.createLinearGradient(0, backBottom, 0, h);
      floorGrad.addColorStop(0, '#111c35');
      floorGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(backLeft, backBottom);
      ctx.lineTo(backRight, backBottom);
      ctx.lineTo(w, h * 0.92);
      ctx.lineTo(0, h * 0.92);
      ctx.closePath();
      ctx.fill();

      // 后墙主体
      const wallGrad = ctx.createLinearGradient(backLeft, backTop, backLeft, backBottom);
      wallGrad.addColorStop(0, '#0f172a');
      wallGrad.addColorStop(1, '#16223be6');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(backLeft, backTop, backRight - backLeft, backBottom - backTop);

      // 绘制 2.5D 透视地板网格线与墙面霓虹边框
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const bx = backLeft + (backRight - backLeft) * t;
        const fx = w * t;
        ctx.beginPath();
        ctx.moveTo(bx, backBottom);
        ctx.lineTo(fx, h * 0.92);
        ctx.stroke();
      }
      for (let j = 1; j <= 4; j++) {
        const tj = j / 5;
        const ly = backBottom + (h * 0.92 - backBottom) * tj;
        const lx = backLeft * (1 - tj);
        const rx = backRight + (w - backRight) * tj;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(rx, ly);
        ctx.stroke();
      }

      // 4. 后墙赛博星空落地景观窗
      const winW = (backRight - backLeft) * 0.36;
      const winH = (backBottom - backTop) * 0.52;
      const winX = (backLeft + backRight) / 2 - winW / 2;
      const winY = backTop + 22;

      ctx.fillStyle = '#050814';
      ctx.fillRect(winX, winY, winW, winH);
      ctx.strokeStyle = persona.accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(winX, winY, winW, winH);

      // 窗内视差星空与赛博月亮
      const starShiftX = -px * 1.35;
      const starShiftY = -py * 1.35;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(winX + winW * 0.72 + starShiftX * 0.3, winY + winH * 0.32 + starShiftY * 0.3, 10, 0, Math.PI * 2);
      ctx.fill();

      for (let s = 0; s < 14; s++) {
        const sx = winX + ((s * 37 + 19) % Math.floor(winW - 12)) + 6;
        const sy = winY + ((s * 23 + 11) % Math.floor(winH - 12)) + 6;
        const blink = (Math.sin(tick * 0.06 + s) + 1) * 0.5;
        ctx.fillStyle = `rgba(186, 230, 253, ${0.3 + blink * 0.7})`;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // 房间内框发光棱线
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(backLeft, backTop, backRight - backLeft, backBottom - backTop);

      // 5. 绘制房间内的像素家具（按 Y 深度排序，保证遮挡关系真实）
      const sortedFurniture = [...placedItems].sort((a, b) => a.y - b.y);

      const drawFurnitureItem = (item: FurnitureItem) => {
        const depthFactor = (item.y - 0.35) / 0.55; // 0 (远) ~ 1 (近)
        const layerShiftX = -px * (0.75 - depthFactor * 0.55);
        const layerShiftY = -py * (0.75 - depthFactor * 0.55);
        const fx = item.x * w + layerShiftX;
        const fy = item.y * h + layerShiftY;

        ctx.save();
        ctx.translate(fx, fy);

        // 地面投影
        ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 34, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (item.interactiveTag === 'desk') {
          // 双屏极客工作台 (像素风)
          ctx.fillStyle = '#334155';
          ctx.fillRect(-36, 0, 72, 10);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-30, 10, 8, 16);
          ctx.fillRect(22, 10, 8, 16);
          // 双显示器
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-30, -24, 28, 20);
          ctx.fillRect(2, -24, 28, 20);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(-28, -22, 24, 16);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(4, -22, 24, 16);
          // 屏幕代码闪烁条
          ctx.fillStyle = '#f8fafc';
          const codeOffset = Math.floor(tick / 8) % 3;
          ctx.fillRect(-25, -19 + codeOffset * 4, 14, 2);
          ctx.fillRect(7, -17 + codeOffset * 3, 16, 2);
        } else if (item.interactiveTag === 'bed') {
          // 云朵像素睡眠舱
          ctx.fillStyle = '#475569';
          ctx.fillRect(-38, -6, 76, 24);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(-34, -2, 68, 18);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-30, -10, 22, 10); // 枕头
        } else if (item.interactiveTag === 'vending') {
          // 霓虹快乐水售货机
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(-24, -44, 48, 64);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-18, -38, 36, 34);
          // 像素可乐罐阵列
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-14, -32, 6, 10);
          ctx.fillStyle = '#fb7185';
          ctx.fillRect(-3, -32, 6, 10);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(8, -32, 6, 10);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(-14, -18, 6, 10);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(-3, -18, 6, 10);
        } else if (item.interactiveTag === 'music') {
          // 治愈八音盒留声机
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-20, -24, 40, 40);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, -12, 12, 0, Math.PI * 2);
          ctx.fill();
          if (isMusicPlaying) {
            const noteY = -34 - ((tick * 0.6) % 18);
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('♪', -10 + Math.sin(tick * 0.1) * 8, noteY);
            ctx.fillStyle = '#f472b6';
            ctx.fillText('♫', 8 + Math.cos(tick * 0.1) * 6, noteY - 6);
          }
        } else if (item.interactiveTag === 'arcade') {
          // 复古红白机街机台
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(-22, -42, 44, 62);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(-16, -32, 32, 22);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-10, -4, 6, 4);
          ctx.fillRect(4, -4, 6, 4);
        } else if (item.interactiveTag === 'plant') {
          // 呼吸感光像素绿植
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-14, 2, 28, 18);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-18, -18, 36, 20);
          ctx.fillStyle = '#34d399';
          ctx.fillRect(-10, -28, 20, 12);
        } else if (item.isCustomPixel && item.customMatrix && item.customPalette) {
          // AI 像素工坊生成的 12x12 专属像素物品
          const pSize = 3.5;
          const offset = (12 * pSize) / 2;
          item.customMatrix.forEach((row, rIdx) => {
            row.forEach((colorIdx, cIdx) => {
              if (colorIdx > 0) {
                ctx.fillStyle = item.customPalette![colorIdx] || '#38bdf8';
                ctx.fillRect(
                  cIdx * pSize - offset,
                  rIdx * pSize - offset - 6,
                  pSize + 0.4,
                  pSize + 0.4
                );
              }
            });
          });
        }

        // 家具悬浮标签
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fillRect(-38, 24, 76, 15);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.name.slice(0, 7), 0, 35);

        ctx.restore();
      };

      // 先画在小人后方的家具
      sortedFurniture.filter((f) => f.y <= av.y).forEach(drawFurnitureItem);

      // 6. 绘制程序化像素赛博数字人分身 (Avatar Sprite State Machine)
      const avDepth = (av.y - 0.35) / 0.55;
      const avScreenX = av.x * w - px * (0.7 - avDepth * 0.55);
      const avScreenY = av.y * h - py * (0.7 - avDepth * 0.55);
      const isMoving = dist > 0.015;
      const bounceY = isMoving
        ? Math.abs(Math.sin(tick * 0.28)) * -7
        : currentAction === 'dance'
        ? Math.abs(Math.sin(tick * 0.35)) * -9
        : Math.sin(tick * 0.08) * -2;

      ctx.save();
      ctx.translate(avScreenX, avScreenY);

      // 小人脚下全息光环
      ctx.strokeStyle = persona.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 26, 22, 7, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.translate(0, bounceY);
      if (av.facing === 'left') {
        ctx.scale(-1, 1);
      }

      // 像素级身体绘制 (4px 网格单元)
      const u = 4;
      // 头发后层
      ctx.fillStyle = persona.hairColor;
      ctx.fillRect(-5 * u, -12 * u, 10 * u, 6 * u);
      // 脸部皮肤
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-4 * u, -9 * u, 8 * u, 5 * u);
      // 刘海与赛博耳机
      ctx.fillStyle = persona.hairColor;
      ctx.fillRect(-4 * u, -11 * u, 8 * u, 2.5 * u);
      ctx.fillStyle = persona.accentColor;
      ctx.fillRect(-5.5 * u, -9 * u, 1.5 * u, 4 * u);
      ctx.fillRect(4 * u, -9 * u, 1.5 * u, 4 * u);

      // 眼睛（支持眨眼、睡觉闭眼、开心弯眼）
      const isBlinking = tick % 110 < 6 || currentAction === 'sleep';
      ctx.fillStyle = '#0f172a';
      if (isBlinking) {
        ctx.fillRect(-2.5 * u, -6.5 * u, 1.8 * u, 0.6 * u);
        ctx.fillRect(1.2 * u, -6.5 * u, 1.8 * u, 0.6 * u);
      } else {
        ctx.fillRect(-2.5 * u, -7.2 * u, 1.5 * u, 1.8 * u);
        ctx.fillRect(1.2 * u, -7.2 * u, 1.5 * u, 1.8 * u);
        // 眼神高光
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2.2 * u, -7.0 * u, 0.6 * u, 0.6 * u);
        ctx.fillRect(1.5 * u, -7.0 * u, 0.6 * u, 0.6 * u);
      }

      // 身体穿搭
      ctx.fillStyle = persona.outfitColor;
      ctx.fillRect(-3.5 * u, -4 * u, 7 * u, 6 * u);
      ctx.fillStyle = persona.accentColor;
      ctx.fillRect(-1.5 * u, -3 * u, 3 * u, 4 * u);

      // 手臂动作（敲代码 / 喝可乐 / 挥手）
      const armSwing = isMoving || currentAction === 'work_code' ? Math.sin(tick * 0.4) * 4 : 0;
      ctx.fillStyle = persona.outfitColor;
      ctx.fillRect(-5 * u, -3.5 * u + armSwing * 0.3, 1.5 * u, 4.5 * u);
      ctx.fillRect(3.5 * u, -3.5 * u - armSwing * 0.3, 1.5 * u, 4.5 * u);

      if (currentAction === 'drink_cola') {
        // 手持像素可乐罐
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4 * u, -5 * u, 2 * u, 3 * u);
      }

      // 迈腿走路帧
      const legStride = isMoving ? Math.sin(tick * 0.35) * 5 : 0;
      ctx.fillStyle = '#334155';
      ctx.fillRect(-2.8 * u, 2 * u + legStride * 0.4, 2 * u, 3.5 * u);
      ctx.fillRect(0.8 * u, 2 * u - legStride * 0.4, 2 * u, 3.5 * u);

      ctx.restore();

      // 绘制在小人前方的家具
      sortedFurniture.filter((f) => f.y > av.y).forEach(drawFurnitureItem);

      // 7. 绘制小人头顶状态气泡与打工金币飘字
      ctx.save();
      ctx.translate(avScreenX, avScreenY + bounceY - 58);

      let statusBadge = emoteBubble || '✨ 陪伴中';
      if (currentAction === 'work_code') {
        statusBadge = `💻 赛博打工中 (+${persona.hourlyWage}币/h)`;
      } else if (currentAction === 'drink_cola') {
        statusBadge = '🥤 吨吨吨喝冰可乐~';
      } else if (currentAction === 'sleep') {
        statusBadge = '💤 Zzz 睡眠舱充电中...';
      } else if (currentAction === 'interact_ui') {
        statusBadge = '⚡ 飞踢右侧逾期日程卡！';
      } else if (currentAction === 'look_at_camera') {
        statusBadge = '👀 贴在玻璃窗看主人';
      } else if (currentAction === 'play_music') {
        statusBadge = '🎵 播放治愈八音盒';
      }

      ctx.font = 'bold 11px sans-serif';
      const textWidth = ctx.measureText(statusBadge).width;
      const boxW = textWidth + 18;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = persona.accentColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -14, boxW, 22, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(statusBadge, 0, 1);
      ctx.restore();

      // 8. 前置玻璃窗边框高光（营造“被关在透明立体玻璃盒子”的质感）
      const glassGrad = ctx.createLinearGradient(0, 0, w, h);
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      glassGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.01)');
      glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(0, 0, w, h);

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
  ]);

  // 支持鼠标在画布上移动产生 2.5D 裸眼视差，以及拖拽家具摆放
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    // 检查是否点中了某个家具（支持自由拖拽摆放）
    const hitFurniture = placedItems.find(
      (f) => Math.hypot(f.x - nx, f.y - ny) < 0.075
    );
    if (hitFurniture) {
      draggingIdRef.current = hitFurniture.id;
      setDraggingName(hitFurniture.name);
      return;
    }

    // 检查是否点击了赛博小人本体
    const av = avatarPosRef.current;
    if (Math.hypot(av.x - nx, av.y - ny) < 0.09) {
      onAvatarClick();
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.38, Math.min(0.84, (e.clientY - rect.top) / rect.height));

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
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl">
      {/* 顶部悬浮 HUD：房间模式切换 + 八音盒开关 */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/85 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            2.5D 视差玻璃箱庭 · 拖拽家具可自由摆位
          </span>
          {draggingName && (
            <span className="rounded-lg bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 text-xs text-amber-300">
              正在移动：{draggingName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={onResetEmptyRoom}
            className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/85 px-2.5 py-1 text-xs text-slate-300 hover:border-rose-400/50 hover:text-rose-300 transition backdrop-blur-md"
            title="清空所有家具，体验从一片空白开始布置家园"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            空白小屋初始态
          </button>
          <button
            type="button"
            onClick={onRestoreDefaultRoom}
            className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/85 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300 transition backdrop-blur-md"
          >
            <Home className="h-3.5 w-3.5" />
            一键布置样板间
          </button>
          <button
            type="button"
            onClick={onToggleMusic}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium transition backdrop-blur-md ${
              isMusicPlaying
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700/80 bg-slate-900/85 text-slate-300 hover:text-white'
            }`}
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className="h-3.5 w-3.5 animate-bounce" />
                八音盒演奏中
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                八音盒静音
              </>
            )}
          </button>
        </div>
      </div>

      {/* 核心 2.5D 像素箱庭 Canvas */}
      <canvas
        ref={canvasRef}
        width={760}
        height={420}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        className="w-full h-[390px] sm:h-[420px] block cursor-grab active:cursor-grabbing"
      />

      {/* 底部：赛博分身实时语音气泡 + 大模型内部思考链可视化 (Inner Monologue) */}
      <div className="border-t border-slate-800/90 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold text-slate-950 shadow-md"
            style={{
              backgroundColor: persona.accentColor,
              borderColor: persona.hairColor,
            }}
          >
            Lv.{persona.level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{persona.name}</span>
              <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/25">
                动作指令: {currentAction}
              </span>
            </div>
            <p className="text-sm text-slate-100 mt-1 leading-relaxed">{speechText}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="truncate">
                <strong className="text-purple-300">大脑思维链 (Inner Thought)：</strong>
                {innerThought}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
