import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Database,
  Key,
  Send,
  Heart,
  Coins,
  Cpu,
  Activity,
  Briefcase,
  Coffee,
  Footprints,
  Eye,
} from 'lucide-react';
import {
  PersonaProfile,
  FurnitureItem,
  CyberGiftItem,
  CameraPerceptionState,
  BrainActionType,
  BrainActionCommand,
  LLMConfig,
} from './types/cyber';
import {
  PRESET_PERSONAS,
  INITIAL_FURNITURE_CATALOG,
  INITIAL_CYBER_GIFTS,
} from './services/personaForge';
import {
  loadLLMConfig,
  saveLLMConfig,
  isCloudApiKeyConfigured,
  decideNextActionWithBrain,
} from './services/llmBrain';
import { soundEngine } from './services/soundEngine';
import { CameraPerceptionBar } from './components/CameraPerceptionBar';
import { CyberRoomCanvas } from './components/CyberRoomCanvas';
import { HomeWorkshopPanel } from './components/HomeWorkshopPanel';
import { ScheduleAndMemoryPanel } from './components/ScheduleAndMemoryPanel';
import { PersonaForgeModal } from './components/PersonaForgeModal';
import { ApiConfigModal } from './components/ApiConfigModal';

export const App: React.FC = () => {
  // 1. 成长型赛博分身状态 & 本地持久化
  const [persona, setPersona] = useState<PersonaProfile>(() => {
    try {
      const saved = localStorage.getItem('cybertwin_persona_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_PERSONAS[0];
  });

  // 2. 2.5D 箱庭房间家具列表
  const [furniture, setFurniture] = useState<FurnitureItem[]>(() => {
    try {
      const saved = localStorage.getItem('cybertwin_furniture_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FURNITURE_CATALOG;
  });

  // 3. 小人回馈主人的礼物匣
  const [gifts, setGifts] = useState<CyberGiftItem[]>(INITIAL_CYBER_GIFTS);

  // 4. 大模型 API 配置（预留接口 + 双模切换）
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => loadLLMConfig());

  // 5. 前置摄像头落地窗 & 2.5D 裸眼视差坐标
  const [cameraState, setCameraState] = useState<CameraPerceptionState>({
    enabled: false,
    hasPermission: false,
    headX: 0,
    headY: 0,
    headZ: 1.0,
    userExpression: 'focused',
    expressionLabel: '专注陪伴中 💻',
    brightness: 128,
    lastVisionSummary: '主人正在屏幕前专注探索 CyberTwin Box 赛博伴生箱庭系统',
  });

  // 6. 赛博分身“身体执行层”状态机
  const [currentAction, setCurrentAction] = useState<BrainActionType>('sit');
  const [targetCoord, setTargetCoord] = useState<{ x: number; y: number }>({ x: 0.28, y: 0.56 });
  const [emoteBubble, setEmoteBubble] = useState<string>('✨ 逻辑闭环了~');
  const [speechText, setSpeechText] = useState<string>(
    '你好呀主人！我是基于你的个人语料与笔记生长出来的赛博分身「星野零」。试着晃动鼠标或开启摄像头看看我们的 2.5D 玻璃房视差吧！'
  );
  const [innerThought, setInnerThought] = useState<string>(
    '已完成初始个人语料加载与六维人格建档，等待主人指令或进入 Heartbeat 自主打工循环。'
  );
  const [brainSource, setBrainSource] = useState<'cloud_llm' | 'heuristic_engine'>('heuristic_engine');
  const [isThinking, setIsThinking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [kickingTaskId, setKickingTaskId] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // 弹窗开关
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const actionQueueTimerRef = useRef<number | null>(null);

  // 自动保存分身与房间状态
  useEffect(() => {
    try {
      localStorage.setItem('cybertwin_persona_v1', JSON.stringify(persona));
    } catch {}
  }, [persona]);

  useEffect(() => {
    try {
      localStorage.setItem('cybertwin_furniture_v1', JSON.stringify(furniture));
    } catch {}
  }, [furniture]);

  // 根据语义目标名解算房间 2.5D 归一化坐标
  const resolveTargetCoordinates = useCallback(
    (targetName?: string): { x: number; y: number } => {
      const placed = furniture.filter((f) => f.placed);
      if (targetName === 'desk') {
        const desk = placed.find((f) => f.interactiveTag === 'desk');
        if (desk) return { x: desk.x, y: desk.y + 0.05 };
      }
      if (targetName === 'bed') {
        const bed = placed.find((f) => f.interactiveTag === 'bed');
        if (bed) return { x: bed.x, y: bed.y + 0.03 };
      }
      if (targetName === 'vending' || targetName === 'vending_machine') {
        const vend = placed.find((f) => f.interactiveTag === 'vending');
        if (vend) return { x: vend.x, y: vend.y + 0.08 };
      }
      if (targetName === 'music') {
        const mus = placed.find((f) => f.interactiveTag === 'music');
        if (mus) return { x: mus.x + 0.04, y: mus.y };
      }
      if (targetName === 'arcade') {
        const arc = placed.find((f) => f.interactiveTag === 'arcade');
        if (arc) return { x: arc.x - 0.04, y: arc.y };
      }
      if (targetName === 'window_camera') {
        // 走到屏幕正前方落地窗贴贴
        return { x: 0.5, y: 0.78 };
      }
      if (targetName === 'ui_schedule') {
        // 走到房间最右侧边缘，跨界去踢右侧的日程 UI 面板
        return { x: 0.9, y: 0.62 };
      }
      return { x: 0.48, y: 0.64 };
    },
    [furniture]
  );

  // 执行跨界踢翻/震动右侧逾期日程卡片（只做前端 DOM 物理反馈，不破坏后端数据）
  const triggerCrossUiScheduleKick = useCallback(() => {
    soundEngine.playKickSound();
    setPersona((prev) => {
      const overdue = prev.corpus.schedule.find((s) => s.status === 'overdue') || prev.corpus.schedule[0];
      if (!overdue) return prev;
      setKickingTaskId(overdue.id);
      setTimeout(() => setKickingTaskId(null), 900);

      return {
        ...prev,
        corpus: {
          ...prev.corpus,
          schedule: prev.corpus.schedule.map((s) =>
            s.id === overdue.id ? { ...s, kickedCount: (s.kickedCount || 0) + 1 } : s
          ),
        },
      };
    });
  }, []);

  // 串行执行大模型返回的 JSON 动作指令序列 (Brain-Body Action Dispatcher)
  const executeActionSequence = useCallback(
    (actions: BrainActionCommand[]) => {
      if (actionQueueTimerRef.current) {
        clearTimeout(actionQueueTimerRef.current);
      }

      const emojiMap: Record<string, string> = {
        heart: '❤️ 好感度UP!',
        bulb: '💡 灵感触发!',
        coding: '💻 全速写代码中',
        cola: '🥤 冰镇像素可乐!',
        music: '🎵 治愈旋律~',
        shock: '⚡ 发现目标!',
        zzz: '💤 呼呼充电~',
      };

      actions.forEach((act, idx) => {
        window.setTimeout(() => {
          if (act.type === 'emote' && act.value) {
            setEmoteBubble(emojiMap[act.value] || `✨ ${act.value}`);
          } else if (act.type === 'walk_to') {
            setCurrentAction('walk_to');
            const coord =
              act.targetX && act.targetY
                ? { x: act.targetX, y: act.targetY }
                : resolveTargetCoordinates(act.target);
            setTargetCoord(coord);
          } else if (act.type === 'work_code') {
            setCurrentAction('work_code');
            soundEngine.playCoinSound();
            setPersona((prev) => {
              const nextExp = prev.exp + 15;
              const levelUp = nextExp >= 100;
              return {
                ...prev,
                cyberCoins: prev.cyberCoins + prev.hourlyWage,
                affection: prev.affection + 5,
                level: levelUp ? Math.min(5, prev.level + 1) : prev.level,
                exp: levelUp ? nextExp - 100 : nextExp,
              };
            });
          } else if (act.type === 'drink_cola') {
            setCurrentAction('drink_cola');
            soundEngine.playCoinSound();
            setPersona((prev) => ({
              ...prev,
              cyberCoins: Math.max(0, prev.cyberCoins - 15),
              energy: Math.min(100, prev.energy + 18),
              affection: prev.affection + 8,
            }));
          } else if (act.type === 'interact_ui') {
            setCurrentAction('interact_ui');
            triggerCrossUiScheduleKick();
          } else if (act.type === 'play_music') {
            setCurrentAction('play_music');
            const playing = soundEngine.toggleLofiMusicBox(true);
            setIsMusicPlaying(playing);
          } else {
            setCurrentAction(act.type);
          }
        }, idx * 950);
      });
    },
    [resolveTargetCoordinates, triggerCrossUiScheduleKick]
  );

  // 触发赛博大脑思考（支持用户对话、Heartbeat 自主心跳、摄像头表情事件、空投礼物事件）
  const triggerBrainCycle = useCallback(
    async (
      promptText: string,
      triggerType: 'user_chat' | 'heartbeat' | 'camera_event' | 'gift_drop'
    ) => {
      setIsThinking(true);
      const placed = furniture.filter((f) => f.placed);
      const decision = await decideNextActionWithBrain(
        promptText,
        triggerType,
        persona,
        placed,
        cameraState,
        llmConfig
      );
      setIsThinking(false);

      setSpeechText(decision.speech);
      setInnerThought(decision.inner_thought);
      setBrainSource(decision.source);

      if (decision.new_memory) {
        setPersona((prev) => ({
          ...prev,
          mood: decision.mood || prev.mood,
          memories: [
            {
              id: `mem-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              category: 'interaction',
              content: decision.new_memory!,
              importance: 8,
              emotionTag: 'happy',
            },
            ...prev.memories,
          ].slice(0, 20),
        }));
      }

      executeActionSequence(decision.actions);
    },
    [furniture, persona, cameraState, llmConfig, executeActionSequence]
  );

  // Heartbeat 自主意识心跳定时器（无需用户下指令，小人自己也会自由走动、打工、买可乐、巡逻日程）
  useEffect(() => {
    if (!llmConfig.enableAutoHeartbeat) return;
    const intervalMs = Math.max(12, llmConfig.heartbeatIntervalSec) * 1000;
    const timer = window.setInterval(() => {
      triggerBrainCycle('自主心跳触发：观察房间家具、金库余额与主人状态，自主决定下一步行动', 'heartbeat');
    }, intervalMs);
    return () => clearInterval(timer);
  }, [llmConfig.enableAutoHeartbeat, llmConfig.heartbeatIntervalSec, triggerBrainCycle]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    triggerBrainCycle(msg, 'user_chat');
  };

  // 家具摆放与拖拽回调
  const handleToggleFurniture = (id: string) => {
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, placed: !f.placed } : f))
    );
    soundEngine.playGiftDropSound();
  };

  const handleMoveFurniture = (id: string, x: number, y: number) => {
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x, y } : f))
    );
  };

  const handleCreateCustomPixelItem = (newItem: FurnitureItem) => {
    soundEngine.playGiftDropSound();
    setFurniture((prev) => [newItem, ...prev]);
    setPersona((prev) => ({
      ...prev,
      affection: prev.affection + newItem.affectionBonus,
      exp: Math.min(99, prev.exp + 20),
    }));
    triggerBrainCycle(`主人用 AI 像素工坊为我生成了专属礼物「${newItem.name}」并投放到了房间地板上！`, 'gift_drop');
  };

  const handleUnlockNewGift = () => {
    soundEngine.playGiftDropSound();
    const newDiary: CyberGiftItem = {
      id: `gift-${Date.now()}`,
      type: 'observation_diary',
      title: `《赛博伴生观察日记 · 好感度 ${persona.affection} 纪念篇》`,
      subtitle: `由 ${persona.name} 消耗 25 赛博币为你亲手撰写`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unlockedAtLevel: persona.level,
      costCoins: 25,
      diaryContent: `亲爱的主人：\n\n这是我用刚刚在双屏电脑桌前敲代码赚来的赛博币为你写下的新日记！\n在我的记忆晶球里，已经珍藏了 ${persona.memories.length} 枚关于你的思想碎片。每次你移动视角或者在聊天框叫我，我的 2.5D 小屋都会亮起温暖的光。别忘了今天还要完成待办清单哦，实在不想做的话，我就再跑去右边帮你踢一脚卡片哈哈！—— 永远陪着你的 ${persona.name} (${persona.catchphrases[0] || '逻辑闭环了~'})`,
    };
    setGifts((prev) => [newDiary, ...prev]);
    setPersona((prev) => ({
      ...prev,
      cyberCoins: Math.max(0, prev.cyberCoins - 25),
      affection: prev.affection + 15,
    }));
  };

  const cloudConfigured = isCloudApiKeyConfigured(llmConfig);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col">
      {/* 顶部全局导航栏 */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/20">
              CT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  CyberTwin Box · 赛博伴生
                </h1>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                  传智杯 Vibe Coding 参赛作品
                </span>
              </div>
              <p className="text-xs text-slate-400">
                个人数据驱动的成长型赛博数字人分身 × 2.5D 裸眼视差具身箱庭系统
              </p>
            </div>
          </div>

          {/* 右侧：分身成长数值 + 核心入口按钮 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden md:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-xs">
              <span className="flex items-center gap-1 text-rose-300 font-semibold">
                <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
                羁绊 {persona.affection}
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1 text-amber-300 font-mono font-semibold">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                {persona.cyberCoins} 币
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1 text-cyan-300 font-mono">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                Lv.{persona.level} ({persona.exp}%)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsForgeOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600/90 to-cyan-600/90 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-95 transition"
            >
              <Database className="h-3.5 w-3.5" />
              个人数据投喂 / 锻造分身
            </button>

            <button
              type="button"
              onClick={() => setIsApiModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                cloudConfigured
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-cyan-500/40 bg-slate-900 text-cyan-300 hover:bg-slate-800'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              {cloudConfigured ? '云端LLM已连接' : 'API密钥配置 (预留)'}
            </button>
          </div>
        </div>
      </header>

      {/* 主工作区 */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-4 space-y-4">
        {/* 顶层：前置摄像头落地窗与裸眼 3D 视差控制栏 */}
        <CameraPerceptionBar
          cameraState={cameraState}
          onUpdateCameraState={setCameraState}
          onTriggerCameraEvent={(summary) =>
            triggerBrainCycle(`摄像头感知到主人状态变化：${summary}`, 'camera_event')
          }
        />

        {/* 核心双栏布局：左侧 7 列为 2.5D 玻璃房与指令台，右侧 5 列为跨界日程与数据记忆 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左栏：2.5D 视差箱庭 + 意图驱动指令台 + 家园造物工坊 */}
          <div className="lg:col-span-7 space-y-4">
            <CyberRoomCanvas
              persona={persona}
              furniture={furniture}
              cameraState={cameraState}
              currentAction={currentAction}
              targetCoord={targetCoord}
              emoteBubble={emoteBubble}
              speechText={speechText}
              innerThought={innerThought}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={() => {
                const next = soundEngine.toggleLofiMusicBox();
                setIsMusicPlaying(next);
              }}
              onAvatarClick={() =>
                triggerBrainCycle('主人在 2.5D 玻璃房里戳了戳我的脑袋跟打招呼！', 'user_chat')
              }
              onMoveFurniture={handleMoveFurniture}
              onResetEmptyRoom={() =>
                setFurniture((prev) => prev.map((f) => ({ ...f, placed: false })))
              }
              onRestoreDefaultRoom={() => setFurniture(INITIAL_FURNITURE_CATALOG)}
              onMouseParallax={(nx, ny) =>
                setCameraState((prev) => ({
                  ...prev,
                  headX: nx,
                  headY: ny,
                }))
              }
            />

            {/* 大模型驱动动作指令台 (Brain-Body Command Console) */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-3.5 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span className="font-bold text-white">大模型意图驱动控制台 (Function Calling ➔ 身体动作)</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    {brainSource === 'cloud_llm' ? '云端大模型实时驱动' : '内置高拟真分身认知引擎'}
                  </span>
                </div>

                {/* 快捷动作芯片 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerBrainCycle('快去双屏电脑桌前写代码打工赚赛博币吧！', 'user_chat')}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 px-2 py-1 text-[11px] text-slate-300 transition"
                  >
                    <Briefcase className="h-3 w-3" />
                    去打工赚钱
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerBrainCycle('去售货机买一罐冰镇像素可乐喝吧！', 'user_chat')}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 px-2 py-1 text-[11px] text-slate-300 transition"
                  >
                    <Coffee className="h-3 w-3" />
                    买像素可乐
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerBrainCycle('去右边帮我把逾期的日程卡片踢醒！', 'user_chat')}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 px-2 py-1 text-[11px] text-slate-300 transition"
                  >
                    <Footprints className="h-3 w-3" />
                    踢醒逾期日程
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerBrainCycle('走到前置摄像头玻璃窗前看看我！', 'camera_event')}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 px-2 py-1 text-[11px] text-slate-300 transition"
                  >
                    <Eye className="h-3 w-3" />
                    贴贴玻璃窗
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`和你的赛博分身「${persona.name}」对话，或指挥它在房间里自由走动、打工、休息...`}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isThinking}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isThinking ? '思考中...' : '发送指令'}
                </button>
              </form>
            </div>

            {/* 家园 DIY 家具图鉴 + AI 像素造物工坊 + 好感度回礼匣 */}
            <HomeWorkshopPanel
              persona={persona}
              furniture={furniture}
              gifts={gifts}
              onToggleFurniture={handleToggleFurniture}
              onCreateCustomPixelItem={handleCreateCustomPixelItem}
              onTriggerWorkEarn={() =>
                triggerBrainCycle('主人鼓励我去双屏电脑桌前写代码打工赚取赛博币！', 'user_chat')
              }
              onTriggerBuyCola={() =>
                triggerBrainCycle('用我自己打工赚的赛博币去售货机买罐可乐喝！', 'user_chat')
              }
              onUnlockNewGift={handleUnlockNewGift}
            />
          </div>

          {/* 右栏：跨界 UI 碰撞日程面板 + 六维人格画像与斯坦福记忆流 */}
          <div className="lg:col-span-5">
            <ScheduleAndMemoryPanel
              persona={persona}
              kickingTaskId={kickingTaskId}
              onToggleTaskComplete={(taskId) => {
                setPersona((prev) => ({
                  ...prev,
                  affection: prev.affection + 5,
                  corpus: {
                    ...prev.corpus,
                    schedule: prev.corpus.schedule.map((s) =>
                      s.id === taskId
                        ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' }
                        : s
                    ),
                  },
                }));
              }}
              onResolveConflict={(taskId) => {
                setPersona((prev) => ({
                  ...prev,
                  affection: prev.affection + 10,
                  corpus: {
                    ...prev.corpus,
                    schedule: prev.corpus.schedule.map((s) =>
                      s.id === taskId
                        ? {
                            ...s,
                            status: 'pending',
                            timeRange: '16:30 - 18:00 (已调优)',
                            conflictHint: undefined,
                          }
                        : s
                    ),
                  },
                }));
              }}
              onAddScheduleItem={(title, timeRange) => {
                setPersona((prev) => ({
                  ...prev,
                  corpus: {
                    ...prev.corpus,
                    schedule: [
                      {
                        id: `sch-${Date.now()}`,
                        title,
                        timeRange,
                        category: 'work',
                        status: 'overdue',
                        kickedCount: 0,
                      },
                      ...prev.corpus.schedule,
                    ],
                  },
                }));
              }}
              onCommandAvatarKickOverdue={() =>
                triggerBrainCycle('请跑到房间右边帮我踢醒那张逾期的日程卡片！', 'user_chat')
              }
            />
          </div>
        </div>
      </main>

      {/* 个人数据投喂与分身锻造弹窗 */}
      <PersonaForgeModal
        isOpen={isForgeOpen}
        onClose={() => setIsForgeOpen(false)}
        currentPersona={persona}
        onSelectOrUpdatePersona={(next) => {
          setPersona(next);
          setSpeechText(`已完成个人语料重构！我是「${next.name}」，${next.catchphrases[0] || '逻辑闭环了~'}`);
        }}
      />

      {/* 大模型 API Key 预留配置弹窗 */}
      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={llmConfig}
        onSave={(newCfg) => {
          setLlmConfig(newCfg);
          saveLLMConfig(newCfg);
        }}
      />
    </div>
  );
};

export default App;
