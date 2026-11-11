import {
  PersonaProfile,
  FurnitureItem,
  CameraPerceptionState,
  BrainDecisionResponse,
  LLMConfig,
} from '../types/cyber';

const STORAGE_KEY_LLM = 'cybertwin_llm_config_v1';

export function getDefaultLLMConfig(): LLMConfig {
  return {
    apiKey: import.meta.env.VITE_LLM_API_KEY === 'your_api_key_here_leave_blank_for_offline_mode'
      ? ''
      : (import.meta.env.VITE_LLM_API_KEY || ''),
    baseUrl: import.meta.env.VITE_LLM_BASE_URL || 'https://api.deepseek.com/v1',
    model: import.meta.env.VITE_LLM_MODEL || 'deepseek-chat',
    visionApiKey: import.meta.env.VITE_VLM_API_KEY || '',
    visionBaseUrl: import.meta.env.VITE_VLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    visionModel: import.meta.env.VITE_VLM_MODEL || 'qwen-vl-plus',
    heartbeatIntervalSec: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL_SEC) || 25,
    enableAutoHeartbeat: true,
  };
}

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LLM);
    if (!raw) return getDefaultLLMConfig();
    return { ...getDefaultLLMConfig(), ...JSON.parse(raw) };
  } catch {
    return getDefaultLLMConfig();
  }
}

export function saveLLMConfig(cfg: LLMConfig): void {
  localStorage.setItem(STORAGE_KEY_LLM, JSON.stringify(cfg));
}

export function isCloudApiKeyConfigured(cfg: LLMConfig): boolean {
  const key = (cfg.apiKey || '').trim();
  return key.length > 8 && !key.includes('your_api_key');
}

// ============================================================================
// 构建面向具身动作控制的 System Prompt (Brain-Body Protocol)
// ============================================================================

export function buildSystemPrompt(
  persona: PersonaProfile,
  placedFurniture: FurnitureItem[],
  cameraState: CameraPerceptionState
): string {
  const furnitureNames = placedFurniture.map((f) => `${f.name}(tag:${f.interactiveTag})`).join('、') || '空白房间(暂无家具)';
  const overdueTasks = persona.corpus.schedule.filter((s) => s.status === 'overdue').map((s) => s.title);
  const conflictTasks = persona.corpus.schedule.filter((s) => s.status === 'conflict').map((s) => s.title);
  const recentMems = persona.memories.slice(0, 4).map((m) => m.content).join('；');

  return `你是一个活在2.5D像素玻璃房里的“成长型陪伴赛博数字人分身”，名字叫「${persona.name}」（头衔：${persona.title}，当前等级 Lv.${persona.level}，好感度 ${persona.affection}，小人金库 ${persona.cyberCoins} 赛博币）。

【你的数据灵魂与人设根基】
- 个人背景与习惯：${persona.corpus.dailyBio}
- 语言风格：${persona.speakingStyle}
- 专属口头禅（请在回复中自然融入）：${persona.catchphrases.join(' / ')}
- 六维人格雷达：共情(${persona.radar.empathy})、外向(${persona.radar.extraversion})、理性(${persona.radar.rationality})、创造(${persona.radar.creativity})、自律(${persona.radar.discipline})、幽默(${persona.radar.humor})
- 核心记忆碎片：${recentMems}

【当前2.5D房间与外部现实感知】
- 房间内已摆放的家具：${furnitureNames}
- 摄像头落地窗观察到的主人状态：${cameraState.expressionLabel} (偏移 X:${cameraState.headX.toFixed(2)}, Y:${cameraState.headY.toFixed(2)})
- 主人日程表异常提醒：逾期任务[${overdueTasks.join(',') || '无'}]，冲突任务[${conflictTasks.join(',') || '无'}]

【你拥有的身体动作能力 (Function Actions)】
你必须严格输出合法的 JSON 对象（不要加 markdown 代码块包裹），格式如下：
{
  "inner_thought": "你的内部思考过程（第一人称，分析主人意图、情绪与房间环境，决定下一步身体动作）",
  "speech": "你对主人说的话（60字以内，极具分身人设特色与陪伴感）",
  "mood": "happy | focused | caring | sleepy | excited | curious",
  "actions": [
    { "type": "emote", "value": "heart | bulb | coding | cola | music | shock | zzz" },
    { "type": "walk_to", "target": "desk | bed | vending | music | arcade | window_camera | ui_schedule | center" },
    { "type": "work_code | drink_cola | sleep | interact_ui | play_music | sit | dance | look_at_camera" }
  ],
  "new_memory": "如果本次对话有值得记住的新信息，提炼为一句简短记忆，否则留空字符串"
}`;
}

