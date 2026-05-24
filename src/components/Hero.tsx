import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const AI_CHATS = [
  { name: "ChatGPT", color: "#10a37f", url: "https://chat.openai.com" },
  { name: "Claude", color: "#da7756", url: "https://claude.ai" },
  { name: "Gemini", color: "#4285f4", url: "https://gemini.google.com" },
  { name: "Grok", color: "#ffffff", url: "https://grok.com" },
  { name: "DeepSeek", color: "#4d6bfe", url: "https://chat.deepseek.com" },
];

export default function Hero() {
  const navigate = useNavigate();
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="https://cdn.poehali.dev/projects/614d053f-56a2-4ff5-8bc9-4363df40c0a0/files/637b9784-eea2-4194-a215-065d8eb6cc1c.jpg"
          alt="AI Creative Platform"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      <div className="relative z-10 text-center text-white px-6">
        <p className="uppercase tracking-widest text-sm mb-4 opacity-70">Твоя творческая мастерская</p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
          СОЗДАВАЙ<br />С ИИ
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-10">
          Генерируй фото и видео, оживляй изображения, создавай рекламные материалы — всё с силой искусственного интеллекта
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-black px-8 py-3 uppercase tracking-wide text-sm font-semibold hover:bg-neutral-200 transition-colors duration-300"
          >
            Начать бесплатно
          </button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="border border-white text-white px-8 py-3 uppercase tracking-wide text-sm hover:bg-white/10 transition-colors duration-300"
          >
            Смотреть примеры
          </button>
          <button
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="border border-white/50 text-white/80 px-8 py-3 uppercase tracking-wide text-sm hover:bg-white/10 hover:border-white transition-colors duration-300"
          >
            Тарифы
          </button>
        </div>

        <div id="ai-chats">
          <p className="uppercase tracking-widest text-xs mb-4 opacity-50">5 лучших ИИ-чатов</p>
          <div className="flex flex-wrap justify-center gap-3">
            {AI_CHATS.map((chat) => (
              <a
                key={chat.name}
                href={chat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm hover:bg-white/20 transition-all duration-300 rounded-sm"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chat.color }}
                />
                {chat.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}