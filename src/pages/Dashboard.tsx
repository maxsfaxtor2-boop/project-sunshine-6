import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

// ─── Константы ───────────────────────────────────────────────────────────────

const TOOLS = [
  { id: "photo",     icon: "ImagePlus",  title: "Генерация фото",  desc: "Создай уникальное изображение по описанию",    badge: null,   active: true,  color: "blue"   },
  { id: "video",     icon: "Video",      title: "Генерация видео", desc: "Превращай идеи в видеоролики с ИИ",            badge: null,   active: true,  color: "purple" },
  { id: "animate",   icon: "Sparkles",   title: "Оживление фото",  desc: "Загрузи фото — ИИ добавит движение",          badge: null,   active: true,  color: "pink"   },
  { id: "templates", icon: "Layout",     title: "Шаблоны",         desc: "Баннеры и дизайн-материалы за секунды",        badge: null,   active: true,  color: "orange" },
  { id: "ads",       icon: "Megaphone",  title: "Реклама",         desc: "Рекламные визуалы под любую платформу",        badge: null,   active: true,  color: "green"  },
  { id: "chats",     icon: "Bot",        title: "ИИ-чаты",         desc: "5 лучших нейросетей в одном месте",           badge: null,   active: false, color: "cyan"   },
];

const AI_CHATS = [
  { name: "ChatGPT",   color: "#10a37f", url: "https://chat.openai.com"       },
  { name: "Claude",    color: "#da7756", url: "https://claude.ai"             },
  { name: "Gemini",    color: "#4285f4", url: "https://gemini.google.com"     },
  { name: "Grok",      color: "#ffffff", url: "https://grok.com"              },
  { name: "DeepSeek",  color: "#4d6bfe", url: "https://chat.deepseek.com"     },
];

const COLOR_MAP: Record<string, string> = {
  blue:   "border-blue-500/30   bg-blue-500/5   hover:border-blue-500/60",
  purple: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60",
  pink:   "border-pink-500/30   bg-pink-500/5   hover:border-pink-500/60",
  orange: "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60",
  green:  "border-green-500/30  bg-green-500/5  hover:border-green-500/60",
  cyan:   "border-cyan-500/30   bg-cyan-500/5   hover:border-cyan-500/60",
};

const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", pink: "text-pink-400",
  orange: "text-orange-400", green: "text-green-400", cyan: "text-cyan-400",
};

const TYPE_LABELS: Record<string, string> = {
  photo: "Фото", video: "Видео", animation: "Анимация",
  template: "Шаблон", ad: "Реклама",
};

const TYPE_ICONS: Record<string, string> = {
  photo: "Image", video: "Video", animation: "Sparkles",
  template: "Layout", ad: "Megaphone",
};

const TEMPLATE_SIZES = [
  { key: "banner", label: "Баннер 16:9" },
  { key: "square", label: "Квадрат 1:1" },
  { key: "story",  label: "Сторис 9:16" },
  { key: "vk",     label: "Обложка ВК"  },
];

const AD_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "vk",        label: "ВКонтакте" },
  { key: "facebook",  label: "Facebook"  },
  { key: "stories",   label: "Сторис"    },
  { key: "yandex",    label: "Яндекс"    },
];

// ─── Типы ────────────────────────────────────────────────────────────────────

interface Work {
  id: number; title: string; type: string;
  url: string; prompt: string; created_at: string;
}

type ModalType = "photo" | "video" | "animation" | "template" | "ad" | null;

// ─── Компонент результата ────────────────────────────────────────────────────

