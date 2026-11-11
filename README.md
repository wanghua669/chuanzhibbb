# CyberTwin Box（赛博伴生）—— 个人数据驱动的成长型赛博数字人分身与 2.5D 视差具身箱庭系统

> **参赛赛事**：全国高校 Vibe Coding 开发挑战赛（传智杯）  
> **核心融合赛道**：  
> - **选题方向 8（个人效能与赛博具身智能仿真）**：基于用户个人日常数据（社交发言语料、读书笔记、作息日程），构建具备成长型灵魂的数字孪生分身，支持自适应日程冲突调度与跨界前端 DOM 交互。  
> - **选题方向 9（数据探索与“赛博画像”可视化）**：大模型作为“高级决策器（大脑）”输出结构化动作指令（JSON Function Calling），驱动 2.5D 箱庭房间内的像素数字人自主走动、赛博打工、买可乐与回馈礼物。

---

## 一、 核心痛点与产品创新亮点

1. **个人数据驱动的成长型赛博分身（Persona Forge 数据熔炉）**
   - 告别只有一句空洞 Prompt 的传统桌宠。支持导入或实时编辑用户的 **日常发言语料、学习笔记碎片、作息习惯与日程表**（支持 `.txt` / `.json` / `.md` 一键上传）。
   - 自动提取 **六维赛博人格雷达画像**（共情、理性、创造、自律、活力、幽默）、高频 **专属口头禅** 以及借鉴 *Stanford Generative Agents* 的 **Memory Stream（记忆晶球流）**。
2. **“大脑决策 + 身体执行”解耦架构（LLM Brain-Body Protocol）**
   - **大脑层**：支持接入任意 OpenAI 兼容大模型（DeepSeek-V3 / 通义千问 Qwen / GPT-4o 等，界面右上角已预留可视化 API Key 配置中心），同時内置 **高拟真离线启发式认知引擎**——**即使暂不填写 API Key，也能 100% 离线流畅体验全部动作、对话与自主生态！**
   - **身体层**：基于 HTML5 Canvas 构建程序化像素分身状态机，支持 `walk_to`（走动寻路）、`work_code`（双屏电脑前敲代码打工）、`drink_cola`（买像素可乐喝）、`sleep`（睡眠舱充电冒 Zzz）、`interact_ui`（跨界踢翻逾期日程卡）、`play_music`（开启八音盒）等丰富动作帧与内部思维链（Inner Thought）可视化。
3. **前置摄像头“落地窗” & 裸眼 3D 视差玻璃房（Head-Coupled Perspective）**
   - 赛博小人就像住在凹进屏幕里的 2.5D 透明玻璃盒子里，前置摄像头是它观察外部真实世界的“落地窗”。
   - 实时计算面部/视角偏移 $(X, Y, Z)$，头往左偏视角往右倾斜；支持感知主人微笑、深度专注、疲惫揉眼（检测到疲惫时小人会主动走来安慰并打开 WebAudio 八音盒播放治愈音乐），无摄像头设备自动平滑降级为鼠标 3D 视差。
4. **从空白小屋到专属家园 + 好感度打工经济闭环**
   - 支持切换 **“空白小屋初始态”** 与 **自由拖拽摆放家具**（双屏极客工作台、云朵睡眠舱、霓虹快乐水售货机、治愈八音盒、复古街机等）。
   - **AI 像素造物工坊**：小人不能自己凭空生成物品，但主人可以输入自然语言（如“送他一台复古红白机”、“生成一只像素橘猫”），实时合成 32-Bit 像素物品空投到房间。
   - **Heartbeat 自主打工与回馈礼物**：闲暇时小人自主去电脑桌敲代码赚取“赛博币”，攒够钱会自己去售货机买可乐喝，还会用打工攒下的金币为主人撰写《观察主人手记》或绘制可下载的 `.PNG` 像素纪念壁纸。
