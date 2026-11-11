import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
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
  Maximize2,
  Minimize2,
  Timer,
  Play,
  RotateCcw,
  Home,
  Sparkles,
  Volume2,
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
  // 1. 成长型赛博分身状态
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

  // 4. 大模型 API 配置
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => loadLLMConfig());

  // 5. 前置摄像头落地窗 & 2.5D 裸眼视差坐标
  const [cameraState, setCameraState] = useState<CameraPerceptionState>({
    enabled: false,
    hasPermission: false,
    headX: 0,
    headY: 0,
    headZ: 1.0,
    userExpression: 'focused',
    expressionLabel: '温暖陪伴中 ☀️',
    brightness: 145,
    lastVisionSummary: '主人正在阳光书房桌面端与赛博分身互动',
  });

  // 6. 赛博分身“身体执行层”状态机
  const [currentAction, setCurrentAction] = useState<BrainActionType>('sit');
  const [targetCoord, setTargetCoord] = useState<{ x: number; y: number }>({ x: 0.48, y: 0.66 });
  const [emoteBubble, setEmoteBubble] = useState<string>('☀️ 逻辑闭环了~');
  const [speechText, setSpeechText] = useState<string>(
    '欢迎回到我们的阳光木屋桌面端！我已经换上了精绘的 32-Bit 像素房间与装扮，随时陪你一起专注学习或打工赚钱~'
  );
  const [innerThought, setInnerThought] = useState<string>(
    '已加载个人语料记忆与 32-Bit 精绘像素图层，开启温暖伴学/伴工守护循环。'
  );
  const [brainSource, setBrainSource] = useState<'cloud_llm' | 'heuristic_engine'>('heuristic_engine');
  const [isThinking, setIsThinking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [kickingTaskId, setKickingTaskId] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // 7. 桌面客户端专属模式：完整工作台 (studio) vs 迷你桌宠挂件 (mini_widget)
  const [windowMode, setWindowMode] = useState<'studio' | 'mini_widget'>('studio');

  // 8. 内置伴学番茄钟 (Spirit City / Virtual Cottage 经典生产力组件)
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);

  // 弹窗开关
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const actionQueueTimerRef = useRef<number | null>(null);

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

  // 伴学番茄钟计时器
  useEffect(() => {
    if (!pomoRunning) return;
    const t = window.setInterval(() => {
      setPomoSeconds((prev) => {
        if (prev <= 1) {
          setPomoRunning(false);
          soundEngine.playGiftDropSound();
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pomoRunning]);

  const formatPomo = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const resolveTargetCoordinates = useCallback(
    (targetName?: string): { x: number; y: number } => {
      const placed = furniture.filter((f) => f.placed);
      if (targetName === 'desk') {
        const desk = placed.find((f) => f.interactiveTag === 'desk');
        if (desk) return { x: desk.x, y: desk.y + 0.04 };
      }
      if (targetName === 'bed') {
        const bed = placed.find((f) => f.interactiveTag === 'bed');
        if (bed) return { x: bed.x, y: bed.y + 0.02 };
      }
      if (targetName === 'vending' || targetName === 'vending_machine') {
        const vend = placed.find((f) => f.interactiveTag === 'vending');
        if (vend) return { x: vend.x, y: vend.y + 0.06 };
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
        return { x: 0.5, y: 0.74 };
      }
      if (targetName === 'ui_schedule') {
        return { x: 0.88, y: 0.64 };
      }
      return { x: 0.48, y: 0.66 };
    },
    [furniture]
  );

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

  const executeActionSequence = useCallback(
    (actions: BrainActionCommand[]) => {
      if (actionQueueTimerRef.current) {
        clearTimeout(actionQueueTimerRef.current);
      }

      const emojiMap: Record<string, string> = {
        heart: '❤️ 羁绊升温!',
        bulb: '💡 灵感闪现!',
        coding: '💻 专注写代码中',
        cola: '🍓 冰镇草莓汽水!',
        music: '🎵 治愈留声机~',
        shock: '⚡ 发现目标!',
        zzz: '☁️ 云朵午睡中~',
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
    triggerBrainCycle(`主人用 AI 像素工坊为我合成了礼物「${newItem.name}」并放进了阳光木屋！`, 'gift_drop');
  };

  const handleUnlockNewGift = () => {
    soundEngine.playGiftDropSound();
    const newDiary: CyberGiftItem = {
      id: `gift-${Date.now()}`,
      type: 'observation_diary',
      title: `《阳光木屋陪伴手账 · 羁绊 ${persona.affection} 纪念篇》`,
      subtitle: `由 ${persona.name} 消耗 25 币为你亲手写下`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unlockedAtLevel: persona.level,
      costCoins: 25,
      diaryContent: `亲爱的主人：\n\n这是我用刚刚在原木双屏桌前敲代码攒下的零花钱为你写的新手账！\n看着阳光透过木窗洒在地毯上，我的记忆匣里已经收集了 ${persona.memories.length} 枚关于你的温暖片段。今天也要记得按时完成软木板上的便签任务哦，要是累了就点一下留声机，我陪你听会儿歌~ —— 永远陪伴你的 ${persona.name}`,
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
    <div className="h-screen w-screen overflow-hidden bg-[#EFE5D8] p-1.5 sm:p-2.5 flex flex-col select-none">
      {/* 桌面客户端软件主窗口壳体 (Native Desktop Application Window Frame) */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border-2 border-[#D4B895] bg-[#FBF6EE] shadow-2xl overflow-hidden">
        {/* 1. 原生桌面软件自定义标题栏 (Desktop Client Titlebar) */}
        <header className="h-12 shrink-0 border-b border-[#E2D0BA] bg-[#F4E9DA] px-4 flex items-center justify-between gap-3">
          {/* 左侧：桌面窗口红黄绿控制点 + 软件名称 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#E07A5F] border border-[#C85A3F] inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#F2CC8F] border border-[#D9A756] inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#81B29A] border border-[#5E947A] inline-block" />
            </div>
            <div className="h-4 w-[1px] bg-[#D4B895]" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E07A5F] text-white font-black text-xs shadow-sm">
                CT
              </div>
              <span className="text-sm font-extrabold text-[#4A3525] tracking-tight">
                CyberTwin Cozy Studio
              </span>
              <span className="hidden sm:inline-block rounded-md bg-[#FFFDF9] border border-[#D4B895] px-2 py-0.5 text-[10px] font-bold text-[#8C5A3C]">
                Desktop Client v2.0 · 传智杯作品
              </span>
            </div>
          </div>

          {/* 中部：伴学番茄钟 + 桌面软件形态切换 (工作台模式 vs 迷你桌宠模式) */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#D4B895] bg-[#FFFDF9] px-2.5 py-1 text-xs">
              <Timer className="h-3.5 w-3.5 text-[#E07A5F]" />
              <span className="font-bold text-[#6E4F35]">伴学番茄钟</span>
              <span className="font-mono font-extrabold text-[#4A3525] px-1">
                {formatPomo(pomoSeconds)}
              </span>
              <button
                type="button"
                onClick={() => setPomoRunning(!pomoRunning)}
                className="rounded-md bg-[#E07A5F] px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#D0694E]"
              >
                {pomoRunning ? '暂停' : '开始'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPomoRunning(false);
                  setPomoSeconds(25 * 60);
                }}
                className="text-[#8A725E] hover:text-[#4A3525]"
                title="重置番茄钟"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center rounded-xl border border-[#D4B895] bg-[#FFFDF9] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setWindowMode('studio')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  windowMode === 'studio'
                    ? 'bg-[#E07A5F] text-white'
                    : 'text-[#7C5D41] hover:text-[#4A3525]'
                }`}
              >
                🏠 完整伴生工作台
              </button>
              <button
                type="button"
                onClick={() => setWindowMode('mini_widget')}
                className={`rounded-lg px-2.5 py-1 font-bold transition ${
                  windowMode === 'mini_widget'
                    ? 'bg-[#6B9E78] text-white'
                    : 'text-[#7C5D41] hover:text-[#4A3525]'
                }`}
              >
                🐾 迷你桌宠挂件模式
              </button>
            </div>
          </div>

          {/* 右侧：分身状态胶囊 + 个人语料熔炉 + API 配置 */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2.5 rounded-xl border border-[#D4B895] bg-[#FFFDF9] px-3 py-1 text-xs">
              <span className="flex items-center gap-1 text-[#C84B31] font-bold">
                <Heart className="h-3.5 w-3.5 text-[#E07A5F] fill-[#E07A5F]" />
                {persona.affection}
              </span>
              <span className="text-[#E2D0BA]">|</span>
              <span className="flex items-center gap-1 text-[#B45309] font-mono font-bold">
                <Coins className="h-3.5 w-3.5 text-[#D97706]" />
                {persona.cyberCoins}币
              </span>
              <span className="text-[#E2D0BA]">|</span>
              <span className="flex items-center gap-1 text-[#2F6B40] font-mono font-bold">
                <Activity className="h-3.5 w-3.5 text-[#6B9E78]" />
                Lv.{persona.level}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsForgeOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#E07A5F] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#D0694E] transition"
            >
              <Database className="h-3.5 w-3.5" />
              个人语料投喂
            </button>

            <button
              type="button"
              onClick={() => setIsApiModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                cloudConfigured
                  ? 'border-[#6B9E78] bg-[#E8F3EA] text-[#2F6B40]'
                  : 'border-[#D4B895] bg-[#FFFDF9] text-[#5C4028] hover:bg-[#F5EBE0]'
              }`}
            >
              <Key className="h-3.5 w-3.5 text-[#E07A5F]" />
              {cloudConfigured ? '云端LLM已连' : 'API配置(预留)'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="rounded-lg border border-[#D4B895] bg-[#FFFDF9] p-1.5 text-[#6E4F35] hover:bg-[#F5EBE0]"
              title="切换全屏桌面模式"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* 2. 软件主内容区：左侧停靠坞 (Dock Rail) + 分栏工作区 */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* 左侧软件停靠栏 (Cozy App Sidebar Dock) */}
          <aside className="w-16 sm:w-20 shrink-0 border-r border-[#E2D0BA] bg-[#F6EDE0] py-3 px-1.5 flex flex-col items-center justify-between">
            <div className="flex flex-col items-center gap-2.5 w-full">
              <div className="text-[10px] font-extrabold text-[#8A725E] tracking-wider">
                伴生分身
              </div>
              {PRESET_PERSONAS.map((p) => {
                const isSelected = p.id === persona.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPersona(p);
                      setSpeechText(`切换至伴生分身「${p.name}」：${p.catchphrases[0]}`);
                    }}
                    className={`w-full rounded-xl p-1.5 flex flex-col items-center gap-1 border transition ${
                      isSelected
                        ? 'border-[#E07A5F] bg-[#FFFDF9] shadow-sm text-[#4A3525]'
                        : 'border-transparent text-[#8A725E] hover:bg-[#EFE4D4]'
                    }`}
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shadow-sm"
                      style={{ backgroundColor: p.id === 'persona-nuan' ? '#E07A5F' : p.id === 'persona-mo' ? '#6B9E78' : '#5B9BD5' }}
                    >
                      {p.name.slice(0, 1)}
                    </div>
                    <span className="text-[10px] font-bold truncate max-w-full">
                      {p.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  const next = soundEngine.toggleLofiMusicBox();
                  setIsMusicPlaying(next);
                }}
                className={`w-full rounded-xl p-2 flex flex-col items-center gap-1 border text-[10px] font-bold transition ${
                  isMusicPlaying
                    ? 'border-[#6B9E78] bg-[#E8F3EA] text-[#2F6B40]'
                    : 'border-[#D4B895] bg-[#FFFDF9] text-[#6E4F35]'
                }`}
              >
                <Volume2 className="h-4 w-4" />
                <span>八音盒</span>
              </button>
              <button
                type="button"
                onClick={() => setIsForgeOpen(true)}
                className="w-full rounded-xl border border-[#D4B895] bg-[#FFFDF9] p-2 flex flex-col items-center gap-1 text-[10px] font-bold text-[#6E4F35] hover:bg-[#EFE4D4]"
              >
                <Sparkles className="h-4 w-4 text-[#E07A5F]" />
                <span>锻造台</span>
              </button>
            </div>
          </aside>

          {/* 右侧主视图区 */}
          <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
            {windowMode === 'mini_widget' ? (
              /* 迷你桌宠挂件模式：只聚焦展示阳光像素房间与快捷对话 */
              <div className="mx-auto max-w-2xl space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-[#D4B895] bg-[#FFFDF9] px-3.5 py-2">
                  <span className="text-xs font-extrabold text-[#4A3525]">
                    🐾 迷你桌宠挂件模式（适合贴在屏幕角落伴学）
                  </span>
                  <button
                    type="button"
                    onClick={() => setWindowMode('studio')}
                    className="flex items-center gap-1 rounded-lg bg-[#E07A5F] px-2.5 py-1 text-xs font-bold text-white"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                    返回完整工作台
                  </button>
                </div>
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
                    triggerBrainCycle('主人在阳光木屋里摸了摸我的头！', 'user_chat')
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
              </div>
            ) : (
              /* 完整伴生工作台模式 */
              <>
                <CameraPerceptionBar
                  cameraState={cameraState}
                  onUpdateCameraState={setCameraState}
                  onTriggerCameraEvent={(summary) =>
                    triggerBrainCycle(`摄像头感知到主人状态变化：${summary}`, 'camera_event')
                  }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                  {/* 左栏 7 列：32-Bit 精绘阳光木屋 + 意图指令台 + 家园工坊 */}
                  <div className="lg:col-span-7 space-y-3">
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
                        triggerBrainCycle('主人在阳光木屋里戳了戳我的脑袋打招呼！', 'user_chat')
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

                    {/* 大模型意图驱动控制台 */}
                    <div className="rounded-2xl border-2 border-[#E2D0BA] bg-[#FFFDF9] p-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Cpu className="h-4 w-4 text-[#E07A5F]" />
                          <span className="font-extrabold text-[#4A3525]">
                            大模型动作决策台 (Function Calling ➔ 像素身体动作)
                          </span>
                          <span className="rounded-full bg-[#FAF3E8] border border-[#DFCBB2] px-2 py-0.5 text-[10px] font-bold text-[#7C5D41]">
                            {brainSource === 'cloud_llm' ? '云端大模型实时驱动' : '内置高拟真启发式大脑'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => triggerBrainCycle('快去双屏原木桌前写代码打工攒赛博币吧！', 'user_chat')}
                            className="flex items-center gap-1 rounded-lg border border-[#DFCBB2] bg-[#FAF3E8] hover:bg-[#E8F3EA] hover:text-[#2F6B40] px-2 py-1 text-[11px] font-bold text-[#5C4028] transition"
                          >
                            <Briefcase className="h-3 w-3 text-[#6B9E78]" />
                            去写代码打工
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerBrainCycle('去售货机买一罐冰镇草莓汽水喝吧！', 'user_chat')}
                            className="flex items-center gap-1 rounded-lg border border-[#DFCBB2] bg-[#FAF3E8] hover:bg-[#FFF0EB] hover:text-[#B84A2E] px-2 py-1 text-[11px] font-bold text-[#5C4028] transition"
                          >
                            <Coffee className="h-3 w-3 text-[#E07A5F]" />
                            喝草莓汽水
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerBrainCycle('去云朵睡眠舱上眯一会儿午睡充电吧！', 'user_chat')}
                            className="flex items-center gap-1 rounded-lg border border-[#DFCBB2] bg-[#FAF3E8] hover:bg-[#EBF8FF] hover:text-[#2B6CB0] px-2 py-1 text-[11px] font-bold text-[#5C4028] transition"
                          >
                            <Home className="h-3 w-3 text-[#4A90E2]" />
                            云朵床小憩
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerBrainCycle('去右边帮我把逾期的日程便签踢醒！', 'user_chat')}
                            className="flex items-center gap-1 rounded-lg border border-[#DFCBB2] bg-[#FAF3E8] hover:bg-[#FEF3C7] hover:text-[#92400E] px-2 py-1 text-[11px] font-bold text-[#5C4028] transition"
                          >
                            <Footprints className="h-3 w-3 text-[#D97706]" />
                            踢醒逾期便签
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerBrainCycle('走到前置摄像头阳光窗前看看我！', 'camera_event')}
                            className="flex items-center gap-1 rounded-lg border border-[#DFCBB2] bg-[#FAF3E8] hover:bg-[#FCE7F3] hover:text-[#9D174D] px-2 py-1 text-[11px] font-bold text-[#5C4028] transition"
                          >
                            <Eye className="h-3 w-3 text-[#D96B7B]" />
                            窗前贴贴
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleSendChat} className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={`和你的赛博伴生分身「${persona.name}」聊聊天，或指挥它在阳光木屋里自由走动...`}
                          className="flex-1 rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3.5 py-2 text-xs text-[#4A3525] placeholder-[#9C8570] focus:border-[#E07A5F] focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isThinking}
                          className="flex items-center gap-1.5 rounded-xl bg-[#E07A5F] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#D0694E] transition disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isThinking ? '思考中...' : '发送'}
                        </button>
                      </form>
                    </div>

                    <HomeWorkshopPanel
                      persona={persona}
                      furniture={furniture}
                      gifts={gifts}
                      onToggleFurniture={handleToggleFurniture}
                      onCreateCustomPixelItem={handleCreateCustomPixelItem}
                      onTriggerWorkEarn={() =>
                        triggerBrainCycle('主人鼓励我去原木双屏桌前写代码打工赚取赛博币！', 'user_chat')
                      }
                      onTriggerBuyCola={() =>
                        triggerBrainCycle('用我自己打工赚的赛博币去售货机买罐草莓汽水喝！', 'user_chat')
                      }
                      onUnlockNewGift={handleUnlockNewGift}
                    />
                  </div>

                  {/* 右栏 5 列：软木板跨界日程便签墙 + 六维人格画像与斯坦福记忆流 */}
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
                                    timeRange: '16:30 - 18:00 (已错峰)',
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
                        triggerBrainCycle('请跑到房间右边帮我踢醒那张逾期的日程便签卡片！', 'user_chat')
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <PersonaForgeModal
        isOpen={isForgeOpen}
        onClose={() => setIsForgeOpen(false)}
        currentPersona={persona}
        onSelectOrUpdatePersona={(next) => {
          setPersona(next);
          setSpeechText(`已完成个人语料重构！我是「${next.name}」，${next.catchphrases[0] || '逻辑闭环了~'}`);
        }}
      />

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