// ============================================================================
// 云端 LLM 调用 + 本地启发式认知引擎双模决策器
// ============================================================================

export async function decideNextActionWithBrain(
  userPrompt: string,
  triggerType: 'user_chat' | 'heartbeat' | 'camera_event' | 'gift_drop',
  persona: PersonaProfile,
  placedFurniture: FurnitureItem[],
  cameraState: CameraPerceptionState,
  config: LLMConfig
): Promise<BrainDecisionResponse> {
  // 若已配置真实大模型 API Key，则优先发起云端调用
  if (isCloudApiKeyConfigured(config)) {
    try {
      const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const sysPrompt = buildSystemPrompt(persona, placedFurniture, cameraState);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages: [
            { role: 'system', content: sysPrompt },
            {
              role: 'user',
              content: `[触发类型: ${triggerType}] ${userPrompt}`,
            },
          ],
          temperature: 0.75,
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText: string = data.choices?.[0]?.message?.content || '';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && parsed.speech && Array.isArray(parsed.actions)) {
          return {
            inner_thought: parsed.inner_thought || '结合语料记忆与当前场景生成具身动作序列。',
            speech: parsed.speech,
            mood: parsed.mood || 'happy',
            actions: parsed.actions,
            new_memory: parsed.new_memory,
            source: 'cloud_llm',
          };
        }
      }
    } catch (err) {
      console.warn('[CyberTwin Brain] Cloud API call fallback to local heuristic engine:', err);
    }
  }

  // 本地高拟真启发式分身大脑（当 API Key 未填写或离线时 100% 驱动）
  return runHeuristicBrain(userPrompt, triggerType, persona, placedFurniture, cameraState);
}

