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
    }, 600);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2E24]/45 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-[#D4B895] bg-[#FFFDF9] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EDE0D0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E07A5F] border border-[#F4A28C]">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#4A3525] flex items-center gap-2">
                赛博分身大脑 · API 密钥配置中心
                <span className="rounded-full bg-[#E8F3EA] px-2.5 py-0.5 text-xs font-bold text-[#2F6B40] border border-[#6B9E78]/30">
                  双模自适应
                </span>
              </h2>
              <p className="text-xs text-[#8A725E]">
                预留标准 OpenAI 兼容接口（密钥仅加密保存在本地客户端，绝不上传仓库）
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

        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E2D0BA] bg-[#FAF4EB] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {isCloudReady ? (
              <CheckCircle2 className="h-5 w-5 text-[#6B9E78] shrink-0" />
            ) : (
              <Sparkles className="h-5 w-5 text-[#D97706] shrink-0" />
            )}
            <div className="text-xs">
              <div className="font-bold text-[#4A3525]">
                {isCloudReady
                  ? '已激活：云端大模型 Function Calling 实时驱动'
                  : '当前运行：内置高拟真启发式分身大脑（零API Key离线可用）'}
              </div>
              <div className="text-[#8A725E] mt-0.5">
                {isCloudReady
                  ? `当前目标模型：${form.model} (${form.baseUrl})`
                  : '您可以随时在下方填入 API Key 切换至云端大模型，留空则继续使用内置认知引擎'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold text-[#6E4F35] block mb-2">
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
                className="rounded-xl border border-[#D4B895] bg-[#FAF3E8] px-2.5 py-1.5 text-xs font-bold text-[#5C4028] hover:border-[#E07A5F] hover:bg-[#FFF0EB] hover:text-[#E07A5F] transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#5C4028] mb-1">
              <Key className="h-3.5 w-3.5 text-[#E07A5F]" />
              大模型 API Key (预留后填，留空自动使用离线分身引擎)
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-... (在此填入您的 DeepSeek / Qwen / OpenAI API Key)"
              className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3.5 py-2 text-sm text-[#4A3525] placeholder-[#A68E78] focus:border-[#E07A5F] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#5C4028] mb-1">
                <Server className="h-3.5 w-3.5 text-[#E07A5F]" />
                API Base URL
              </label>
              <input
                type="text"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3 py-2 text-xs text-[#4A3525] focus:border-[#E07A5F] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#5C4028] mb-1">
                <Cpu className="h-3.5 w-3.5 text-[#E07A5F]" />
                模型名称 (Model ID)
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-xl border border-[#D4B895] bg-[#FAF4EB] px-3 py-2 text-xs text-[#4A3525] focus:border-[#E07A5F] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E2D0BA] bg-[#FAF4EB] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#5C4028]">
                <Eye className="h-3.5 w-3.5 text-[#6B9E78]" />
                开启 Heartbeat 自主意识心跳（小人闲暇时自动打工、喝汽水、巡逻便签）
              </span>
              <input
                type="checkbox"
                checked={form.enableAutoHeartbeat}
                onChange={(e) => setForm({ ...form, enableAutoHeartbeat: e.target.checked })}
                className="h-4 w-4 accent-[#E07A5F] rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#7C5D41]">
              <span>自主思考心跳间隔（秒）：</span>
              <input
                type="number"
                min={10}
                max={120}
                value={form.heartbeatIntervalSec}
                onChange={(e) =>
                  setForm({ ...form, heartbeatIntervalSec: Math.max(10, Number(e.target.value) || 25) })
                }
                className="w-20 rounded-lg border border-[#D4B895] bg-[#FFFDF9] px-2 py-1 text-center font-bold text-[#4A3525]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#8A725E]">
              <AlertCircle className="h-4 w-4 text-[#E07A5F]" />
              <span>支持随时修改，配置即时生效</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#D4B895] px-4 py-2 text-xs font-bold text-[#6E4F35] hover:bg-[#F5EBE0] transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#E07A5F] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#D0694E] transition"
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
