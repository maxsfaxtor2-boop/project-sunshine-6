import { useRef } from "react";
import Icon from "@/components/ui/icon";
import {
  TOOLS, TEMPLATE_SIZES, AD_PLATFORMS, ModalType,
} from "./DashboardConstants";

// ─── Результат генерации ─────────────────────────────────────────────────────

function GenResult({ url, title, prompt, isVideo, onAgain }: {
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

// ─── Типы пропсов ─────────────────────────────────────────────────────────────

interface GenerateModalProps {
  modal: ModalType;
  generating: boolean;
  genError: string;
  genResult: { url: string; title: string; prompt: string; isVideo: boolean } | null;
  onClose: () => void;
  onAgain: () => void;

  prompt: string;
  setPrompt: (v: string) => void;
  handleGeneratePhoto: () => void;

  videoPrompt: string;
  setVideoPrompt: (v: string) => void;
  handleGenerateVideo: () => void;

  animTitle: string;
  setAnimTitle: (v: string) => void;
  animFile: File | null;
  animPreview: string;
  handleAnimFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateAnimation: () => void;

  tmplDesc: string;
  setTmplDesc: (v: string) => void;
  tmplSize: string;
  setTmplSize: (v: string) => void;
  handleGenerateTemplate: () => void;

  adProduct: string;
  setAdProduct: (v: string) => void;
  adSlogan: string;
  setAdSlogan: (v: string) => void;
  adPlatform: string;
  setAdPlatform: (v: string) => void;
  handleGenerateAd: () => void;
}

// ─── Компонент модалки ───────────────────────────────────────────────────────

export default function GenerateModal({
  modal, generating, genError, genResult,
  onClose, onAgain,
  prompt, setPrompt, handleGeneratePhoto,
  videoPrompt, setVideoPrompt, handleGenerateVideo,
  animTitle, setAnimTitle, animFile, animPreview, handleAnimFile, handleGenerateAnimation,
  tmplDesc, setTmplDesc, tmplSize, setTmplSize, handleGenerateTemplate,
  adProduct, setAdProduct, adSlogan, setAdSlogan, adPlatform, setAdPlatform, handleGenerateAd,
}: GenerateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!modal) return null;

  const toolId = modal === "animation" ? "animate" : modal === "template" ? "templates" : modal === "ad" ? "ads" : modal;
  const tool = TOOLS.find(t => t.id === toolId);

  const handleSubmit =
    modal === "photo"     ? handleGeneratePhoto :
    modal === "video"     ? handleGenerateVideo :
    modal === "animation" ? handleGenerateAnimation :
    modal === "template"  ? handleGenerateTemplate :
    handleGenerateAd;

  const isDisabled = generating || (
    (modal === "photo"     && !prompt.trim()) ||
    (modal === "video"     && !videoPrompt.trim()) ||
    (modal === "animation" && !animFile) ||
    (modal === "template"  && !tmplDesc.trim()) ||
    (modal === "ad"        && !adProduct.trim())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="relative w-full sm:max-w-lg bg-[#0a1628] border border-white/10 sm:rounded-sm rounded-t-xl overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Мобильная ручка */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Заголовок */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Icon name={tool?.icon || "Sparkles"} size={20} className="text-blue-400" />
            <span className="text-white font-semibold">{tool?.title}</span>
          </div>
          {!generating && <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1"><Icon name="X" size={18} /></button>}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {genResult ? (
            <GenResult {...genResult} onAgain={onAgain} onClose={onClose} />
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
                onClick={handleSubmit}
                disabled={isDisabled}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white text-sm uppercase tracking-wide py-3 transition-colors flex items-center justify-center gap-2"
              >
                {generating
                  ? <>
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      {modal === "video" || modal === "animation" ? "Генерирую... (~1-2 мин)" : "Генерирую..."}
                    </>
                  : <><Icon name="Sparkles" size={16} /> Создать</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}