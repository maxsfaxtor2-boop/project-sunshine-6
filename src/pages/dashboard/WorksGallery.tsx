import Icon from "@/components/ui/icon";
import { Work, TYPE_LABELS, TYPE_ICONS } from "./DashboardConstants";

// ─── Модалка просмотра работы ────────────────────────────────────────────────

function WorkModal({ work, onClose }: { work: Work; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="relative w-full sm:max-w-2xl bg-[#0a1628] border border-white/10 sm:rounded-sm rounded-t-xl overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Мобильная ручка */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        {work.type === "video" || work.type === "animation"
          ? <video src={work.url} controls autoPlay loop className="w-full max-h-[50vh] bg-black shrink-0" />
          : <img src={work.url} alt={work.title} className="w-full max-h-[50vh] object-contain shrink-0" />
        }
        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon name={TYPE_ICONS[work.type] || "Image"} size={14} className="text-blue-400" />
              <span className="text-xs uppercase tracking-widest text-blue-400">{TYPE_LABELS[work.type] || work.type}</span>
            </div>
            <span className="text-white/20 text-xs">{new Date(work.created_at).toLocaleDateString("ru-RU")}</span>
          </div>
          <h3 className="text-white font-semibold mb-1">{work.title}</h3>
          {work.prompt && <p className="text-white/40 text-xs mb-4">{work.prompt}</p>}
          <a href={work.url} download target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs uppercase tracking-wide px-4 py-2.5 transition-colors">
            <Icon name="Download" size={13} /> Скачать
          </a>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors rounded-sm">
          <Icon name="X" size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Галерея работ ───────────────────────────────────────────────────────────

interface WorksGalleryProps {
  works: Work[];
  worksLoading: boolean;
  activeTab: "all" | "photo" | "video" | "animation" | "template" | "ad";
  setActiveTab: (tab: "all" | "photo" | "video" | "animation" | "template" | "ad") => void;
  selectedWork: Work | null;
  setSelectedWork: (work: Work | null) => void;
  onCreateClick: () => void;
}

export default function WorksGallery({
  works, worksLoading, activeTab, setActiveTab,
  selectedWork, setSelectedWork, onCreateClick,
}: WorksGalleryProps) {
  const filteredWorks = activeTab === "all" ? works : works.filter(w => w.type === activeTab);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs uppercase tracking-widest text-blue-200/40">Мои работы</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/20">{works.length} работ</span>
          <button
            onClick={onCreateClick}
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
          onClick={onCreateClick}
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

      {selectedWork && <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />}
    </div>
  );
}