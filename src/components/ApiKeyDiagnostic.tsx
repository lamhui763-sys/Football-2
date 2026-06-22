import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export const ApiKeyDiagnostic: React.FC = () => {
  const [status, setStatus] = useState<{ gemini: boolean; zhipu: boolean; dashscope: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/api-status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to check API key status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    check(); 
  }, []);

  if (loading || !status || (status.gemini && status.zhipu && status.dashscope)) {
    return null;
  }

  return (
    <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-200 text-xs my-4">
      <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-[10px]">
        <AlertTriangle size={14} className="text-red-500" />
        配置警告
      </div>
      <p>以下 API 金鑰缺失或尚未正確設定：</p>
      <ul className="list-disc ml-4 mt-1 space-y-0.5">
        {!status.gemini && <li>Gemini API Key</li>}
        {!status.zhipu && <li>Zhipu AI API Key</li>}
        {!status.dashscope && <li>阿里百煉 DashScope API Key (通義千問)</li>}
      </ul>
      <p className="mt-2 text-[10px] text-red-300/70">請至右上角 Secrets 面板添加對應金鑰名稱以解除在線限制。</p>
    </div>
  );
};