5. **打破第四面墙：跨界操作软件前端模块（安全隔离后端）**
   - 当右侧看板存在逾期日程时，小人会跑到房间最右侧边缘飞起一脚“踢醒”前端任务卡片（触发物理震动与计数反馈，严格隔离后端删除操作，安全又有趣）。

---

## 二、 10 分钟极速复现指南 (Reproducibility Guide)

### 1. 环境要求
- **Node.js**：`>= 18.0.0`（推荐 `v20+` 或 `v22+`）
- **包管理器**：`npm`（随 Node.js 附带）
- **硬件要求**：纯 CPU 轻量 WebGL/Canvas 渲染，普通核显轻薄本即可满 60 FPS 丝滑运行。

### 2. 三步极速启动
```bash
# 第一步：克隆本仓库并进入目录
git clone https://github.com/wanghua669/chuanzhibbb.git
cd chuanzhibbb

# 第二步：安装依赖清单
npm install

# 第三步：启动本地开发服务器（默认端口 5173）
npm run dev
```

### 3. 环境变量与大模型 API Key 配置说明（预留可后填）
- **方式 A（图形界面随时填写，推荐）**：启动软件后，点击右上角 **「API密钥配置 (预留)」** 按钮，即可一键选择 DeepSeek / 通义千问 Qwen / 硅基流动 / OpenAI 预设并填入 API Key（保存在浏览器 `localStorage`，安全不泄露）。
- **方式 B（环境变量文件）**：复制根目录下的 `.env.example` 为 `.env`，按需填入 `VITE_LLM_API_KEY`。
- **零配置离线保障**：若暂未填写 API Key，系统将自动使用内置的「本地高拟真启发式分身认知引擎」，所有动作、造物、打工经济与跨界交互均 100% 正常运转。

---

## 三、 架构设计与 Vibe Coding 演进链路文档

为确保作品演进过程真实透明、可确定性复现，本项目提供完整的架构与 Prompt 演进文档：

- 📐 **系统顶层架构设计文档**：[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 🤖 **Vibe Coding 核心迭代 Prompt 链与演进记录**：[`docs/VIBE_CODING_PROMPTS.md`](docs/VIBE_CODING_PROMPTS.md)

### 项目目录结构
```text
├── docs/
│   ├── ARCHITECTURE.md            # 系统架构、状态机协议、2.5D视差数学模型说明
│   └── VIBE_CODING_PROMPTS.md     # 传智杯要求的核心功能迭代 Prompt 链与 Bug 修复记录
├── src/
│   ├── components/
│   │   ├── ApiConfigModal.tsx         # 赛博大脑 API Key 预留配置中心（双模自适应）
│   │   ├── CameraPerceptionBar.tsx    # 前置摄像头落地窗追踪与主人情绪感知栏
│   │   ├── CyberRoomCanvas.tsx        # 2.5D 裸眼3D视差房间渲染引擎与像素小人状态机
│   │   ├── HomeWorkshopPanel.tsx      # 家具拖拽图鉴、AI像素造物工坊与好感度打工回礼匣
│   │   ├── PersonaForgeModal.tsx      # 个人数据（语料/笔记/日程）投喂与六维人格锻造器
│   │   └── ScheduleAndMemoryPanel.tsx # 跨界DOM碰撞日程看板与斯坦福 Memory Stream 面板
│   ├── services/
│   │   ├── llmBrain.ts                # LLM Function Calling 网关 + 启发式认知引擎 + AI像素合成器
│   │   ├── personaForge.ts            # 多源个人语料解析器、预设分身数据集、家具与回礼图鉴
│   │   └── soundEngine.ts             # WebAudio 芯片级八音盒与金币/碰撞音效合成器
│   ├── types/
│   │   └── cyber.ts                   # 全局强类型领域模型定义
│   ├── App.tsx                        # 主应用容器与 Heartbeat 自主意识调度器
│   └── main.tsx                       # 应用入口
├── .env.example                       # 环境变量模板（预留大模型 API Key）
├── package.json                       # 依赖清单
└── vite.config.ts                     # Vite 构建配置
```