function GenResult({ url, title, prompt, isVideo, onAgain, onClose }: {
  url: string; title: string; prompt: string;
  isVideo: boolean; onAgain: () => void; onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      {isVideo
        ? <video src={url} controls autoPlay loop className="w-full rounded-sm max-h-64 bg-black" />
        : <img src={url} alt={title} className="w-full rounded-sm" />
      }
      {prompt && <p className="text-white/50 text-sm line-clamp-2">{prompt}</p>}
      <div className="flex gap-3">
        <button
          onClick={onAgain}
          className="flex-1 border border-white/10 hover:border-white/30 text-white/60 hover:text-white text-sm py-2.5 transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="RefreshCw" size={14} /> Создать ещё
        </button>
        <a
          href={url} download target="_blank" rel="noopener noreferrer"
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="Download" size={14} /> Скачать
        </a>
      </div>
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "photo" | "video" | "animation" | "template" | "ad">("all");

  const [modal, setModal] = useState<ModalType>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genResult, setGenResult] = useState<{ url: string; title: string; prompt: string; isVideo: boolean } | null>(null);

  // поля форм
  const [prompt, setPrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [animTitle, setAnimTitle] = useState("Оживлённое фото");
  const [animFile, setAnimFile] = useState<File | null>(null);
  const [animPreview, setAnimPreview] = useState<string>("");
  const [tmplDesc, setTmplDesc] = useState("");
  const [tmplSize, setTmplSize] = useState("banner");
  const [adProduct, setAdProduct] = useState("");
  const [adSlogan, setAdSlogan] = useState("");
  const [adPlatform, setAdPlatform] = useState("instagram");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("masyanya_user");
    if (!stored) { navigate("/login"); return; }
    try {
      const u = JSON.parse(stored);
      setUser(u);
      fetchWorks(u.id);
    } catch { navigate("/login"); }
  }, [navigate]);

  const fetchWorks = async (userId: number) => {
    setWorksLoading(true);
    const res = await fetch(`${func2url.works}?user_id=${userId}`);
    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    setWorks(data.works || []);
    setWorksLoading(false);
  };

  const openModal = (type: ModalType) => {
    setModal(type); setGenResult(null); setGenError("");
    setPrompt(""); setVideoPrompt(""); setAnimTitle("Оживлённое фото");
    setAnimFile(null); setAnimPreview(""); setTmplDesc("");
    setAdProduct(""); setAdSlogan("");
  };

  const closeModal = () => { if (!generating) setModal(null); };

  const handleToolClick = (id: string) => {
    if (id === "photo")     openModal("photo");
    if (id === "video")     openModal("video");
    if (id === "animate")   openModal("animation");
    if (id === "templates") openModal("template");
    if (id === "ads")       openModal("ad");
    if (id === "chats")     document.getElementById("ai-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const callGenerate = async (body: object) => {
    const res = await fetch(func2url["generate-image"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user!.id, ...body }),
    });
    const raw = await res.json();
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  };

  const afterSuccess = (data: { id: number; url: string; title: string; media: string }, prompt: string) => {
    const isVideo = data.media === "video";
    const workType = modal === "animation" ? "animation" : modal === "video" ? "video" : modal === "template" ? "template" : modal === "ad" ? "ad" : "photo";
    setGenResult({ url: data.url, title: data.title, prompt, isVideo });
    setWorks(prev => [{
      id: data.id, title: data.title, type: workType,
      url: data.url, prompt, created_at: new Date().toISOString(),
    }, ...prev]);
  };

  const handleGeneratePhoto = async () => {
    if (!prompt.trim() || !user) return;
    setGenerating(true); setGenError("");
    const data = await callGenerate({ type: "photo", prompt: prompt.trim(), title: prompt.trim().slice(0, 60) });
    if (data.success) afterSuccess(data, prompt.trim());
    else setGenError(data.error || "Что-то пошло не так");
    setGenerating(false);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || !user) return;
    setGenerating(true); setGenError("");
    const data = await callGenerate({ type: "video", prompt: videoPrompt.trim(), title: videoPrompt.trim().slice(0, 60) });
    if (data.success) afterSuccess(data, videoPrompt.trim());
    else setGenError(data.error || "Что-то пошло не так");
    setGenerating(false);
  };

  const handleAnimFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnimFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAnimPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerateAnimation = async () => {
    if (!animFile || !user) return;
    setGenerating(true); setGenError("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const b64 = dataUrl.split(",")[1];
      const data = await callGenerate({ type: "animation", image_b64: b64, title: animTitle });
      if (data.success) afterSuccess(data, "Оживление фото");
      else setGenError(data.error || "Что-то пошло не так");
      setGenerating(false);
    };
    reader.readAsDataURL(animFile);
  };

  const handleGenerateTemplate = async () => {
    if (!tmplDesc.trim() || !user) return;
    setGenerating(true); setGenError("");
    const data = await callGenerate({ type: "template", description: tmplDesc.trim(), size: tmplSize, title: tmplDesc.trim().slice(0, 60) });
    if (data.success) afterSuccess(data, tmplDesc.trim());
    else setGenError(data.error || "Что-то пошло не так");
    setGenerating(false);
  };

  const handleGenerateAd = async () => {
    if (!adProduct.trim() || !user) return;
    setGenerating(true); setGenError("");
    const data = await callGenerate({ type: "ad", product: adProduct.trim(), slogan: adSlogan.trim(), platform: adPlatform });
    if (data.success) afterSuccess(data, adProduct.trim());
    else setGenError(data.error || "Что-то пошло не так");
    setGenerating(false);
  };

  const handleLogout = () => { localStorage.removeItem("masyanya_user"); navigate("/"); };

  if (!user) return null;

  const filteredWorks = activeTab === "all" ? works : works.filter(w => w.type === activeTab);

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Шапка */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-white text-sm uppercase tracking-widest font-bold hover:text-blue-400 transition-colors">MASYANYA AI</a>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{user.name[0].toUpperCase()}</div>
            <span className="text-sm text-blue-200/80 hidden sm:block">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors text-xs uppercase tracking-wide">Выйти</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Приветствие */}
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
                {tool.active && tool.id !== "chats" && (
                  <span className={`absolute top-4 right-4 text-[10px] uppercase tracking-widest border px-2 py-0.5 ${ICON_COLOR_MAP[tool.color]} border-current opacity-60`}>
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

        {/* Галерея */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest text-blue-200/40">Мои работы</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/20">{works.length} работ</span>
              <button
                onClick={() => openModal("photo")}
                className="text-xs uppercase tracking-wide text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/60 px-3 py-1.5 transition-colors flex items-center gap-1.5"
              >
                <Icon name="Plus" size={12} /> Создать
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "photo", "video", "animation", "template", "ad"] as const).map((tab) => (
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
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-sm" />)}
            </div>
          ) : filteredWorks.length === 0 ? (
            <div
              className="border border-dashed border-blue-500/20 hover:border-blue-500/40 rounded-sm p-12 text-center cursor-pointer transition-colors group"
              onClick={() => openModal("photo")}
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
                  {work.type === "video" || work.type === "animation"
                    ? <video src={work.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted loop />
                    : <img src={work.url} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  }
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
              <a key={chat.name} href={chat.url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-5 group">
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
          <button onClick={() => navigate("/")} className="bg-blue-600 text-white text-xs uppercase tracking-wide px-6 py-2.5 hover:bg-blue-500 transition-colors flex-shrink-0">
            Улучшить тариф
          </button>
        </div>
      </div>

      {/* ══ Модалка: просмотр работы ══════════════════════════════════════════ */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedWork(null)}>
          <div className="relative max-w-2xl w-full bg-[#0a1628] border border-white/10 rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            {selectedWork.type === "video" || selectedWork.type === "animation"
              ? <video src={selectedWork.url} controls autoPlay loop className="w-full max-h-[60vh] bg-black" />
              : <img src={selectedWork.url} alt={selectedWork.title} className="w-full max-h-[60vh] object-contain" />
            }
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name={TYPE_ICONS[selectedWork.type] || "Image"} size={14} className="text-blue-400" />
                  <span className="text-xs uppercase tracking-widest text-blue-400">{TYPE_LABELS[selectedWork.type] || selectedWork.type}</span>
                </div>
                <span className="text-white/20 text-xs">{new Date(selectedWork.created_at).toLocaleDateString("ru-RU")}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{selectedWork.title}</h3>
              {selectedWork.prompt && <p className="text-white/40 text-xs mb-4">{selectedWork.prompt}</p>}
              <a href={selectedWork.url} download target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs uppercase tracking-wide px-4 py-2 transition-colors">
                <Icon name="Download" size={13} /> Скачать
              </a>
            </div>
            <button onClick={() => setSelectedWork(null)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors rounded-sm">
              <Icon name="X" size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ══ Модалки генерации ═════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="relative max-w-lg w-full bg-[#0a1628] border border-white/10 rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Заголовок */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name={TOOLS.find(t => t.id === (modal === "animation" ? "animate" : modal === "template" ? "templates" : modal === "ad" ? "ads" : modal))?.icon || "Sparkles"} size={20} className="text-blue-400" />
                <span className="text-white font-semibold">{TOOLS.find(t => t.id === (modal === "animation" ? "animate" : modal === "template" ? "templates" : modal === "ad" ? "ads" : modal))?.title}</span>
              </div>
              {!generating && <button onClick={closeModal} className="text-white/30 hover:text-white transition-colors"><Icon name="X" size={18} /></button>}
            </div>

            <div className="p-6">
              {genResult ? (
                <GenResult
                  {...genResult}
                  onAgain={() => { setGenResult(null); setGenError(""); }}
                  onClose={closeModal}
                />
              ) : (
                <>
                  {/* ── ФОТО ── */}
                  {modal === "photo" && (
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-white/40 block">Опиши что хочешь создать</label>
                      <textarea
                        value={prompt} onChange={e => setPrompt(e.target.value)}
                        placeholder="Закат над горами в стиле акварели, кот в скафандре на луне..."
                        rows={4} disabled={generating}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm p-4 resize-none transition-colors rounded-sm"
                        onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleGeneratePhoto(); }}
                      />
                    </div>
                  )}

                  {/* ── ВИДЕО ── */}
                  {modal === "video" && (
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-white/40 block">Опиши сцену для видео</label>
                      <textarea
                        value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                        placeholder="Волны на закате, камера медленно движется вперёд, золотой час..."
                        rows={4} disabled={generating}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm p-4 resize-none transition-colors rounded-sm"
                        onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleGenerateVideo(); }}
                      />
                      <p className="text-white/30 text-xs">Длительность ~6 секунд. Генерация занимает 1–2 минуты.</p>
                    </div>
                  )}

                  {/* ── АНИМАЦИЯ ── */}
                  {modal === "animation" && (
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-white/40 block">Загрузи фото для оживления</label>
                      <div
                        className="border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-sm p-8 text-center cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {animPreview
                          ? <img src={animPreview} alt="preview" className="max-h-40 mx-auto rounded-sm object-contain" />
                          : <>
                              <Icon name="Upload" size={32} className="text-white/20 mx-auto mb-2" />
                              <p className="text-white/40 text-sm">Нажми чтобы выбрать фото</p>
                              <p className="text-white/20 text-xs mt-1">JPG, PNG до 10 МБ</p>
                            </>
                        }
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAnimFile} />
                      {animFile && (
                        <input
                          value={animTitle} onChange={e => setAnimTitle(e.target.value)}
                          placeholder="Название работы"
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm px-4 py-2.5 transition-colors rounded-sm"
                        />
                      )}
                      <p className="text-white/30 text-xs">ИИ добавит плавное движение к твоему фото. ~30–60 секунд.</p>
                    </div>
                  )}

                  {/* ── ШАБЛОН ── */}
                  {modal === "template" && (
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-white/40 block">Опиши шаблон</label>
                      <textarea
                        value={tmplDesc} onChange={e => setTmplDesc(e.target.value)}
                        placeholder="Баннер для кафе с утренним кофе, тёплые тона, минимализм..."
                        rows={3} disabled={generating}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm p-4 resize-none transition-colors rounded-sm"
                      />
                      <div>
                        <label className="text-xs uppercase tracking-widest text-white/40 mb-2 block">Формат</label>
                        <div className="grid grid-cols-2 gap-2">
                          {TEMPLATE_SIZES.map(s => (
                            <button
                              key={s.key} onClick={() => setTmplSize(s.key)}
                              className={`text-xs py-2 border transition-colors ${tmplSize === s.key ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-white/10 text-white/40 hover:border-white/30"}`}
                            >{s.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── РЕКЛАМА ── */}
                  {modal === "ad" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-widest text-white/40 mb-2 block">Продукт или услуга</label>
                        <input
                          value={adProduct} onChange={e => setAdProduct(e.target.value)}
                          placeholder="Например: кофейня, кроссовки Nike, онлайн-курс по дизайну"
                          disabled={generating}
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm px-4 py-3 transition-colors rounded-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-widest text-white/40 mb-2 block">Слоган (необязательно)</label>
                        <input
                          value={adSlogan} onChange={e => setAdSlogan(e.target.value)}
                          placeholder="Просто сделай это"
                          disabled={generating}
                          className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 outline-none text-white placeholder-white/20 text-sm px-4 py-3 transition-colors rounded-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-widest text-white/40 mb-2 block">Платформа</label>
                        <div className="grid grid-cols-3 gap-2">
                          {AD_PLATFORMS.map(p => (
                            <button
                              key={p.key} onClick={() => setAdPlatform(p.key)}
                              className={`text-xs py-2 border transition-colors ${adPlatform === p.key ? "border-green-500 text-green-400 bg-green-500/10" : "border-white/10 text-white/40 hover:border-white/30"}`}
                            >{p.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ошибка */}
                  {genError && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
                      <Icon name="AlertCircle" size={14} /> {genError}
                    </div>
                  )}

                  {/* Кнопка */}
                  <button
                    onClick={
                      modal === "photo"     ? handleGeneratePhoto :
                      modal === "video"     ? handleGenerateVideo :
                      modal === "animation" ? handleGenerateAnimation :
                      modal === "template"  ? handleGenerateTemplate :
                      handleGenerateAd
                    }
                    disabled={generating || (
                      (modal === "photo"     && !prompt.trim()) ||
                      (modal === "video"     && !videoPrompt.trim()) ||
                      (modal === "animation" && !animFile) ||
                      (modal === "template"  && !tmplDesc.trim()) ||
                      (modal === "ad"        && !adProduct.trim())
                    )}
                    className="mt-5 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white text-sm uppercase tracking-wide py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    {generating
                      ? <><Icon name="Loader2" size={16} className="animate-spin" /> Генерирую...</>
                      : <><Icon name="Sparkles" size={16} /> Создать</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
