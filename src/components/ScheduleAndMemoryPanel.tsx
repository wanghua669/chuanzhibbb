import React, { useState } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Brain,
  Plus,
  Sparkles,
  Footprints,
} from 'lucide-react';
import { PersonaProfile, ScheduleItem, SixDimPersonaRadar } from '../types/cyber';

interface ScheduleAndMemoryPanelProps {
  persona: PersonaProfile;
  kickingTaskId: string | null;
  onToggleTaskComplete: (taskId: string) => void;
  onResolveConflict: (taskId: string) => void;
  onAddScheduleItem: (title: string, timeRange: string) => void;
  onCommandAvatarKickOverdue: () => void;
}

export const ScheduleAndMemoryPanel: React.FC<ScheduleAndMemoryPanelProps> = ({
  persona,
  kickingTaskId,
  onToggleTaskComplete,
  onResolveConflict,
  onAddScheduleItem,
  onCommandAvatarKickOverdue,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('16:30 - 17:30');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddScheduleItem(newTaskTitle.trim(), newTaskTime.trim() || '待定时间');
    setNewTaskTitle('');
  };

  const radarLabels: { key: keyof SixDimPersonaRadar; name: string; color: string }[] = [
    { key: 'empathy', name: '共情', color: 'text-rose-400' },
    { key: 'rationality', name: '理性', color: 'text-cyan-400' },
    { key: 'creativity', name: '创造', color: 'text-purple-400' },
    { key: 'discipline', name: '自律', color: 'text-emerald-400' },
    { key: 'extraversion', name: '活力', color: 'text-amber-400' },
    { key: 'humor', name: '幽默', color: 'text-pink-400' },
  ];

  return (
    <div className="space-y-4">
      {/* 模块一：打破第四面墙 —— 可被赛博小人抓取/踢醒的自适应日程看板 */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              跨界交互日程看板
            </h3>
            <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] text-rose-300">
              前端DOM物理碰撞 · 安全隔离后端
            </span>
          </div>
          <button
            type="button"
            onClick={onCommandAvatarKickOverdue}
            className="flex items-center gap-1 rounded-xl bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 transition"
            title="让小人从左侧房间跑到右侧边缘踢醒逾期卡片"
          >
            <Footprints className="h-3.5 w-3.5" />
            让小人踢醒逾期项
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          {persona.corpus.schedule.map((item: ScheduleItem) => {
            const isBeingKicked = kickingTaskId === item.id;
            return (
              <div
                key={item.id}
                className={`relative rounded-xl border p-3 transition-all ${
                  isBeingKicked ? 'animate-ui-kick ring-2 ring-amber-400 bg-amber-950/40' : ''
                } ${
                  item.status === 'overdue'
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : item.status === 'conflict'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : item.status === 'completed'
                    ? 'border-slate-800 bg-slate-950/40 opacity-60'
                    : 'border-slate-800 bg-slate-950/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(item.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          item.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                    </button>
                    <div>
                      <div
                        className={`text-xs font-semibold ${
                          item.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="font-mono text-slate-400">{item.timeRange}</span>
                        {item.status === 'overdue' && (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300 font-medium">
                            ⚠️ 已逾期 (小人重点盯防)
                          </span>
                        )}
                        {item.status === 'conflict' && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300 font-medium">
                            ⚡ 日程冲突
                          </span>
                        )}
                        {(item.kickedCount || 0) > 0 && (
                          <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 text-cyan-300">
                            👟 已被小人踢醒 {item.kickedCount} 次
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 自适应日程冲突调解建议 */}
                {item.status === 'conflict' && item.conflictHint && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 text-[11px] text-amber-200">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      {item.conflictHint}
                    </span>
                    <button
                      type="button"
                      onClick={() => onResolveConflict(item.id)}
                      className="shrink-0 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-950 hover:bg-amber-300 transition"
                    >
                      AI一键消解冲突
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 快速新增待办 */}
        <form onSubmit={handleAdd} className="mt-3 flex gap-1.5">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="新增日程待办（如：复习算法笔记）..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="text"
            value={newTaskTime}
            onChange={(e) => setNewTaskTime(e.target.value)}
            className="w-24 rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 text-center font-mono text-[11px] text-slate-300 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* 模块二：赛博分身六维画像与斯坦福 Memory Stream 记忆晶球流 */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">分身数据画像 & 记忆晶球流</h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-300">
            EXP {persona.exp}/100 · 好感度 {persona.affection}
          </span>
        </div>

        {/* 六维人格小矩阵 */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {radarLabels.map((r) => (
            <div
              key={r.key}
              className="rounded-xl border border-slate-800/90 bg-slate-950/70 px-2.5 py-1.5 flex items-center justify-between"
            >
              <span className="text-[11px] text-slate-400">{r.name}</span>
              <span className={`font-mono text-xs font-bold ${r.color}`}>
                {persona.radar[r.key]}
              </span>
            </div>
          ))}
        </div>

        {/* 口头禅芯片 */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {persona.catchphrases.map((cp, idx) => (
            <span
              key={idx}
              className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-cyan-300"
            >
              “{cp}”
            </span>
          ))}
        </div>

        {/* Memory Stream 列表 */}
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
          {persona.memories.map((mem) => (
            <div
              key={mem.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1 text-purple-300 font-medium">
                  <Sparkles className="h-3 w-3" />
                  {mem.category === 'corpus'
                    ? '个人语料结晶'
                    : mem.category === 'milestone'
                    ? '成长里程碑'
                    : '伴生交互记忆'}
                </span>
                <span className="font-mono">{mem.timestamp}</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">{mem.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
