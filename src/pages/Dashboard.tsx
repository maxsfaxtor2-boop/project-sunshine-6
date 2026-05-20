import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

const TOOLS = [
  { id: "photo", icon: "ImagePlus", title: "Генерация фото", desc: "Создай уникальное изображение по описанию", badge: null, color: "blue" },
  { id: "video", icon: "Video", title: "Генерация видео", desc: "Превращай идеи в видеоролики с ИИ", badge: "Скоро", color: "purple" },
  { id: "animate", icon: "Sparkles", title: "Оживление фото", desc: "Добавь движение статичным фото", badge: "Скоро", color: "pink" },
  { id: "templates", icon: "Layout", title: "Шаблоны", desc: "Надписи, баннеры и рекламные материалы", badge: "Скоро", color: "orange" },
  { id: "ads", icon: "Megaphone", title: "Реклама", desc: "Шаблоны и модели для рекламщиков", badge: "Скоро", color: "green" },
  { id: "chats", icon: "Bot", title: "ИИ-чаты", desc: "5 лучших нейросетей в одном месте", badge: null, color: "cyan" },
];

const AI_CHATS = [
  { name: "ChatGPT", color: "#10a37f", url: "https://chat.openai.com" },
  { name: "Claude", color: "#da7756", url: "https://claude.ai" },
  { name: "Gemini", color: "#4285f4", url: "https://gemini.google.com" },
  { name: "Grok", color: "#ffffff", url: "https://grok.com" },
  { name: "DeepSeek", color: "#4d6bfe", url: "https://chat.deepseek.com" },
];

const COLOR_MAP: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60",
  purple: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60",
  pink: "border-pink-500/30 bg-pink-500/5 hover:border-pink-500/60",
  orange: "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60",
  green: "border-green-500/30 bg-green-500/5 hover:border-green-500/60",
  cyan: "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60",
};

const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", pink: "text-pink-400",
  orange: "text-orange-400", green: "text-green-400", cyan: "text-cyan-400",
};

const TYPE_LABELS: Record<string, string> = {
  photo: "Фото", video: "Видео", animation: "Анимация", template: "Шаблон",
};

const TYPE_ICONS: Record<string, string> = {
  photo: "Image", video: "Video", animation: "Sparkles", template: "Layout",
};

interface Work {
  id: number;
  title: string;
  type: string;
  url: string;
  prompt: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "photo" | "video" | "animation" | "template">("all");