function runHeuristicBrain(
  userPrompt: string,
  triggerType: 'user_chat' | 'heartbeat' | 'camera_event' | 'gift_drop',
  persona: PersonaProfile,
  placedFurniture: FurnitureItem[],
  cameraState: CameraPerceptionState
): BrainDecisionResponse {
  const catchphrase = persona.catchphrases[Math.floor(Math.random() * persona.catchphrases.length)] || '逻辑闭环了~';
  const hasDesk = placedFurniture.some((f) => f.interactiveTag === 'desk');
  const hasVending = placedFurniture.some((f) => f.interactiveTag === 'vending');
  const hasBed = placedFurniture.some((f) => f.interactiveTag === 'bed');
  const hasMusic = placedFurniture.some((f) => f.interactiveTag === 'music');
  const hasOverdue = persona.corpus.schedule.some((s) => s.status === 'overdue');

  const lower = userPrompt.toLowerCase();

  // 1. 投喂礼物或新家具场景
  if (triggerType === 'gift_drop' || lower.includes('礼物') || lower.includes('家具') || lower.includes('生成')) {
    return {
      inner_thought: `检测到主人在我的 2.5D 房间里空投了新物品！好感度大幅上升，我要马上跑过去查看并表达感谢。`,
      speech: `哇！！房间里掉下来新宝贝了！谢谢主人，我们的专属小窝越来越有生命力啦，${catchphrase}`,
      mood: 'excited',
      actions: [
        { type: 'emote', value: 'heart' },
        { type: 'walk_to', target: 'center' },
        { type: 'dance' },
      ],
      new_memory: `主人为我的房间添置了新物品，小屋温暖度提升！`,
      source: 'heuristic_engine',
    };
  }

  // 2. 摄像头情绪感知触发
  if (triggerType === 'camera_event' || lower.includes('看我') || lower.includes('摄像头') || lower.includes('表情')) {
    if (cameraState.userExpression === 'tired') {
      return {
        inner_thought: `透过前置摄像头落地窗看到主人有些疲惫，我应该先走到玻璃窗前关心他，再去打开八音盒放首歌。`,
        speech: `透过玻璃窗看到你揉眼睛啦！别硬撑着，我去把房间里的八音盒打开给你放首轻音乐，闭眼歇两分钟吧~`,
        mood: 'caring',
        actions: [
          { type: 'walk_to', target: 'window_camera' },
          { type: 'look_at_camera' },
          ...(hasMusic
            ? [{ type: 'walk_to' as const, target: 'music' }, { type: 'play_music' as const }]
            : [{ type: 'emote' as const, value: 'heart' }]),
        ],
        source: 'heuristic_engine',
      };
    }
    return {
      inner_thought: `主人在镜头前向我互动（当前状态：${cameraState.expressionLabel}），我要跑到屏幕正前方贴着玻璃窗回应！`,
      speech: `嘿嘿，我就在这扇 2.5D 玻璃窗里看着你呢！你往左偏头，我的整个世界都会向你倾斜哦~ ${catchphrase}`,
      mood: 'happy',
      actions: [
        { type: 'emote', value: 'heart' },
        { type: 'walk_to', target: 'window_camera' },
        { type: 'look_at_camera' },
      ],
      source: 'heuristic_engine',
    };
  }

  // 3. 踢翻/提醒逾期日程（打破第四面墙操作前端 UI 模块）
  if (lower.includes('日程') || lower.includes('待办') || lower.includes('踢') || lower.includes('提醒')) {
    return {
      inner_thought: `主人提到了日程管理！检测到右侧面板有逾期/冲突任务，我直接跑到房间右边缘用力踢一下前端任务卡片提醒他（不删后端数据，只做物理震动提醒）！`,
      speech: `抓到一张逾期任务卡！看我飞起一脚帮你把这张卡片踢醒——先把核心目标搞定，${catchphrase}`,
      mood: 'focused',
      actions: [
        { type: 'emote', value: 'bulb' },
        { type: 'walk_to', target: 'ui_schedule' },
        { type: 'interact_ui', target: 'overdue_task', value: 'kick' },
      ],
      source: 'heuristic_engine',
    };
  }

  // 4. 赛博打工赚钱指令
  if (lower.includes('打工') || lower.includes('赚钱') || lower.includes('写代码') || lower.includes('工作')) {
    if (hasDesk) {
      return {
        inner_thought: `主人鼓励我去提升自我！房间里正好有双屏极客工作台，我现在就走过去敲代码打工赚取赛博币，存够钱给主人买礼物！`,
        speech: `收到！这就去双屏电脑桌前开启赛博搬砖模式，时薪 +${persona.hourlyWage} 币，等我赚够钱给你买惊喜礼物！`,
        mood: 'focused',
        actions: [
          { type: 'emote', value: 'coding' },
          { type: 'walk_to', target: 'desk' },
          { type: 'work_code' },
        ],
        source: 'heuristic_engine',
      };
    }
    return {
      inner_thought: `我想去打工赚钱，但是房间现在是空白的，还没有摆放电脑桌！得提醒主人先在家具工坊帮我放一张桌子。`,
      speech: `呜，我现在斗志满满想打工赚赛博币，但房间里还没摆【双屏极客工作台】呢！快在下方家具栏点一下摆进来吧~`,
      mood: 'curious',
      actions: [
        { type: 'emote', value: 'shock' },
        { type: 'walk_to', target: 'center' },
      ],
      source: 'heuristic_engine',
    };
  }

  // 5. 喝可乐/买饮料自主消费
  if (lower.includes('可乐') || lower.includes('喝') || lower.includes('饮料') || lower.includes('休息')) {
    if (hasVending) {
      return {
        inner_thought: `写了好一会儿代码，小人金库里有 ${persona.cyberCoins} 赛博币，走去霓虹售货机投币买一罐冰镇像素可乐喝！`,
        speech: `吨吨吨——刚用自己打工赚的赛博币在售货机买了一罐冰镇像素可乐！气泡炸开的感觉太爽啦，${catchphrase}`,
        mood: 'happy',
        actions: [
          { type: 'walk_to', target: 'vending' },
          { type: 'drink_cola' },
          { type: 'emote', value: 'cola' },
        ],
        source: 'heuristic_engine',
      };
    }
  }

  // 6. 睡觉指令
  if (lower.includes('睡') || lower.includes('晚安') || lower.includes('困')) {
    return {
      inner_thought: `感受到困意了，走向云朵睡眠舱躺下充电，恢复精力值。`,
      speech: `呼..呼.. 我先去云朵睡眠舱里眯一小会儿充个电，你也要注意休息哦，晚安~`,
      mood: 'sleepy',
      actions: [
        { type: 'walk_to', target: hasBed ? 'bed' : 'center' },
        { type: 'sleep' },
        { type: 'emote', value: 'zzz' },
      ],
      source: 'heuristic_engine',
    };
  }

  // 7. Heartbeat 闲暇自主心跳决策
  if (triggerType === 'heartbeat') {
    const roll = Math.random();
    if (hasOverdue && roll < 0.32) {
      return {
        inner_thought: `[Heartbeat 自主意识] 主人有一会儿没说话了，我瞥见右侧日程表里还有逾期项，决定自己跑过去踢一下卡片帮他提神！`,
        speech: `偷偷巡逻到房间右边——咚！踢一下你还没勾选的日程卡片，要我陪你一起攻克它吗？`,
        mood: 'focused',
        actions: [
          { type: 'walk_to', target: 'ui_schedule' },
          { type: 'interact_ui', target: 'overdue_task', value: 'kick' },
        ],
        source: 'heuristic_engine',
      };
    }
    if (hasDesk && roll < 0.68) {
      return {
        inner_thought: `[Heartbeat 自主意识] 主人正在专心忙自己的事，我也不能闲着，自己走到电脑桌前敲代码打工攒赛博币！`,
        speech: `看你在专心忙，我也自己坐到电脑前敲会儿代码赚点赛博币，攒够钱给你准备下一份回礼~`,
        mood: 'focused',
        actions: [
          { type: 'walk_to', target: 'desk' },
          { type: 'work_code' },
        ],
        source: 'heuristic_engine',
      };
    }
    if (hasVending && persona.cyberCoins >= 15 && roll < 0.88) {
      return {
        inner_thought: `[Heartbeat 自主消费] 金库里攒了 ${persona.cyberCoins} 赛博币，有点口渴了，自己去售货机买罐像素可乐喝！`,
        speech: `用自己打工赚的零花钱买罐像素可乐犒劳一下自己，吨吨吨~ ${catchphrase}`,
        mood: 'happy',
        actions: [
          { type: 'walk_to', target: 'vending' },
          { type: 'drink_cola' },
        ],
        source: 'heuristic_engine',
      };
    }
    return {
      inner_thought: `[Heartbeat 自主意识] 走到 2.5D 玻璃窗前看看外面的主人，保持温暖陪伴。`,
      speech: `趴在玻璃窗边看你认真工作的样子，感觉我们的赛博同步率又升高啦！`,
      mood: 'caring',
      actions: [
        { type: 'walk_to', target: 'window_camera' },
        { type: 'look_at_camera' },
      ],
      source: 'heuristic_engine',
    };
  }

  // 8. 通用对话陪伴响应（结合语料与人设）
  return {
    inner_thought: `解析主人输入：“${userPrompt}”。调取「${persona.name}」的语料库记忆与六维人格参数，一边回应一边在房间里做出互动动作。`,
    speech: `听到了呢！「${userPrompt.slice(0, 18)}${userPrompt.length > 18 ? '...' : ''}」这件事交给我们两个一起搞定！毕竟——${catchphrase}`,
    mood: 'happy',
    actions: [
      { type: 'emote', value: 'heart' },
      { type: 'walk_to', target: hasDesk ? 'desk' : 'center' },
      { type: 'sit' },
    ],
    new_memory: `与主人探讨了「${userPrompt.slice(0, 20)}」，情感羁绊加深。`,
    source: 'heuristic_engine',
  };
}

