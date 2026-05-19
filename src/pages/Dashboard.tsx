import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const TOOLS = [
  {
    id: "photo",
    icon: "ImagePlus",
    title: "Генерация фото",
    desc: "Создай уникальное изображение по описанию",
    badge: "Скоро",
    color: "blue",
  },
  {
    id: "video",
    icon: "Video",
    title: "Генерация видео",
    desc: "Превращай идеи в видеоролики с ИИ",
    badge: "Скоро",
    color: "purple",
  },
  {
    id: "animate",
    icon: "Sparkles",
    title: "Оживление фото",
    desc: "Добавь движение статичным фото",
    badge: "Скоро",
    color: "pink",
  },
  {
    id: "templates",
    icon: "Layout",
    title: "Шаблоны",
    desc: "Надписи, баннеры и рекламные материалы",
    badge: "Скоро",
    color: "orange",
  },
  {
    id: "ads",
    icon: "Megaphone",
    title: "Реклама",
    desc: "Шаблоны и модели для рекламщиков",
    badge: "Скоро",
    color: "green",
  },
  {
    id: "chats",
    icon: "Bot",
    title: "ИИ-чаты",
    desc: "5 лучших нейросетей в одном месте",
    badge: null,
    color: "cyan",
  },
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
  blue: "text-blue-400",
  purple: "text-purple-400",
  pink: "text-pink-400",
  orange: "text-orange-400",
  green: "text-green-400",
  cyan: "text-cyan-400",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("masyanya_user");
    if (!stored) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("masyanya_user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Шапка */}
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
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-red-400 transition-colors text-xs uppercase tracking-wide"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Приветствие */}
        <div className="mb-12">
          <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">Личный кабинет</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Привет, {user.name.split(" ")[0]}!
          </h1>
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
                onClick={() => tool.id === "chats" ? document.getElementById("ai-section")?.scrollIntoView({ behavior: "smooth" }) : null}
              >
                {tool.badge && (
                  <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-white/30 border border-white/10 px-2 py-0.5">
                    {tool.badge}
                  </span>
                )}
                <Icon name={tool.icon} size={24} className={`mb-4 ${ICON_COLOR_MAP[tool.color]}`} />
                <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
                <p className="text-xs text-white/40">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ИИ-чаты */}
        <div id="ai-section">
          <h2 className="text-xs uppercase tracking-widest text-blue-200/40 mb-6">5 лучших ИИ-чатов</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {AI_CHATS.map((chat) => (
              <a
                key={chat.name}
                href={chat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 border border-white/10 bg-white/3 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-5 rounded-sm group"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: chat.color }}
                />
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{chat.name}</span>
                <Icon name="ExternalLink" size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Тариф */}
        <div className="mt-12 border border-blue-500/20 bg-blue-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400 mb-1">Ваш тариф</p>
            <p className="text-white font-semibold">Старт — Бесплатно</p>
            <p className="text-white/40 text-xs mt-1">5 фото и 1 видео в месяц</p>
          </div>
          <button
            onClick={() => navigate("/#pricing")}
            className="bg-blue-600 text-white text-xs uppercase tracking-wide px-6 py-2.5 hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            Улучшить тариф
          </button>
        </div>
      </div>
    </div>
  );
}
