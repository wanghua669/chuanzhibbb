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
        const json = JSON.parse(content);
        if (json.posts && Array.isArray(json.posts)) {
          setPostsText(json.posts.join('\n'));
        }
        if (json.notes && Array.isArray(json.notes)) {
          setNotesText(json.notes.join('\n'));
        }
        if (json.bio) setBio(json.bio);
      } catch {
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
    }, 700);
  };

  const radarItems: { key: keyof SixDimPersonaRadar; label: string; color: string }[] = [
    { key: 'empathy', label: '共情温度', color: 'bg-[#E07A5F]' },
    { key: 'rationality', label: '逻辑理性', color: 'bg-[#4A90E2]' },
    { key: 'creativity', label: '脑洞创造', color: 'bg-[#9B6B9E]' },
    { key: 'discipline', label: '自律规划', color: 'bg-[#6B9E78]' },
    { key: 'extraversion', label: '表达活力', color: 'bg-[#E6A145]' },
    { key: 'humor', label: '治愈幽默', color: 'bg-[#D96B7B]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2E24]/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border-2 border-[#D4B895] bg-[#FFFDF9] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EDE0D0] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E07A5F] border border-[#F4A28C]">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#4A3525] flex items-center gap-2">
                Persona Forge · 个人数据驱动的成长型赛博分身工坊
                <span className="rounded-full bg-[#E8F3EA] px-2.5 py-0.5 text-xs font-bold text-[#2F6B40] border border-[#6B9E78]/30">
                  灵魂语料注入
                </span>
              </h2>
              <p className="text-xs text-[#8A725E]">
                导入或编辑您的个人日常发言语料、读书笔记与习惯，自动提炼六维人格画像、专属口头禅与长期记忆
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8A725E] hover:bg-[#F5EBE0] hover:text-[#4A3525] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C4028] flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#E07A5F]" />
              快速切换官方数据集分身原型（或上传本地 TXT / JSON / Markdown 个人语料文件）：
            </span>
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#E07A5F] bg-[#FFF0EB] px-3 py-1 text-xs font-bold text-[#B84A2E] hover:bg-[#FDE2D9] transition">
              <Upload className="h-3.5 w-3.5" />
              上传本地个人语料 (.txt/.json/.md)
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
                  className={`text-left rounded-xl border-2 p-3 transition ${
                    active
                      ? 'border-[#E07A5F] bg-[#FFF7F2] shadow-sm'
                      : 'border-[#E2D0BA] bg-[#FAF4EB] hover:border-[#D4B895]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#4A3525]">{preset.name}</span>
                    <span className="rounded-md bg-[#E07A5F] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Lv.{preset.level}
                    </span>
                  </div>
                  <div className="text-xs text-[#8A725E] mt-0.5">{preset.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.catchphrases.slice(0, 2).map((cp, i) => (
                      <span
                        key={i}
                        className="rounded bg-[#FFFDF9] px-1.5 py-0.5 text-[10px] text-[#6E4F35] border border-[#E2D0BA]"
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

        <form onSubmit={handleForge} className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-7 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#5C4028] block mb-1">
                  分身昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3 py-1.5 text-sm font-bold text-[#4A3525] focus:border-[#E07A5F] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5C4028] block mb-1">
                  伴生定位头衔
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3 py-1.5 text-sm text-[#4A3525] focus:border-[#E07A5F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5C4028] block mb-1">
                个人作息习惯与性格基底描述 (Bio Dataset)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3 py-1.5 text-xs text-[#4A3525] focus:border-[#E07A5F] focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#B84A2E] mb-1">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                投喂个人日常发言 / 聊天语料样本（每行一条，用于提取语言风格与高频口头禅）
              </label>
              <textarea
                rows={4}
                value={postsText}
                onChange={(e) => setPostsText(e.target.value)}
                className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] p-2.5 text-xs text-[#4A3525] leading-relaxed focus:border-[#E07A5F] focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#2F6B40] mb-1">
                <FileText className="h-3.5 w-3.5" />
                投喂学习笔记 / 备忘录碎片（每行一条，用于构建分身知识图谱与长期记忆）
              </label>
              <textarea
                rows={3}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] p-2.5 text-xs text-[#4A3525] leading-relaxed focus:border-[#E07A5F] focus:outline-none"
              />
            </div>
          </div>

          <div className="col-span-5 flex flex-col justify-between rounded-xl border border-[#E2D0BA] bg-[#FAF4EB] p-4">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2D0BA] pb-2.5">
                <span className="text-xs font-extrabold text-[#4A3525] flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-[#E07A5F]" />
                  数据解析：六维赛博人格画像
                </span>
                <span className="text-xs text-[#E07A5F] font-mono font-bold">
                  Lv.{currentPersona.level} ({currentPersona.exp}/100 EXP)
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {radarItems.map((item) => {
                  const val = currentPersona.radar[item.key];
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#5C4028]">{item.label}</span>
                        <span className="font-mono font-bold text-[#4A3525]">{val} / 100</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E6D7C3] overflow-hidden">
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
                <div className="text-xs font-bold text-[#5C4028] mb-1.5">
                  从语料自动提取的专属口头禅标签：
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentPersona.catchphrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-[#FFFDF9] border border-[#D4B895] px-2 py-0.5 text-xs font-semibold text-[#B84A2E]"
                    >
                      #{phrase}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2D0BA] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#D4B895] px-4 py-2 text-xs font-bold text-[#6E4F35] hover:bg-[#EFE4D4] transition"
              >
                关闭
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-[#E07A5F] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#D0694E] transition"
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
