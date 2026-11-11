import React, { useState, useEffect } from 'react';
import {
  Database,
  Sparkles,
  FileText,
  MessageSquareQuote,
  Upload,
  Check,
  X,
  UserCheck,
  BrainCircuit,
} from 'lucide-react';
import { PersonaProfile, SixDimPersonaRadar } from '../types/cyber';
import { PRESET_PERSONAS, analyzeCorpusAndRebuildPersona } from '../services/personaForge';

interface PersonaForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: PersonaProfile;
  onSelectOrUpdatePersona: (nextPersona: PersonaProfile) => void;
}

export const PersonaForgeModal: React.FC<PersonaForgeModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSelectOrUpdatePersona,
}) => {
  const [name, setName] = useState(currentPersona.name);
  const [title, setTitle] = useState(currentPersona.title);
  const [bio, setBio] = useState(currentPersona.corpus.dailyBio);
  const [postsText, setPostsText] = useState(currentPersona.corpus.rawSocialPosts.join('\n'));
  const [notesText, setNotesText] = useState(currentPersona.corpus.rawNotes.join('\n'));
  const [forgedSuccess, setForgedSuccess] = useState(false);

  useEffect(() => {
    setName(currentPersona.name);
    setTitle(currentPersona.title);
    setBio(currentPersona.corpus.dailyBio);
    setPostsText(currentPersona.corpus.rawSocialPosts.join('\n'));
    setNotesText(currentPersona.corpus.rawNotes.join('\n'));
  }, [currentPersona]);

  if (!isOpen) return null;

  const handleLoadPreset = (preset: PersonaProfile) => {
    onSelectOrUpdatePersona(preset);
    setName(preset.name);
    setTitle(preset.title);
    setBio(preset.corpus.dailyBio);
    setPostsText(preset.corpus.rawSocialPosts.join('\n'));
    setNotesText(preset.corpus.rawNotes.join('\n'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      try {
        // 尝试解析 JSON 格式语料包
        const json = JSON.parse(content);
        if (json.posts && Array.isArray(json.posts)) {
          setPostsText(json.posts.join('\n'));
        }
        if (json.notes && Array.isArray(json.notes)) {
          setNotesText(json.notes.join('\n'));
        }
        if (json.bio) setBio(json.bio);
      } catch {
        // 普通 TXT / Markdown / CSV 文本直接追加到日常语料与笔记中
        const lines = content
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 3);
        setPostsText((prev) => [...lines.slice(0, 12), prev].join('\n'));
      }
    };
    reader.readAsText(file);
  };

  const handleForge = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = analyzeCorpusAndRebuildPersona(
      { ...currentPersona, name, title },
      postsText,
      notesText,
      bio
    );
    onSelectOrUpdatePersona(updated);
    setForgedSuccess(true);
    setTimeout(() => {
      setForgedSuccess(false);
      onClose();
    }, 800);
  };

  const radarItems: { key: keyof SixDimPersonaRadar; label: string; color: string }[] = [
    { key: 'empathy', label: '共情温度', color: 'bg-rose-400' },
    { key: 'rationality', label: '逻辑理性', color: 'bg-cyan-400' },
    { key: 'creativity', label: '脑洞创造', color: 'bg-purple-400' },
    { key: 'discipline', label: '自律规划', color: 'bg-emerald-400' },
    { key: 'extraversion', label: '表达活力', color: 'bg-amber-400' },
    { key: 'humor', label: '赛博幽默', color: 'bg-pink-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Persona Forge · 个人数据驱动的赛博分身构建器
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300 border border-purple-500/30">
                  成长型数字孪生灵魂注入
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                导入或编辑您的个人日常发言语料、读书笔记与习惯，系统将自动提取六维人格画像、专属口头禅与长期记忆晶球
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 预设数字分身模板切换 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-cyan-400" />
              快速切换官方数据集分身原型（或导入本地 TXT / JSON / Markdown 个人语料文件）：
            </span>
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition">
              <Upload className="h-3.5 w-3.5" />
              导入本地语料/笔记文件 (.txt/.json/.md)
              <input
                type="file"
                accept=".txt,.json,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PRESET_PERSONAS.map((preset) => {
              const active = preset.id === currentPersona.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className={`text-left rounded-xl border p-3 transition ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{preset.name}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300">
                      Lv.{preset.level}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{preset.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.catchphrases.slice(0, 2).map((cp, i) => (
                      <span
                        key={i}
                        className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-800"
                      >
                        “{cp}”
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 主体双栏：左侧投喂个人数据，右侧实时预览六维画像与提取结果 */}
        <form onSubmit={handleForge} className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-7 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  分身昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  伴生定位头衔
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                个人作息习惯与性格基底描述 (Bio Dataset)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-cyan-300 mb-1">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                投喂个人日常发言 / 聊天语料样本（每行一条，用于提取语言风格与高频口头禅）
              </label>
              <textarea
                rows={4}
                value={postsText}
                onChange={(e) => setPostsText(e.target.value)}
                placeholder="在此粘贴您的朋友圈/微博/日常聊天记录..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 leading-relaxed focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-purple-300 mb-1">
                <FileText className="h-3.5 w-3.5" />
                投喂学习笔记 / 备忘录碎片（每行一条，用于构建分身知识图谱与长期记忆）
              </label>
              <textarea
                rows={3}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="在此粘贴您的读书笔记、代码心得或生活备忘..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 leading-relaxed focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 右侧：六维人格雷达与特征结晶面板 */}
          <div className="col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-cyan-400" />
                  数据解析：六维赛博人格画像
                </span>
                <span className="text-xs text-cyan-400 font-mono">
                  Lv.{currentPersona.level} ({currentPersona.exp}/100 EXP)
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {radarItems.map((item) => {
                  const val = currentPersona.radar[item.key];
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-mono font-semibold text-white">{val} / 100</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-300 mb-1.5">
                  从语料自动提取的专属口头禅标签：
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentPersona.catchphrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs text-cyan-300"
                    >
                      #{phrase}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                关闭
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition"
              >
                {forgedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    灵魂特征已注入 (+35 EXP)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    解析个人语料并进化分身灵魂
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
