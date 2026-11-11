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

                  const isSkinTone = r > 75 && g > 40 && b > 25 && r > g && r > b;
                  const w = isSkinTone ? luma * 2.2 : luma * 0.25;
                  sumX += x * w;
                  sumY += y * w;
                  weightTotal += w;
                }
              }

              const avgLuma = Math.round(totalLuma / ((64 * 48) / 4));
              if (weightTotal > 0) {
                const cx = sumX / weightTotal / 64;
                const cy = sumY / weightTotal / 48;
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
        setStreamError('未开启摄像头权限，已平滑启用「鼠标/姿态 2.5D 视差感应」');
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
    <div className="rounded-2xl border-2 border-[#E2D0BA] bg-[#FFFDF9] px-3.5 py-2 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 左侧：前置摄像头落地窗与视差参数 */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-12 overflow-hidden rounded-xl border border-[#D4B895] bg-[#F5EBE0] flex items-center justify-center shrink-0">
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
              <div className="flex flex-col items-center justify-center text-[#B07D54]">
                <Move3d className="h-3.5 w-3.5" />
                <span className="text-[8px] font-bold">2.5D视差</span>
              </div>
            )}
            <span className="absolute bottom-0.5 right-1 h-1.5 w-1.5 rounded-full bg-[#6B9E78]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#4A3525] flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-[#E07A5F]" />
                前置摄像头“阳光落地窗” & 裸眼 3D 视差传感器
              </span>
              <span className="rounded-lg bg-[#F5EBE0] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#7C5D41] border border-[#E2D0BA]">
                X:{cameraState.headX.toFixed(2)} Y:{cameraState.headY.toFixed(2)}
              </span>
              {cameraState.lastVisionSummary && (
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-[#8A725E]">
                  <Sparkles className="h-3 w-3 text-[#E07A5F]" />
                  {cameraState.lastVisionSummary.slice(0, 32)}...
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8A725E]">
              {streamError
                ? streamError
                : cameraState.enabled
                ? `实景面部追踪开启 | 环境亮度 ${cameraState.brightness} | 小人正透过阳光木窗注视着你`
                : '将鼠标在阳光木屋内轻轻移动或开启摄像头，即可感受“立体微缩娃娃屋”视差透视'}
            </p>
          </div>
        </div>

        {/* 右侧：主人状态感知模拟与摄像头开关 */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-xl border border-[#E2D0BA] bg-[#FAF3E8] p-1">
            <span className="px-1.5 text-[11px] font-medium text-[#7C5D41] hidden sm:inline">
              感知主人状态:
            </span>
            <button
              type="button"
              onClick={() =>
                simulateExpression(
                  'smiling',
                  '温暖微笑 😊',
                  '落地窗捕捉到主人露出了温暖的微笑，小人开心得挥手回应'
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                cameraState.userExpression === 'smiling'
                  ? 'bg-[#E8F3EA] text-[#2F6B40] border border-[#6B9E78]/40 shadow-sm'
                  : 'text-[#6E4F35] hover:bg-[#EFE4D4]'
              }`}
            >
              <Smile className="h-3.5 w-3.5 text-[#6B9E78]" />
              微笑贴贴
            </button>
            <button
              type="button"
              onClick={() =>
                simulateExpression(
                  'focused',
                  '专注伴学 💻',
                  '检测到主人正在全神贯注工作学习，小人也乖乖开启伴学模式'
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                cameraState.userExpression === 'focused'
                  ? 'bg-[#FDE68A]/70 text-[#92400E] border border-[#F59E0B]/40 shadow-sm'
                  : 'text-[#6E4F35] hover:bg-[#EFE4D4]'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-[#D97706]" />
              专注伴学
            </button>
            <button
              type="button"
              onClick={() =>
                simulateExpression(
                  'tired',
                  '疲惫揉眼 🥱',
                  '捕捉到主人揉眼叹气，小人主动走去摇动复古留声机播放治愈旋律'
                )
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                cameraState.userExpression === 'tired'
                  ? 'bg-[#FCE7F3] text-[#9D174D] border border-[#F472B6]/40 shadow-sm'
                  : 'text-[#6E4F35] hover:bg-[#EFE4D4]'
              }`}
            >
              <Coffee className="h-3.5 w-3.5 text-[#E07A5F]" />
              疲惫安慰
            </button>
          </div>

          <button
            type="button"
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
              cameraState.enabled
                ? 'border-[#E07A5F] bg-[#FDE8E1] text-[#B84A2E]'
                : 'border-[#D4B895] bg-[#F5EBE0] text-[#5C4028] hover:bg-[#EADBC8]'
            }`}
          >
            {cameraState.enabled ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                关闭实景追踪
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-[#E07A5F]" />
                开启摄像头视差
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
