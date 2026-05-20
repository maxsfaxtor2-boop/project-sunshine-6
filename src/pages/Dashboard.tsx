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

      {/* Модалка генерации */}
      <GenerateModal
        modal={modal}
        generating={generating}
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
        adSlogan={adSlogan} setAdSlogan={setAdSlogan}
        adPlatform={adPlatform} setAdPlatform={setAdPlatform} handleGenerateAd={handleGenerateAd}
      />
    </div>
  );
}
