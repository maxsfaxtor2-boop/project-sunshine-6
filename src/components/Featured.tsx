import Icon from "@/components/ui/icon";

const FEATURES = [
  { icon: "ImagePlus", title: "Генерация фото", desc: "Создавай уникальные изображения по текстовому описанию за секунды" },
  { icon: "Video", title: "Генерация видео", desc: "Превращай идеи в видеоролики с помощью ИИ-моделей" },
  { icon: "Sparkles", title: "Оживление фото", desc: "Добавляй движение статичным изображениям — магия анимации" },
  { icon: "Layout", title: "Шаблоны для рекламы", desc: "Сотни шаблонов для надписей, баннеров и рекламных материалов" },
  { icon: "Brush", title: "Творческая студия", desc: "Инструменты для фотографов, дизайнеров и рекламщиков" },
  { icon: "Bot", title: "ИИ в каждом шаге", desc: "Искусственный интеллект помогает на каждом этапе создания" },
];

export default function Featured() {
  return (
    <div id="features" className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-white">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <img
          src="https://cdn.poehali.dev/projects/614d053f-56a2-4ff5-8bc9-4363df40c0a0/files/dbf0d1b7-ddb8-4e71-a4a5-9239a7a8858f.jpg"
          alt="AI Creative Studio"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4 text-sm tracking-wide text-neutral-600">Возможности платформы</h3>
        <p className="text-2xl lg:text-4xl mb-8 text-neutral-900 leading-tight">
          Всё для творчества — от идеи до готового результата. ИИ работает за тебя.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 items-start">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 flex-shrink-0 mt-0.5">
                <Icon name={f.icon} size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm text-neutral-900">{f.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="bg-black text-white border border-black px-4 py-2 text-sm transition-all duration-300 hover:bg-white hover:text-black cursor-pointer w-fit uppercase tracking-wide">
          Попробовать
        </button>
      </div>
    </div>
  );
}
