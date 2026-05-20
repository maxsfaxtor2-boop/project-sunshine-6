export const TOOLS = [
  { id: "photo",     icon: "ImagePlus",  title: "Генерация фото",  desc: "Создай уникальное изображение по описанию",    badge: null,   active: true,  color: "blue"   },
  { id: "video",     icon: "Video",      title: "Генерация видео", desc: "Превращай идеи в видеоролики с ИИ",            badge: null,   active: true,  color: "purple" },
  { id: "animate",   icon: "Sparkles",   title: "Оживление фото",  desc: "Загрузи фото — ИИ добавит движение",          badge: null,   active: true,  color: "pink"   },
  { id: "templates", icon: "Layout",     title: "Шаблоны",         desc: "Баннеры и дизайн-материалы за секунды",        badge: null,   active: true,  color: "orange" },
  { id: "ads",       icon: "Megaphone",  title: "Реклама",         desc: "Рекламные визуалы под любую платформу",        badge: null,   active: true,  color: "green"  },
  { id: "chats",     icon: "Bot",        title: "ИИ-чаты",         desc: "5 лучших нейросетей в одном месте",           badge: null,   active: false, color: "cyan"   },
];

export const AI_CHATS = [
  { name: "ChatGPT",   color: "#10a37f", url: "https://chat.openai.com"   },
  { name: "Claude",    color: "#da7756", url: "https://claude.ai"         },
  { name: "Gemini",    color: "#4285f4", url: "https://gemini.google.com" },
  { name: "Grok",      color: "#ffffff", url: "https://grok.com"          },
  { name: "DeepSeek",  color: "#4d6bfe", url: "https://chat.deepseek.com" },
];

export const COLOR_MAP: Record<string, string> = {
  blue:   "border-blue-500/30   bg-blue-500/5   hover:border-blue-500/60",
  purple: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60",
  pink:   "border-pink-500/30   bg-pink-500/5   hover:border-pink-500/60",
  orange: "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60",
  green:  "border-green-500/30  bg-green-500/5  hover:border-green-500/60",
  cyan:   "border-cyan-500/30   bg-cyan-500/5   hover:border-cyan-500/60",
};

export const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", pink: "text-pink-400",
  orange: "text-orange-400", green: "text-green-400", cyan: "text-cyan-400",
};

export const TYPE_LABELS: Record<string, string> = {
  photo: "Фото", video: "Видео", animation: "Анимация",
  template: "Шаблон", ad: "Реклама",
};

export const TYPE_ICONS: Record<string, string> = {
  photo: "Image", video: "Video", animation: "Sparkles",
  template: "Layout", ad: "Megaphone",
};

export const TEMPLATE_SIZES = [
  { key: "banner", label: "Баннер 16:9" },
  { key: "square", label: "Квадрат 1:1" },
  { key: "story",  label: "Сторис 9:16" },
  { key: "vk",     label: "Обложка ВК"  },
];

export const AD_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "vk",        label: "ВКонтакте" },
  { key: "facebook",  label: "Facebook"  },
  { key: "stories",   label: "Сторис"    },
  { key: "yandex",    label: "Яндекс"    },
];

export interface Work {
  id: number; title: string; type: string;
  url: string; prompt: string; created_at: string;
}

export type ModalType = "photo" | "video" | "animation" | "template" | "ad" | null;