  const [showGenerate, setShowGenerate] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genResult, setGenResult] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("masyanya_user");
    if (!stored) { navigate("/login"); return; }
    try {
      const u = JSON.parse(stored);
      setUser(u);
      fetchWorks(u.id);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchWorks = async (userId: number) => {
    setWorksLoading(true);
    const res = await fetch(`${func2url.works}?user_id=${userId}`);
    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    setWorks(data.works || []);
    setWorksLoading(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;
    setGenerating(true);
    setGenError("");
    setGenResult(null);
    const res = await fetch(func2url["generate-image"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, prompt: prompt.trim(), title: prompt.trim().slice(0, 60) }),
    });
    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (data.success) {
      setGenResult({ url: data.url, title: data.title });
      const newWork: Work = { id: data.id, title: data.title, type: "photo", url: data.url, prompt: prompt.trim(), created_at: new Date().toISOString() };
      setWorks(prev => [newWork, ...prev]);
    } else {
      setGenError(data.error || "Что-то пошло не так, попробуй ещё раз");
    }
    setGenerating(false);
  };

  const openGenerate = () => { setShowGenerate(true); setGenResult(null); setPrompt(""); setGenError(""); };

  const handleToolClick = (id: string) => {
    if (id === "photo") openGenerate();
    if (id === "chats") document.getElementById("ai-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("masyanya_user");
    navigate("/");
  };

  if (!user) return null;

  const filteredWorks = activeTab === "all" ? works : works.filter(w => w.type === activeTab);

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-white text-sm uppercase tracking-widest font-bold hover:text-blue-400 transition-colors">
          MASYANYA AI
        </a>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
              {user.name[0].toUpperCase()}
            </div>
            <span className="text-sm text-blue-200/80 hidden sm:block">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors text-xs uppercase tracking-wide">
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">Личный кабинет</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Привет, {user.name.split(" ")[0]}!</h1>
          <p className="text-blue-200/50 text-sm">Выбери инструмент и начни создавать с ИИ</p>
        </div>

        {/* Инструменты */}
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-widest text-blue-200/40 mb-6">Инструменты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                className={`relative border rounded-sm p-6 cursor-pointer transition-all duration-300 group ${COLOR_MAP[tool.color]}`}
                onClick={() => handleToolClick(tool.id)}
              >
                {tool.badge && (
                  <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-white/30 border border-white/10 px-2 py-0.5">
                    {tool.badge}
                  </span>
                )}
                {tool.id === "photo" && (
                  <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-blue-400 border border-blue-500/30 px-2 py-0.5">
                    Активно
                  </span>
                )}
                <Icon name={tool.icon} size={24} className={`mb-4 ${ICON_COLOR_MAP[tool.color]}`} />
                <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
                <p className="text-xs text-white/40">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Галерея работ */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest text-blue-200/40">Мои работы</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/20">{works.length} работ</span>
              <button
                onClick={openGenerate}
                className="text-xs uppercase tracking-wide text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/60 px-3 py-1.5 transition-colors flex items-center gap-1.5"
              >
                <Icon name="Plus" size={12} />
                Создать
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "photo", "video", "animation", "template"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs uppercase tracking-wide px-4 py-1.5 border transition-colors duration-200 ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-400 bg-blue-500/10"
                    : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
                }`}
              >
                {tab === "all" ? "Все" : TYPE_LABELS[tab]}
              </button>
            ))}
          </div>

          {worksLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : filteredWorks.length === 0 ? (
            <div
              className="border border-dashed border-blue-500/20 hover:border-blue-500/40 rounded-sm p-12 text-center cursor-pointer transition-colors group"
              onClick={openGenerate}
            >
              <Icon name="ImagePlus" size={32} className="text-blue-500/30 group-hover:text-blue-400/60 mx-auto mb-3 transition-colors" />
              <p className="text-white/40 text-sm">Здесь будут ваши созданные работы</p>
              <p className="text-blue-400/40 group-hover:text-blue-400/70 text-xs mt-2 transition-colors">Нажми, чтобы создать первое фото →</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredWorks.map((work) => (
                <div
                  key={work.id}
                  className="group relative aspect-square bg-white/5 border border-white/10 hover:border-blue-500/50 overflow-hidden cursor-pointer transition-all duration-300 rounded-sm"
                  onClick={() => setSelectedWork(work)}
                >
                  <img src={work.url} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon name={TYPE_ICONS[work.type] || "Image"} size={11} className="text-blue-400" />
                      <span className="text-[10px] uppercase tracking-widest text-blue-300">{TYPE_LABELS[work.type] || work.type}</span>
                    </div>
                    <p className="text-white text-xs font-medium truncate">{work.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ИИ-чаты */}
        <div id="ai-section" className="mb-12">
          <h2 className="text-xs uppercase tracking-widest text-blue-200/40 mb-6">5 лучших ИИ-чатов</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {AI_CHATS.map((chat) => (
              <a
                key={chat.name}
                href={chat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-5 group"
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chat.color }} />
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{chat.name}</span>
                <Icon name="ExternalLink" size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Тариф */}
        <div className="border border-blue-500/20 bg-blue-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400 mb-1">Ваш тариф</p>
            <p className="text-white font-semibold">Старт — Бесплатно</p>
            <p className="text-white/40 text-xs mt-1">5 фото и 1 видео в месяц</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white text-xs uppercase tracking-wide px-6 py-2.5 hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            Улучшить тариф
          </button>
        </div>
      </div>

      {/* Модалка: просмотр работы */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedWork(null)}>
          <div className="relative max-w-2xl w-full bg-[#0a1628] border border-white/10 rounded-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={selectedWork.url} alt={selectedWork.title} className="w-full max-h-[60vh] object-contain" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name={TYPE_ICONS[selectedWork.type] || "Image"} size={14} className="text-blue-400" />
                  <span className="text-xs uppercase tracking-widest text-blue-400">{TYPE_LABELS[selectedWork.type] || selectedWork.type}</span>
                </div>
                <span className="text-white/20 text-xs">{new Date(selectedWork.created_at).toLocaleDateString("ru-RU")}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{selectedWork.title}</h3>
              {selectedWork.prompt && <p className="text-white/40 text-xs">{selectedWork.prompt}</p>}
              <div className="mt-4 flex gap-3">
                <a
                  href={selectedWork.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase tracking-wide px-4 py-2 transition-colors"
                >
                  <Icon name="Download" size={13} />
                  Скачать
                </a>
              </div>
            </div>
            <button onClick={() => setSelectedWork(null)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors rounded-sm">
              <Icon name="X" size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Модалка: генерация фото */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !generating && setShowGenerate(false)}>
          <div className="relative max-w-lg w-full bg-[#0a1628] border border-white/10 rounded-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="ImagePlus" size={20} className="text-blue-400" />
                <span className="text-white font-semibold">Генерация фото</span>
              </div>
              {!generating && (
                <button onClick={() => setShowGenerate(false)} className="text-white/30 hover:text-white transition-colors">
                  <Icon name="X" size={18} />
                </button>
              )}
            </div>

            <div className="p-6">
              {!genResult ? (
                <>
                  <label className="text-xs uppercase tracking-widest text-white/40 mb-3 block">Опиши что хочешь создать</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Например: закат над горами в стиле акварели, кот в скафандре на луне, портрет девушки в стиле аниме..."
                    disabled={generating}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm p-4 resize-none transition-colors rounded-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
                  />
                  {genError && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
                      <Icon name="AlertCircle" size={14} />
                      {genError}
                    </div>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || generating}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white text-sm uppercase tracking-wide py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        Генерирую... ~15 секунд
                      </>
                    ) : (
                      <>
                        <Icon name="Sparkles" size={16} />
                        Создать фото
                      </>
                    )}
                  </button>
                  <p className="text-white/20 text-xs text-center mt-3">Ctrl+Enter для быстрого запуска</p>
                </>
              ) : (
                <>
                  <img src={genResult.url} alt={genResult.title} className="w-full rounded-sm mb-4" />
                  <p className="text-white/50 text-sm mb-4 line-clamp-2">{prompt}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setPrompt(""); setGenResult(null); setGenError(""); }}
                      className="flex-1 border border-white/10 hover:border-white/30 text-white/60 hover:text-white text-sm py-2.5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="RefreshCw" size={14} />
                      Создать ещё
                    </button>
                    <a
                      href={genResult.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="Download" size={14} />
                      Скачать
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
