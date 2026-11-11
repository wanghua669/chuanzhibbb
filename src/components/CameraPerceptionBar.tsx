import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Eye, Smile, Coffee, Zap, Move3d, Sparkles } from 'lucide-react';
import { CameraPerceptionState } from '../types/cyber';

interface CameraPerceptionBarProps {
  cameraState: CameraPerceptionState;
  onUpdateCameraState: React.Dispatch<React.SetStateAction<CameraPerceptionState>>;
  onTriggerCameraEvent: (reason: string) => void;
}

export const CameraPerceptionBar: React.FC<CameraPerceptionBarProps> = ({
  cameraState,
  onUpdateCameraState,
  onTriggerCameraEvent,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let mediaStream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        setStreamError(null);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 160, height: 120, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
        onUpdateCameraState((prev) => ({ ...prev, hasPermission: true }));

        // 轻量纯 CPU 帧特征质心追踪（计算人脸位置偏移 X,Y,Z 与环境亮度）
        const trackFrame = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, 64, 48);
              const img = ctx.getImageData(0, 0, 64, 48).data;
              let sumX = 0;
              let sumY = 0;
              let weightTotal = 0;
              let totalLuma = 0;

              for (let y = 0; y < 48; y += 2) {
                for (let x = 0; x < 64; x += 2) {
                  const i = (y * 64 + x) * 4;
                  const r = img[i];
                  const g = img[i + 1];
                  const b = img[i + 2];
                  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                  totalLuma += luma;

                  // 肤色与高亮特征区域权重计算
                  const isSkinTone = r > 75 && g > 40 && b > 25 && r > g && r > b;
                  const w = isSkinTone ? luma * 2.2 : luma * 0.25;
                  sumX += x * w;
                  sumY += y * w;
                  weightTotal += w;
                }
              }

              const avgLuma = Math.round(totalLuma / ((64 * 48) / 4));
              if (weightTotal > 0) {
                const cx = sumX / weightTotal / 64; // 0 ~ 1
                const cy = sumY / weightTotal / 48; // 0 ~ 1
                // 镜像翻转 X 使得头往左偏时视角自然联动
                const normX = Math.max(-1, Math.min(1, (0.5 - cx) * 2.8));
                const normY = Math.max(-1, Math.min(1, (cy - 0.5) * 2.4));

                onUpdateCameraState((prev) => ({
                  ...prev,
                  headX: prev.headX * 0.8 + normX * 0.2,
                  headY: prev.headY * 0.8 + normY * 0.2,
                  brightness: avgLuma,
                }));
              }
            }
          }
          animId = requestAnimationFrame(trackFrame);
        };
        animId = requestAnimationFrame(trackFrame);
      } catch {
        setStreamError('未检测到摄像头或权限未开启，已平滑启用「鼠标/姿态仿真3D视差」');
        onUpdateCameraState((prev) => ({
          ...prev,
          enabled: false,
          hasPermission: false,
        }));
      }
    };

    if (cameraState.enabled) {
      startWebcam();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraState.enabled, onUpdateCameraState]);

  const toggleCamera = () => {
    onUpdateCameraState((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const simulateExpression = (
    exp: CameraPerceptionState['userExpression'],
    label: string,
    summary: string
  ) => {
    onUpdateCameraState((prev) => ({
      ...prev,
      userExpression: exp,
      expressionLabel: label,
      lastVisionSummary: summary,
    }));
    onTriggerCameraEvent(summary);
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 px-4 py-2.5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 左侧：摄像头落地窗开关与裸眼3D视差状态 */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-cyan-500/40 bg-slate-950 flex items-center justify-center shrink-0">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full object-cover scale-x-[-1] ${
                cameraState.enabled ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            />
            <canvas ref={canvasRef} width={64} height={48} className="hidden" />
            {!cameraState.enabled && (
              <div className="flex flex-col items-center justify-center text-cyan-400/80">
                <Move3d className="h-4 w-4 animate-pulse" />
                <span className="text-[9px] font-mono">2.5D视差</span>
              </div>
            )}
            <span className="absolute bottom-0.5 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                前置摄像头“落地窗” & 裸眼 3D 视差引擎
              </span>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-300 border border-slate-700">
                视角偏移 X:{cameraState.headX.toFixed(2)} Y:{cameraState.headY.toFixed(2)} Z:{cameraState.headZ.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {streamError
                ? streamError
                : cameraState.enabled
                ? `实时面部追踪运行中 | 环境亮度 ${cameraState.brightness} | 小人正透过屏幕观察您的状态`
                : '将鼠标在房间内移动或开启摄像头，即可体验“凹进屏幕里的 2.5D 立体玻璃盒”视差透视'}
            </p>
          </div>
        </div>

        {/* 右侧：摄像头开关 + 情绪感知触发器（方便无摄像头或演示时一键模拟表情互动） */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            <span className="px-2 text-[11px] text-slate-400 hidden sm:inline">
              感知主人状态:
            </span>
            <button
              type="button"
              onClick={() =>
                simulateExpression(
                  'smiling',
                  '微笑注视 😊',
                  '摄像头捕捉到主人对着屏幕露出了温暖的微笑，还往前凑近了屏幕'
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
                cameraState.userExpression === 'smiling'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="模拟摄像头检测到主人微笑注视"
            >
              <Smile className="h-3.5 w-3.5 text-emerald-400" />
              微笑贴贴
            </button>
            <button
              type="button"
              onClick={() =>
                simulateExpression(
                  'focused',
                  '深度专注 💻',
                  '摄像头检测到主人正戴着耳机全神贯注盯着屏幕写代码'
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
                cameraState.userExpression === 'focused'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="模拟摄像头检测到主人深度专注"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              专注工作
            </button>
            <button
              type="button"
              onClick={() =>
                simulateExpression(
                  'tired',
                  '疲惫揉眼 🥱',
                  '摄像头捕捉到主人揉了揉眼睛并叹气，环境有些暗，需要休息和音乐陪伴'
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
                cameraState.userExpression === 'tired'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="模拟摄像头检测到主人疲惫（触发小人走来安慰并开八音盒）"
            >
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              疲惫揉眼
            </button>
          </div>

          <button
            type="button"
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
              cameraState.enabled
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
            }`}
          >
            {cameraState.enabled ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                关闭摄像头
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                开启实景头部追踪
              </>
            )}
          </button>
        </div>
      </div>

      {/* 视觉环境理解摘要条 */}
      {cameraState.lastVisionSummary && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 px-3 py-1 text-[11px] text-cyan-200">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong>视觉感知落地窗反馈：</strong>
            {cameraState.lastVisionSummary}
          </span>
        </div>
      )}
    </div>
  );
};
