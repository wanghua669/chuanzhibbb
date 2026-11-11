import React, { useState } from 'react';
import { Key, Server, Cpu, Eye, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { LLMConfig } from '../types/cyber';
import { isCloudApiKeyConfigured } from '../services/llmBrain';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSave: (newCfg: LLMConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [form, setForm] = useState<LLMConfig>(config);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const isCloudReady = isCloudApiKeyConfigured(form);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 650);
  };

  const applyPresetProvider = (provider: 'deepseek' | 'qwen' | 'openai' | 'siliconflow') => {
    if (provider === 'deepseek') {
      setForm({
        ...form,
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
      });
    } else if (provider === 'qwen') {
      setForm({
        ...form,
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
      });
    } else if (provider === 'openai') {
      setForm({
        ...form,
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      });
    } else if (provider === 'siliconflow') {
      setForm({
        ...form,
        baseUrl: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-950/50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                赛博大脑 API 密钥配置中心
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-500/30">
                  双模自适应
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                预留标准 OpenAI 兼容接口（密钥仅保存在您的浏览器本地，绝不上传代码库）
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

        {/* 当前引擎状态指示栏 */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {isCloudReady ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            )}
            <div className="text-xs">
              <div className="font-semibold text-slate-200">
                {isCloudReady
                  ? '已激活：云端大模型 Function Calling 实时驱动'
                  : '当前运行：本地高拟真启发式分身大脑（零API Key离线可用）'}
              </div>
              <div className="text-slate-400 mt-0.5">
                {isCloudReady
                  ? `当前目标模型：${form.model} (${form.baseUrl})`
                  : '您可以随时在下方填入 API Key 切换至云端大模型，留空则继续使用内置认知引擎'}
              </div>
            </div>
          </div>
        </div>

        {/* 快捷服务商预设 */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-400 block mb-2">
            一键套用主流大模型接口规范：
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'deepseek', label: 'DeepSeek 官方' },
              { id: 'qwen', label: '通义千问 Qwen' },
              { id: 'siliconflow', label: '硅基流动 Silicon' },
              { id: 'openai', label: 'OpenAI GPT-4o' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyPresetProvider(item.id as 'deepseek' | 'qwen' | 'openai' | 'siliconflow')}
                className="rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
              <Key className="h-3.5 w-3.5 text-cyan-400" />
              大模型 API Key (预留填写，留空自动使用离线分身引擎)
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-... (在此填入您的 DeepSeek / Qwen / OpenAI API Key)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                API Base URL
              </label>
              <input
                type="text"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://api.deepseek.com/v1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                模型名称 (Model ID)
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="deepseek-chat"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 视觉多模态与自主心跳设置 */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-950/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                开启 Heartbeat 自主意识心跳（小人闲暇时自动打工、喝可乐、巡逻日程）
              </span>
              <input
                type="checkbox"
                checked={form.enableAutoHeartbeat}
                onChange={(e) => setForm({ ...form, enableAutoHeartbeat: e.target.checked })}
                className="h-4 w-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>自主思考心跳间隔（秒）：</span>
              <input
                type="number"
                min={10}
                max={120}
                value={form.heartbeatIntervalSec}
                onChange={(e) =>
                  setForm({ ...form, heartbeatIntervalSec: Math.max(10, Number(e.target.value) || 25) })
                }
                className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-center text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              <span>支持随时清空重置，配置即时生效</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition"
              >
                {savedToast ? '✓ 已保存生效' : '保存大脑配置'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