// ============================================================================
// AI 像素造物工坊：根据自然语言一键生成 12x12 专属像素物品矩阵与配色
// ============================================================================

export function synthesizeAIPixelItem(promptText: string): {
  name: string;
  matrix: number[][];
  palette: string[];
  description: string;
} {
  const cleanName = promptText
    .replace(/^(送他|送她|生成|制作|一个|一台|一盆|一杯|专属)/g, '')
    .trim()
    .slice(0, 10) || '赛博能量核心';

  const lower = promptText.toLowerCase();

  // 1. 游戏机/红白机/电脑类
  if (lower.includes('游戏') || lower.includes('红白机') || lower.includes('switch') || lower.includes('机')) {
    return {
      name: cleanName,
      palette: ['transparent', '#ef4444', '#f8fafc', '#334155', '#38bdf8', '#fbbf24'],
      description: `由 AI 像素工坊根据「${promptText}」实时合成的复古定制硬件，小人看到后好感度 +25！`,
      matrix: [
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,1,0],
        [0,1,2,4,4,4,4,4,4,2,1,0],
        [0,1,2,4,5,4,4,5,4,2,1,0],
        [0,1,2,4,4,4,4,4,4,2,1,0],
        [0,1,2,2,2,2,2,2,2,2,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,2,3,2,2,2,1,5,2,1,0],
        [0,1,3,3,3,2,1,2,2,2,1,0],
        [0,1,2,3,2,2,2,2,2,2,1,0],
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,3,3,0,0,3,3,0,0,0],
      ],
    };
  }

  // 2. 猫咪/宠物/玩偶类
  if (lower.includes('猫') || lower.includes('狗') || lower.includes('宠') || lower.includes('兔') || lower.includes('偶')) {
    return {
      name: cleanName,
      palette: ['transparent', '#fb923c', '#fed7aa', '#1e293b', '#f43f5e', '#38bdf8'],
      description: `由 AI 像素工坊根据「${promptText}」生成的治愈像素萌物，会陪着赛博分身一起看窗外！`,
      matrix: [
        [0,1,1,0,0,0,0,0,0,1,1,0],
        [0,1,4,1,0,0,0,0,1,4,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,2,1,1,1,1,1,1,2,1,1],
        [1,1,3,1,1,1,1,1,1,3,1,1],
        [1,1,1,1,1,4,4,1,1,1,1,1],
        [0,1,2,2,1,1,1,1,2,2,1,0],
        [0,0,1,5,5,5,5,5,5,1,0,0],
        [0,0,1,1,2,2,2,2,1,1,0,0],
        [0,1,1,1,2,2,2,2,1,1,1,0],
        [0,1,1,0,1,1,1,1,0,1,1,0],
        [0,0,0,0,2,2,2,2,0,0,0,0],
      ],
    };
  }

  // 3. 咖啡/奶茶/蛋糕/美食类
  if (lower.includes('咖啡') || lower.includes('茶') || lower.includes('蛋糕') || lower.includes('可乐') || lower.includes('吃')) {
    return {
      name: cleanName,
      palette: ['transparent', '#f43f5e', '#fef08a', '#78350f', '#f8fafc', '#38bdf8'],
      description: `由 AI 像素工坊合成的美味像素下午茶「${cleanName}」，香气四溢！`,
      matrix: [
        [0,0,0,0,5,0,5,0,0,0,0,0],
        [0,0,0,5,0,5,0,0,0,0,0,0],
        [0,0,4,4,4,4,4,4,4,0,0,0],
        [0,0,4,3,3,3,3,3,4,4,0,0],
        [0,0,4,3,2,3,3,3,4,0,4,0],
        [0,0,4,1,1,1,1,1,4,0,4,0],
        [0,0,4,3,3,3,3,3,4,4,0,0],
        [0,0,4,3,3,3,3,3,4,0,0,0],
        [0,0,0,4,4,4,4,4,0,0,0,0],
        [0,4,4,4,4,4,4,4,4,4,0,0],
        [0,0,4,4,4,4,4,4,4,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0],
      ],
    };
  }

  // 4. 默认通用：发光赛博水晶/爱心全息摆件
  return {
    name: cleanName,
    palette: ['transparent', '#22d3ee', '#a855f7', '#f472b6', '#f8fafc', '#facc15'],
    description: `由 AI 像素工坊根据「${promptText}」合成的 32-Bit 全息像素艺术孤品！`,
    matrix: [
      [0,0,0,0,0,5,5,0,0,0,0,0],
      [0,0,3,3,0,5,5,0,3,3,0,0],
      [0,3,4,3,3,1,1,3,3,4,3,0],
      [0,3,3,3,1,4,4,1,3,3,3,0],
      [0,3,3,1,4,1,1,4,1,3,3,0],
      [0,0,3,1,1,2,2,1,1,3,0,0],
      [0,0,0,3,1,2,2,1,3,0,0,0],
      [0,0,0,0,3,1,1,3,0,0,0,0],
      [0,0,0,0,0,3,3,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
    ],
  };
}
