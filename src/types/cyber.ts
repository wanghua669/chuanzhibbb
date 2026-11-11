// ============================================================================
// CyberTwin Box (赛博伴生) - 核心领域模型与类型定义
// ============================================================================

export type AvatarThemeStyle = 'cyber_geek' | 'healing_artist' | 'efficiency_scholar' | 'custom_neon';

export interface SixDimPersonaRadar {
  empathy: number;       // 共情温度 (0-100)
  extraversion: number;  // 表达活力 (0-100)
  rationality: number;   // 逻辑理性 (0-100)
  creativity: number;    // 脑洞创造 (0-100)
  discipline: number;    // 自律规划 (0-100)
  humor: number;         // 赛博幽默 (0-100)
}

export interface ScheduleItem {
  id: string;
  title: string;
  timeRange: string;     // e.g. "14:00 - 15:30"
  category: 'study' | 'work' | 'life' | 'creative';
  status: 'pending' | 'overdue' | 'completed' | 'conflict';
  conflictHint?: string;
  kickedCount?: number;  // 被赛博小人踢翻提醒的次数
}

export interface PersonaDataCorpus {
  rawSocialPosts: string[];  // 用户社交发言/日常聊天语料样本
  rawNotes: string[];        // 用户读书/学习/代码笔记碎片
  dailyBio: string;          // 个人背景与作息习惯描述
  schedule: ScheduleItem[];  // 关联日程表
}

export interface MemoryFragment {
  id: string;
  timestamp: string;
  category: 'corpus' | 'interaction' | 'reflection' | 'milestone';
  content: string;
  importance: number; // 1-10
  emotionTag: 'happy' | 'curious' | 'caring' | 'proud' | 'focused';
}

export interface PersonaProfile {
  id: string;
  name: string;
  title: string;
  avatarStyle: AvatarThemeStyle;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  level: number;          // Lv.1 初醒意识 -> Lv.5 灵魂伴生
  exp: number;            // 当前经验值 (满 100 升级)
  affection: number;      // 好感度羁绊值
  cyberCoins: number;     // 小人独立打工金库 (赛博币)
  hourlyWage: number;     // 赛博打工时薪 (随等级和家具提升)
  energy: number;         // 精力值 (0-100)
  mood: 'happy' | 'focused' | 'caring' | 'sleepy' | 'excited' | 'curious';
  catchphrases: string[]; // 从语料中自动提取的口头禅
  speakingStyle: string;  // 语言风格总结
  radar: SixDimPersonaRadar;
  corpus: PersonaDataCorpus;
  memories: MemoryFragment[];
}

export type BrainActionType =
  | 'walk_to'
  | 'sit'
  | 'work_code'
  | 'sleep'
  | 'drink_cola'
  | 'interact_ui'
  | 'dance'
  | 'emote'
  | 'wander'
  | 'look_at_camera'
  | 'play_music';

export interface BrainActionCommand {
  type: BrainActionType;
  target?: string;       // e.g., 'desk', 'bed', 'vending_machine', 'window_camera', 'ui_schedule', 'arcade', 'center'
  targetX?: number;      // 归一化房间坐标 (0.1 - 0.9)
  targetY?: number;      // 归一化房间深度坐标 (0.3 - 0.85)
  value?: string;        // 气泡表情或附加信息
  durationMs?: number;
}

export interface BrainDecisionResponse {
  inner_thought: string; // 大模型内部思维链 (Inner Monologue)
  speech: string;        // 对主人说的话 (带分身语料风格)
  mood: PersonaProfile['mood'];
  actions: BrainActionCommand[];
  new_memory?: string;   // 触发的反思记忆碎片
  source: 'cloud_llm' | 'heuristic_engine';
}

export type FurnitureCategory = 'work' | 'rest' | 'entertainment' | 'decor' | 'ai_custom';

export interface FurnitureItem {
  id: string;
  type: string;
  name: string;
  category: FurnitureCategory;
  x: number;             // 房间内 X 比例 (0.12 ~ 0.88)
  y: number;             // 房间内 Y 深度比例 (0.35 ~ 0.85)
  zLayer: number;        // 视差深度层 (1: 后墙, 2: 中景, 3: 前景)
  placed: boolean;       // 是否已摆放在房间中
  price: number;         // 赛博币价格 (0 表示免费基础款或主人制作)
  affectionBonus: number;
  interactiveTag: 'desk' | 'bed' | 'vending' | 'arcade' | 'music' | 'plant' | 'custom_gift';
  description: string;
  isCustomPixel?: boolean;
  customMatrix?: number[][]; // 16x16 像素矩阵 (0为透明, 1-6为调色板索引)
  customPalette?: string[];
}

export interface CyberGiftItem {
  id: string;
  type: 'pixel_wallpaper' | 'observation_diary' | 'lofi_music';
  title: string;
  subtitle: string;
  createdAt: string;
  unlockedAtLevel: number;
  costCoins: number;
  diaryContent?: string;
  pixelArtSeed?: string;
  pixelMatrix?: number[][];
  palette?: string[];
}

export interface CameraPerceptionState {
  enabled: boolean;
  hasPermission: boolean;
  headX: number;         // -1.0 (左) ~ +1.0 (右)
  headY: number;         // -1.0 (上) ~ +1.0 (下)
  headZ: number;         // 0.5 (远) ~ 1.5 (凑近屏幕)
  userExpression: 'smiling' | 'focused' | 'tired' | 'away' | 'neutral';
  expressionLabel: string;
  brightness: number;
  lastVisionSummary: string;
}

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  visionApiKey: string;
  visionBaseUrl: string;
  visionModel: string;
  heartbeatIntervalSec: number;
  enableAutoHeartbeat: boolean;
}
