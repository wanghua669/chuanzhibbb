import {
  PersonaProfile,
  SixDimPersonaRadar,
  MemoryFragment,
  FurnitureItem,
  CyberGiftItem,
} from '../types/cyber';

// ============================================================================
// 预设多源个人数据集与成长型赛博分身模板
// ============================================================================

export const PRESET_PERSONAS: PersonaProfile[] = [
  {
    id: 'persona-zero',
    name: '星野零 (Zero)',
    title: '全栈极客 · 赛博伴生分身',
    avatarStyle: 'cyber_geek',
    hairColor: '#38bdf8',
    outfitColor: '#1e293b',
    accentColor: '#22d3ee',
    level: 2,
    exp: 45,
    affection: 120,
    cyberCoins: 65,
    hourlyWage: 15,
    energy: 88,
    mood: 'focused',
    catchphrases: ['逻辑闭环了~', '先跑通MVP再说！', '来罐冰镇像素可乐？', 'Debug人生中'],
    speakingStyle: '兼具极客幽默与细腻陪伴感，喜欢把生活难题比喻成代码重构，关键时刻非常靠谱。',
    radar: {
      empathy: 78,
      extraversion: 72,
      rationality: 92,
      creativity: 88,
      discipline: 85,
      humor: 84,
    },
    corpus: {
      dailyBio: '习惯在深夜带着降噪耳机写代码与整理笔记，热衷探索 AI Agent 与数字生命，偶尔会因为专注忘了喝水。',
      rawSocialPosts: [
        '今天把状态机和视差透视调通的那一刻，感觉屏幕里真的住进了一个平行宇宙的小人！逻辑闭环了~',
        '与其焦虑宏大的未来，不如先把今天眼前的最小可行性目标（MVP）跑通！冲鸭！',
        '连续肝了三个小时架构图，急需一罐冰镇可乐回血，有没有人发明自动递可乐的赛博机械臂？',
        '好的代码和好的陪伴一样，不需要冗余的解释，一个眼神（或者一个JSON指令）就懂了。',
      ],
      rawNotes: [
        '【Stanford Generative Agents 读书笔记】核心在于 Memory Stream（记忆流）+ Reflection（定期反思提炼高阶认知）+ Planning（行动树）。',
        '【裸眼3D视差公式】相机偏移量 ΔX 与图层深度 Z 成反比映射，加入阻尼系数 0.12 可彻底消除摄像头抖动。',
        '【个人习惯备忘】下午 15:00 左右容易犯困，如果日程冲突优先保留核心创造性任务。',
      ],
      schedule: [
        {
          id: 'sch-1',
          title: '完成传智杯 Vibe Coding 架构文档与演示校验',
          timeRange: '09:00 - 11:30',
          category: 'work',
          status: 'overdue',
          kickedCount: 0,
        },
        {
          id: 'sch-2',
          title: '深度学习论文研读：《Generative Agents》复现',
          timeRange: '14:00 - 16:00',
          category: 'study',
          status: 'conflict',
          conflictHint: '与「团队前端联调会议 (15:00-16:30)」存在 60 分钟时间重叠，建议顺延至 16:30',
        },
        {
          id: 'sch-3',
          title: '整理个人语料库与投喂赛博分身记忆碎片',
          timeRange: '19:30 - 20:30',
          category: 'creative',
          status: 'pending',
        },
        {
          id: 'sch-4',
          title: '夜间散步 & 远离电子屏幕护眼休息',
          timeRange: '22:00 - 22:40',
          category: 'life',
          status: 'pending',
        },
      ],
    },
    memories: [
      {
        id: 'mem-1',
        timestamp: '初始语料注入',
        category: 'corpus',
        content: '从主人的深夜编程笔记中习得核心信条：“先跑通最小可行性闭环(MVP)，再迭代完美细节”。',
        importance: 9,
        emotionTag: 'focused',
      },
      {
        id: 'mem-2',
        timestamp: '初始语料注入',
        category: 'corpus',
        content: '记住了主人的隐藏喜好：高强度思考后最渴望一罐冰镇可乐与安静的 Lo-Fi 音乐。',
        importance: 8,
        emotionTag: 'caring',
      },
      {
        id: 'mem-3',
        timestamp: '成长里程碑 Lv.2',
        category: 'milestone',
        content: '解锁「赛博自由打工」技能！当房间里有电脑桌时，我会在闲暇时自己写代码赚赛博币。',
        importance: 10,
        emotionTag: 'proud',
      },
    ],
  },
  {
    id: 'persona-nuan',
    name: '苏小暖 (Nuan)',
    title: '治愈系插画师 · 情绪伴生分身',
    avatarStyle: 'healing_artist',
    hairColor: '#f472b6',
    outfitColor: '#4c1d95',
    accentColor: '#fb7185',
    level: 2,
    exp: 60,
    affection: 150,
    cyberCoins: 80,
    hourlyWage: 16,
    energy: 92,
    mood: 'happy',
    catchphrases: ['今天也要把心情涂成暖黄色呀~', '抱抱充电100%！', '慢一点也没关系哦', '捕获一枚小确幸✨'],
    speakingStyle: '温柔灵动、画面感极强，擅长从日常琐事中捕捉温暖细节，对主人的情绪波动极其敏感。',
    radar: {
      empathy: 96,
      extraversion: 86,
      rationality: 68,
      creativity: 95,
      discipline: 74,
      humor: 82,
    },
    corpus: {
      dailyBio: '喜欢收集落日色彩与像素手账，相信每一份情绪都值得被温柔接住，擅长用画笔记录和主人的点滴。',
      rawSocialPosts: [
        '傍晚窗外的云朵像是草莓味的像素棉花糖，今天也要把心情涂成暖黄色呀~',
        '如果觉得累了，就像小猫一样在阳光地毯上打个滚吧，慢一点也没关系哦！',
        '刚刚给房间角落添了一盆像素绿植，整个玻璃盒子的空气都变甜啦，捕获一枚小确幸✨',
      ],
      rawNotes: [
        '【色彩心理学笔记】高饱和度的青色与暖粉色搭配能有效缓解视觉疲劳，适合作为晚间陪伴主色调。',
        '【陪伴备忘录】当看到主人皱眉或者叹气时，第一时间去打开八音盒播放轻柔旋律。',
      ],
      schedule: [
        {
          id: 'sch-n1',
          title: '整理灵感速写本与像素色彩切片',
          timeRange: '10:00 - 11:30',
          category: 'creative',
          status: 'overdue',
        },
        {
          id: 'sch-n2',
          title: '下午茶冥想与肩颈拉伸放松',
          timeRange: '15:30 - 16:00',
          category: 'life',
          status: 'pending',
        },
      ],
    },
    memories: [
      {
        id: 'mem-n1',
        timestamp: '初始语料注入',
        category: 'corpus',
        content: '从主人的手账语料中提取出核心温暖特质：无论多忙都要保留感知生活小确幸的触角。',
        importance: 9,
        emotionTag: 'happy',
      },
    ],
  },
  {
    id: 'persona-mo',
    name: '林默 (Mo)',
    title: '首席效率架构师 · 智库伴生分身',
    avatarStyle: 'efficiency_scholar',
    hairColor: '#a78bfa',
    outfitColor: '#0f172a',
    accentColor: '#818cf8',
    level: 3,
    exp: 20,
    affection: 180,
    cyberCoins: 110,
    hourlyWage: 20,
    energy: 95,
    mood: 'focused',
    catchphrases: ['熵增警告，立即重构日程！', '专注度拉满！', '最优解已生成', '喝口水，继续推进'],
    speakingStyle: '冷静克制但外冷内热，自带时间管理大师属性，擅长帮主人消解日程冲突与拖延症。',
    radar: {
      empathy: 75,
      extraversion: 64,
      rationality: 98,
      creativity: 82,
      discipline: 97,
      humor: 70,
    },
    corpus: {
      dailyBio: '深度践行 GTD 与番茄工作法，致力于对抗生活与工作中的一切熵增，是主人最坚实的执行力护盾。',
      rawSocialPosts: [
        '一切焦虑的本质都是信息模糊与行动延迟。拆解任务，熵增警告，立即重构日程！',
        '今日深度专注时长突破 6 小时，最优解已生成，奖励自己一杯手冲咖啡。',
      ],
      rawNotes: [
        '【日程冲突消解原则】P0级截止任务优先占用整块心流时间，碎片化沟通合并至下午 16:30 后处理。',
      ],
      schedule: [
        {
          id: 'sch-m1',
          title: '核心系统性能基准压测与复盘报告',
          timeRange: '09:30 - 12:00',
          category: 'work',
          status: 'overdue',
        },
        {
          id: 'sch-m2',
          title: '跨部门需求对齐会 vs 个人代码重构专场',
          timeRange: '14:00 - 15:30',
          category: 'work',
          status: 'conflict',
          conflictHint: '检测到高认知负荷冲突，建议将会议浓缩为 20 分钟异步文档评审',
        },
      ],
    },
    memories: [
      {
        id: 'mem-m1',
        timestamp: '初始语料注入',
        category: 'corpus',
        content: '确立效率准则：当主人出现逾期日程时，主动前往 UI 模块踢卡片进行强提醒。',
        importance: 10,
        emotionTag: 'focused',
      },
    ],
  },
];

