import React, { useState } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
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

  const radarLabels: { key: keyof SixDimPersonaRadar; name: string; color: string; bg: string }[] = [
    { key: 'empathy', name: '共情力', color: 'text-[#C84B31]', bg: 'bg-[#FFF0EB]' },
    { key: 'rationality', name: '逻辑力', color: 'text-[#2B6CB0]', bg: 'bg-[#EBF8FF]' },
    { key: 'creativity', name: '创造力', color: 'text-[#6B46C1]', bg: 'bg-[#FAF5FF]' },
    { key: 'discipline', name: '自律度', color: 'text-[#2F6B40]', bg: 'bg-[#E8F3EA]' },
    { key: 'extraversion', name: '活力度', color: 'text-[#B45309]', bg: 'bg-[#FEF3C7]' },
    { key: 'humor', name: '幽默感', color: 'text-[#9D174D]', bg: 'bg-[#FCE7F3]' },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 模块一：打破第四面墙 —— 原木软木板日程便签墙 */}
      <div className="rounded-2xl border-2 border-[#E2D0BA] bg-[#FFFDF9] p-3.5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between border-b border-[#EDE0D0] pb-2.5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#E07A5F]" />
            <h3 className="text-sm font-extrabold text-[#4A3525]">
              软木板伴学便签墙
            </h3>
            <span className="rounded-full bg-[#FAF3E8] border border-[#DFCBB2] px-2 py-0.5 text-[10px] font-bold text-[#7C5D41]">
              跨界DOM碰撞 · 不删后端
            </span>
          </div>
          <button
            type="button"
            onClick={onCommandAvatarKickOverdue}
            className="flex items-center gap-1 rounded-xl bg-[#E07A5F] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-[#D0694E] transition"
            title="让小人从左侧木屋跑过来踢醒逾期便签卡片"
          >
            <Footprints className="h-3.5 w-3.5" />
            让小人踢醒逾期便签
          </button>
        </div>

        <div className="mt-2.5 space-y-2 max-h-[245px] overflow-y-auto pr-1">
          {persona.corpus.schedule.map((item: ScheduleItem) => {
            const isBeingKicked = kickingTaskId === item.id;
            return (
              <div
                key={item.id}
                className={`relative rounded-xl border p-2.5 transition-all ${
                  isBeingKicked ? 'animate-ui-kick ring-2 ring-[#E07A5F] bg-[#FFF0EB]' : ''
                } ${
                  item.status === 'overdue'
                    ? 'border-[#F4A28C] bg-[#FFF7F5]'
                    : item.status === 'conflict'
                    ? 'border-[#F59E0B]/50 bg-[#FFFBEB]'
                    : item.status === 'completed'
                    ? 'border-[#E2D0BA] bg-[#FAF5EE] opacity-65'
                    : 'border-[#E2D0BA] bg-[#FAF4EB]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(item.id)}
                      className="mt-0.5 text-[#8A725E] hover:text-[#6B9E78] transition"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          item.status === 'completed' ? 'text-[#6B9E78]' : 'text-[#B09780]'
                        }`}
                      />
                    </button>
                    <div>
                      <div
                        className={`text-xs font-bold ${
                          item.status === 'completed'
                            ? 'line-through text-[#9C8570]'
                            : 'text-[#4A3525]'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-mono font-semibold text-[#7C5D41]">
                          {item.timeRange}
                        </span>
                        {item.status === 'overdue' && (
                          <span className="rounded-md bg-[#FDE2D9] px-1.5 py-0.5 text-[#B84A2E] font-bold">
                            📌 待办逾期
                          </span>
                        )}
                        {item.status === 'conflict' && (
                          <span className="rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[#92400E] font-bold">
                            ⚡ 时间重叠
                          </span>
                        )}
                        {(item.kickedCount || 0) > 0 && (
                          <span className="rounded-md bg-[#E8F3EA] border border-[#6B9E78]/30 px-1.5 py-0.5 text-[#2F6B40] font-bold">
                            👟 被小人踢醒 {item.kickedCount} 次
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {item.status === 'conflict' && item.conflictHint && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#FEF3C7]/80 border border-[#F59E0B]/40 px-2.5 py-1.5 text-[11px] text-[#92400E]">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
                      {item.conflictHint}
                    </span>
                    <button
                      type="button"
                      onClick={() => onResolveConflict(item.id)}
                      className="shrink-0 rounded-md bg-[#D97706] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#B45309] transition"
                    >
                      智能错峰调优
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAdd} className="mt-2.5 flex gap-1.5">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="贴一张新日程便签（如：阅读论文第3章）..."
            className="flex-1 rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3 py-1.5 text-xs text-[#4A3525] placeholder-[#9C8570] focus:border-[#E07A5F] focus:outline-none"
          />
          <input
            type="text"
            value={newTaskTime}
            onChange={(e) => setNewTaskTime(e.target.value)}
            className="w-24 rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-2 py-1.5 text-center font-mono text-[11px] text-[#5C4028] focus:border-[#E07A5F] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#6B9E78] px-2.5 py-1.5 text-xs font-bold text-white hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* 模块二：分身六维画像与斯坦福 Memory Stream 温暖记忆匣 */}
      <div className="rounded-2xl border-2 border-[#E2D0BA] bg-[#FFFDF9] p-3.5 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-[#EDE0D0] pb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#6B9E78]" />
            <h3 className="text-sm font-extrabold text-[#4A3525]">
              分身六维人格 & 斯坦福记忆流
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#B07D54]">
            EXP {persona.exp}/100 · 羁绊 {persona.affection}
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {radarLabels.map((r) => (
            <div
              key={r.key}
              className={`rounded-xl border border-[#E2D0BA] ${r.bg} px-2.5 py-1.5 flex items-center justify-between`}
            >
              <span className="text-[11px] font-bold text-[#5C4028]">{r.name}</span>
              <span className={`font-mono text-xs font-extrabold ${r.color}`}>
                {persona.radar[r.key]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {persona.catchphrases.map((cp, idx) => (
            <span
              key={idx}
              className="rounded-lg bg-[#FAF3E8] border border-[#DFCBB2] px-2 py-0.5 text-[10px] font-semibold text-[#6E4F35]"
            >
              “{cp}”
            </span>
          ))}
        </div>

        <div className="mt-2.5 space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-40">
          {persona.memories.map((mem) => (
            <div
              key={mem.id}
              className="rounded-xl border border-[#EDE0D0] bg-[#FAF4EB] p-2 text-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8A725E] mb-0.5">
                <span className="flex items-center gap-1 text-[#E07A5F] font-bold">
                  <Sparkles className="h-3 w-3" />
                  {mem.category === 'corpus'
                    ? '个人语料印象'
                    : mem.category === 'milestone'
                    ? '成长里程碑'
                    : '温暖陪伴记忆'}
                </span>
                <span className="font-mono">{mem.timestamp}</span>
              </div>
              <p className="text-[#4A3525] text-[11px] leading-relaxed">{mem.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
