import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";
import { TOOLS, AI_CHATS, COLOR_MAP, ICON_COLOR_MAP, Work, ModalType } from "./dashboard/DashboardConstants";
import WorksGallery from "./dashboard/WorksGallery";
import GenerateModal from "./dashboard/GenerateModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "photo" | "video" | "animation" | "template" | "ad">("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modal, setModal] = useState<ModalType>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingSeconds, setGeneratingSeconds] = useState(0);
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
  const [adVisual, setAdVisual] = useState("");
  const [adText, setAdText] = useState("");
  const [adPlatform, setAdPlatform] = useState("instagram");

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
    try {
      const res = await fetch(`${func2url.works}?user_id=${userId}`);
      const raw = await res.json();
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      setWorks(data.works || []);
    } catch {
      setWorks([]);
    }
    setWorksLoading(false);
  };

  const openModal = (type: ModalType) => {
    setMobileMenuOpen(false);
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
    if (id === "chats") {
      setMobileMenuOpen(false);
      setTimeout(() => document.getElementById("ai-section")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
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

  const afterSuccess = (data: { id: number; url: string; title: string; media: string }, usedPrompt: string) => {
    const isVideo = data.media === "video";
    const workType = modal === "animation" ? "animation" : modal === "video" ? "video" : modal === "template" ? "template" : modal === "ad" ? "ad" : "photo";
    setGenResult({ url: data.url, title: data.title, prompt: usedPrompt, isVideo });
    setWorks(prev => [{
      id: data.id, title: data.title, type: workType,
      url: data.url, prompt: usedPrompt, created_at: new Date().toISOString(),
    }, ...prev]);
  };

  const handleGeneratePhoto = async () => {
    if (!prompt.trim() || !user) return;
    setGenerating(true); setGenError("");
    try {
      const data = await callGenerate({ type: "photo", prompt: prompt.trim(), title: prompt.trim().slice(0, 60) });
      if (data.success) afterSuccess(data, prompt.trim());
      else setGenError(data.error || "Что-то пошло не так");
    } catch { setGenError("Ошибка соединения, попробуй ещё раз"); }
    setGenerating(false);
  };

  const pollUntilDone = async (requestId: string, endpoint: string, workType: "video" | "animation", title: string, usedPrompt: string) => {
    setGeneratingSeconds(0);
    const timer = setInterval(() => setGeneratingSeconds(s => s + 1), 1000);
    const maxAttempts = 120;
    try {
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const res = await fetch(func2url["generate-image"], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user!.id, action: "poll", type: workType, request_id: requestId, endpoint, title, prompt: usedPrompt }),
          });
          const raw = await res.json();
          const data = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (data.status === "COMPLETED") {
            afterSuccess(data, usedPrompt);
            return;
          }
          if (data.status === "FAILED") {
            setGenError(data.error || "Ошибка генерации");
            return;
          }
        } catch { /* продолжаем опрос */ }
      }
      setGenError("Превышено время ожидания. Попробуй ещё раз.");
    } finally {
      clearInterval(timer);
      setGenerating(false);
      setGeneratingSeconds(0);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || !user) return;
    setGenerating(true); setGenError("");
    try {
      const data = await callGenerate({ type: "video", prompt: videoPrompt.trim(), title: videoPrompt.trim().slice(0, 60) });
      if (data.status === "IN_QUEUE") {
        pollUntilDone(data.request_id, data.endpoint, "video", data.title, videoPrompt.trim());
      } else if (data.success) {
        afterSuccess(data, videoPrompt.trim());
        setGenerating(false);
      } else {
        setGenError(data.error || "Что-то пошло не так");
        setGenerating(false);
      }
    } catch { setGenError("Ошибка соединения, попробуй ещё раз"); setGenerating(false); }
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
    reader.onerror = () => { setGenError("Не удалось прочитать файл"); setGenerating(false); };
    reader.onload = async (ev) => {
      try {
        const dataUrl = ev.target?.result as string;
        const b64 = dataUrl.split(",")[1];
        const data = await callGenerate({ type: "animation", image_b64: b64, title: animTitle });
        if (data.status === "IN_QUEUE") {
          pollUntilDone(data.request_id, data.endpoint, "animation", data.title, "Оживление фото");
        } else if (data.success) {
          afterSuccess(data, "Оживление фото");
          setGenerating(false);
        } else {
          setGenError(data.error || "Что-то пошло не так");
          setGenerating(false);
        }
      } catch { setGenError("Ошибка соединения, попробуй ещё раз"); setGenerating(false); }
    };
    reader.readAsDataURL(animFile);
  };

  const handleGenerateTemplate = async () => {
    if (!tmplDesc.trim() || !user) return;
    setGenerating(true); setGenError("");
    try {
      const data = await callGenerate({ type: "template", description: tmplDesc.trim(), size: tmplSize, title: tmplDesc.trim().slice(0, 60) });
      if (data.success) afterSuccess(data, tmplDesc.trim());
      else setGenError(data.error || "Что-то пошло не так");
    } catch { setGenError("Ошибка соединения, попробуй ещё раз"); }
    setGenerating(false);
  };

  const handleGenerateAd = async () => {
    if (!adProduct.trim() || !user) return;
    setGenerating(true); setGenError("");
    try {
      const data = await callGenerate({ type: "ad", product: adProduct.trim(), visual: adVisual.trim(), slogan: adText.trim(), platform: adPlatform });
      if (data.success) afterSuccess(data, adProduct.trim());
      else setGenError(data.error || "Что-то пошло не так");
    } catch { setGenError("Ошибка соединения, попробуй ещё раз"); }
    setGenerating(false);
  };

  const handleLogout = () => { localStorage.removeItem("masyanya_user"); navigate("/"); };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020817] text-white">

      {/* ═══ ШАПКА ═══════════════════════════════════════════════════════════ */}
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 bg-[#020817]/95 backdrop-blur-sm">
        <a href="/" className="text-white text-sm uppercase tracking-widest font-bold hover:text-blue-400 transition-colors">MASYANYA AI</a>

        {/* Десктоп */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <span className="text-sm text-blue-200/80">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors text-xs uppercase tracking-wide">Выйти</button>
        </div>

        {/* Мобильный бургер */}
        <button
          className="sm:hidden flex items-center justify-center w-9 h-9 border border-white/10 rounded-sm text-white/60 hover:text-white hover:border-white/30 transition-colors"
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="Меню"
        >
          <Icon name={mobileMenuOpen ? "X" : "Menu"} size={18} />
        </button>
      </header>

      {/* Мобильное меню */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 top-[57px] z-30 bg-[#020817] overflow-y-auto">
          <div className="px-4 py-6 space-y-2">
            {/* Профиль */}
            <div className="flex items-center gap-3 p-4 border border-white/10 rounded-sm mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{user.name}</p>
                <p className="text-white/40 text-xs">{user.email}</p>
              </div>
            </div>

            <p className="text-xs uppercase tracking-widest text-white/30 px-1 pb-2">Инструменты</p>
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex items-center gap-4 p-4 border rounded-sm transition-all text-left active:scale-[0.98] ${COLOR_MAP[tool.color]}`}
              >
                <Icon name={tool.icon} size={20} className={`shrink-0 ${ICON_COLOR_MAP[tool.color]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{tool.title}</p>
                  <p className="text-white/40 text-xs truncate">{tool.desc}</p>
                </div>
                {tool.active && tool.id !== "chats" && (
                  <Icon name="ChevronRight" size={16} className={`shrink-0 ${ICON_COLOR_MAP[tool.color]} opacity-60`} />
                )}
              </button>
            ))}

            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 text-red-400/70 hover:text-red-400 active:text-red-300 transition-colors"
              >
                <Icon name="LogOut" size={18} className="shrink-0" />
                <span className="text-sm">Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Приветствие */}
        <div className="mb-8 sm:mb-12">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">Личный кабинет</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Привет, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-blue-200/50 text-sm">Выбери инструмент и начни создавать с ИИ</p>
        </div>

        {/* Десктоп: карточки инструментов */}
        <div className="hidden sm:block mb-12">
          <h2 className="text-xs uppercase tracking-widest text-blue-200/40 mb-6">Инструменты</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Мобиль: быстрые кнопки */}
        <div className="sm:hidden mb-8">
          <h2 className="text-xs uppercase tracking-widest text-blue-200/40 mb-4">Инструменты</h2>
          <div className="grid grid-cols-3 gap-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`flex flex-col items-center gap-2 py-4 px-2 border rounded-sm transition-all active:scale-95 ${COLOR_MAP[tool.color]}`}
              >
                <Icon name={tool.icon} size={24} className={ICON_COLOR_MAP[tool.color]} />
                <span className="text-[10px] text-white/70 text-center leading-tight">{tool.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Галерея */}
        <WorksGallery
          works={works}
          worksLoading={worksLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedWork={selectedWork}
          setSelectedWork={setSelectedWork}
          onCreateClick={() => openModal("photo")}
        />

        {/* ИИ-чаты */}
        <div id="ai-section" className="mb-8 sm:mb-12">
          <h2 className="text-xs uppercase tracking-widest text-blue-200/40 mb-4 sm:mb-6">5 лучших ИИ-чатов</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {AI_CHATS.map((chat) => (
              <a
                key={chat.name}
                href={chat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 sm:gap-3 border border-white/10 hover:border-white/30 hover:bg-white/5 active:bg-white/10 transition-all duration-200 p-3 sm:p-5 group"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: chat.color }} />
                <span className="text-xs sm:text-sm text-white/70 group-hover:text-white transition-colors text-center leading-tight">{chat.name}</span>
                <Icon name="ExternalLink" size={11} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Тариф */}
        <div className="border border-blue-500/20 bg-blue-500/5 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400 mb-1">Ваш тариф</p>
            <p className="text-white font-semibold">Старт — Бесплатно</p>
            <p className="text-white/40 text-xs mt-1">5 фото и 1 видео в месяц</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto bg-blue-600 text-white text-xs uppercase tracking-wide px-6 py-3 sm:py-2.5 hover:bg-blue-500 active:bg-blue-700 transition-colors"
          >
            Улучшить тариф
          </button>
        </div>

      </div>

      {/* Модалка генерации */}
      <GenerateModal
        modal={modal}
        generating={generating}
        generatingSeconds={generatingSeconds}
        genError={genError}
        genResult={genResult}
        onClose={closeModal}
        onAgain={() => { setGenResult(null); setGenError(""); }}
        prompt={prompt} setPrompt={setPrompt} handleGeneratePhoto={handleGeneratePhoto}
        videoPrompt={videoPrompt} setVideoPrompt={setVideoPrompt} handleGenerateVideo={handleGenerateVideo}
        animTitle={animTitle} setAnimTitle={setAnimTitle}
        animFile={animFile} animPreview={animPreview}
        handleAnimFile={handleAnimFile} handleGenerateAnimation={handleGenerateAnimation}
        tmplDesc={tmplDesc} setTmplDesc={setTmplDesc}
        tmplSize={tmplSize} setTmplSize={setTmplSize} handleGenerateTemplate={handleGenerateTemplate}
        adProduct={adProduct} setAdProduct={setAdProduct}
        adVisual={adVisual} setAdVisual={setAdVisual}
        adText={adText} setAdText={setAdText}
        adPlatform={adPlatform} setAdPlatform={setAdPlatform} handleGenerateAd={handleGenerateAd}
      />
    </div>
  );
}