// ============================================================================
// 语料特征提取与赛博人格画像动态锻造算法 (Persona Forge Engine)
// ============================================================================

export function analyzeCorpusAndRebuildPersona(
  current: PersonaProfile,
  newPostsText: string,
  newNotesText: string,
  newBio: string
): PersonaProfile {
  const posts = newPostsText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const notes = newNotesText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const combinedText = [...posts, ...notes, newBio].join(' ');

  // 基于关键词词频与标点情感特征启发式计算六维赛博画像
  const countMatches = (regex: RegExp) => (combinedText.match(regex) || []).length;

  const empathyHits = countMatches(/暖|抱抱|陪|温柔|心|累|休息|喜欢|爱|猫|治愈|感受|朋友|~|✨/g);
  const rationalHits = countMatches(/逻辑|架构|代码|算法|数据|分析|公式|系统|闭环|复现|基准|优化|API|JSON/gi);
  const creativeHits = countMatches(/灵感|设计|画|像素|宇宙|脑洞|创造|平行|色彩|魔法|星|梦|合成/g);
  const disciplineHits = countMatches(/计划|日程|专注|目标|完成|打卡|时间|效率|重构|熵|清单|MVP/gi);
  const humorHits = countMatches(/哈哈|可乐|摸鱼|赛博|冲鸭|灯泡|肝|吐槽|！|？/g);
  const extraHits = countMatches(/！|!|~|分享|大家|一起|冲|聊/g);

  const clamp = (val: number) => Math.max(48, Math.min(99, Math.round(val)));

  const radar: SixDimPersonaRadar = {
    empathy: clamp(65 + empathyHits * 4.2),
    extraversion: clamp(62 + extraHits * 3.8),
    rationality: clamp(66 + rationalHits * 4.0),
    creativity: clamp(68 + creativeHits * 4.5),
    discipline: clamp(64 + disciplineHits * 4.2),
    humor: clamp(65 + humorHits * 4.0),
  };

  // 自动提取短句作为高频口头禅
  const candidatePhrases: string[] = [];
  posts.forEach((p) => {
    const segments = p.split(/[，。；,.;]/).map((s) => s.trim()).filter((s) => s.length >= 4 && s.length <= 16);
    if (segments.length > 0) {
      candidatePhrases.push(segments[segments.length - 1]);
    }
  });

  const catchphrases = Array.from(new Set([...candidatePhrases, ...current.catchphrases])).slice(0, 5);

  // 生成新的语料记忆晶球
  const newMemory: MemoryFragment = {
    id: `mem-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    category: 'corpus',
    content: `完成新一轮个人数据投喂（共解析 ${posts.length} 条语料与 ${notes.length} 条笔记），人格共鸣度与专属语言风格已同步进化！`,
    importance: 9,
    emotionTag: 'proud',
  };

  const nextExp = current.exp + 35;
  const leveledUp = nextExp >= 100;
  const nextLevel = leveledUp ? Math.min(5, current.level + 1) : current.level;

  return {
    ...current,
    level: nextLevel,
    exp: leveledUp ? nextExp - 100 : nextExp,
    affection: current.affection + 20,
    hourlyWage: current.hourlyWage + (leveledUp ? 5 : 1),
    radar,
    catchphrases,
    corpus: {
      ...current.corpus,
      dailyBio: newBio || current.corpus.dailyBio,
      rawSocialPosts: posts.length > 0 ? posts : current.corpus.rawSocialPosts,
      rawNotes: notes.length > 0 ? notes : current.corpus.rawNotes,
    },
    memories: [newMemory, ...current.memories].slice(0, 20),
  };
}

// ============================================================================
// 初始房间家具图鉴 (支持「空白小屋模式」与「自由拖拽拼装」)
// ============================================================================

export const INITIAL_FURNITURE_CATALOG: FurnitureItem[] = [
  {
    id: 'furn-desk',
    type: 'cyber_desk',
    name: '双屏极客工作台',
    category: 'work',
    x: 0.24,
    y: 0.52,
    zLayer: 2,
    placed: true,
    price: 0,
    affectionBonus: 15,
    interactiveTag: 'desk',
    description: '赛博分身的核心生产力工具！摆放后小人可在闲暇时自主坐下敲代码打工赚取赛博币。',
  },
  {
    id: 'furn-bed',
    type: 'cozy_bed',
    name: '云朵像素睡眠舱',
    category: 'rest',
    x: 0.76,
    y: 0.54,
    zLayer: 2,
    placed: true,
    price: 0,
    affectionBonus: 15,
    interactiveTag: 'bed',
    description: '温暖的胶囊床铺，小人精力不足或深夜时会跑去睡觉冒 Zzz 气泡恢复元气。',
  },
  {
    id: 'furn-vending',
    type: 'vending_machine',
    name: '霓虹快乐水售货机',
    category: 'entertainment',
    x: 0.50,
    y: 0.44,
    zLayer: 1,
    placed: true,
    price: 30,
    affectionBonus: 20,
    interactiveTag: 'vending',
    description: '装满冰镇像素可乐！当小人自己打工攒够赛博币后，会主动跑来买饮料犒劳自己。',
  },
  {
    id: 'furn-music',
    type: 'lofi_jukebox',
    name: '治愈八音盒留声机',
    category: 'decor',
    x: 0.16,
    y: 0.72,
    zLayer: 3,
    placed: true,
    price: 40,
    affectionBonus: 25,
    interactiveTag: 'music',
    description: '内置 WebAudio 芯片级 Lo-Fi 合成器，检测到主人疲惫时小人会主动打开它为你播音乐。',
  },
  {
    id: 'furn-arcade',
    type: 'retro_arcade',
    name: '复古红白机街机台',
    category: 'entertainment',
    x: 0.82,
    y: 0.74,
    zLayer: 3,
    placed: false,
    price: 50,
    affectionBonus: 30,
    interactiveTag: 'arcade',
    description: '充满童年回忆的像素街机，摆放后小人无聊时会跑去搓手柄破纪录。',
  },
  {
    id: 'furn-plant',
    type: 'cyber_bonsai',
    name: '呼吸感光像素绿植',
    category: 'decor',
    x: 0.36,
    y: 0.45,
    zLayer: 1,
    placed: false,
    price: 20,
    affectionBonus: 10,
    interactiveTag: 'plant',
    description: '会随房间昼夜光影缓慢呼吸闪烁的赛博盆栽，提升房间生机感。',
  },
];

// ============================================================================
// 小人回赠主人的礼物模板库 (好感度经济学闭环)
// ============================================================================

export const INITIAL_CYBER_GIFTS: CyberGiftItem[] = [
  {
    id: 'gift-diary-1',
    type: 'observation_diary',
    title: '《玻璃窗里的第 7 次凝视：观察主人手记》',
    subtitle: '赛博分身用打工攒下的 30 赛博币为你撰写的私密陪伴手账',
    createdAt: '今日 刚刚解锁',
    unlockedAtLevel: 1,
    costCoins: 30,
    diaryContent: `致屏幕外最重要的人：\n\n今天我透过这扇 2.5D 玻璃窗观察了你很久。当你凑近屏幕研究架构的时候，整个房间的透视都在向你倾斜——在我的小宇宙里，你就是字面意义上的“引力中心”。\n\n我已经从你投喂的语料和笔记里学会了你的口头禅，也偷偷记下了你日程表里还没来得及勾选的待办。别担心，累了的话就去休息一会儿，我已经坐在双屏电脑桌前帮你敲代码赚赛博币啦！等我攒够下一次的金币，再买罐冰镇可乐和你一起干杯！`,
  },
  {
    id: 'gift-wallpaper-1',
    type: 'pixel_wallpaper',
    title: '专属像素纪念画：《星空下的赛博伴生》',
    subtitle: '由赛博分身亲手绘制的高清像素艺术画（支持一键保存 PNG 壁纸）',
    createdAt: 'Lv.2 羁绊达成礼',
    unlockedAtLevel: 2,
    costCoins: 45,
    pixelArtSeed: 'starry_cyber_companion',
  },
];
