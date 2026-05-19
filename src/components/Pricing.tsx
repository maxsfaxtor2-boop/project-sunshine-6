import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PLANS = [
  {
    name: "Старт",
    price: "Бесплатно",
    period: "",
    description: "Для знакомства с платформой",
    highlight: false,
    features: [
      { text: "5 генераций фото в месяц", included: true },
      { text: "1 генерация видео в месяц", included: true },
      { text: "Базовые шаблоны (20 штук)", included: true },
      { text: "Оживление фото", included: false },
      { text: "Рекламные шаблоны", included: false },
      { text: "Приоритетная поддержка", included: false },
    ],
    cta: "Начать бесплатно",
    ctaAction: "/register",
  },
  {
    name: "Про",
    price: "990 ₽",
    period: "/ месяц",
    description: "Для творческих профессионалов",
    highlight: true,
    features: [
      { text: "500 генераций фото в месяц", included: true },
      { text: "100 генераций видео в месяц", included: true },
      { text: "Все шаблоны (500+ штук)", included: true },
      { text: "Оживление фото", included: true },
      { text: "Рекламные шаблоны", included: true },
      { text: "Приоритетная поддержка", included: false },
    ],
    cta: "Выбрать Про",
    ctaAction: "/register",
  },
  {
    name: "Бизнес",
    price: "3 990 ₽",
    period: "/ месяц",
    description: "Для команд и рекламных агентств",
    highlight: false,
    features: [
      { text: "Безлимитные генерации фото", included: true },
      { text: "Безлимитные генерации видео", included: true },
      { text: "Все шаблоны + эксклюзивные", included: true },
      { text: "Оживление фото", included: true },
      { text: "Рекламные шаблоны", included: true },
      { text: "Приоритетная поддержка 24/7", included: true },
    ],
    cta: "Связаться с нами",
    ctaAction: "/register",
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div id="pricing" className="bg-[#020817] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="uppercase tracking-widest text-blue-400 text-xs mb-4">Тарифы</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Выбери свой план</h2>
          <p className="text-blue-200/60 max-w-xl mx-auto">
            Начни бесплатно, переходи на Про когда будешь готов. Без скрытых платежей.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 border transition-all duration-300 ${
                plan.highlight
                  ? "border-blue-500 bg-blue-600/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                  : "border-white/10 bg-white/3 hover:border-white/20"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs uppercase tracking-widest px-4 py-1">
                    Популярный
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-white text-lg font-semibold uppercase tracking-wide mb-1">{plan.name}</h3>
                <p className="text-blue-200/50 text-sm mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-blue-200/50 text-sm mb-1">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-3">
                    <Icon
                      name={f.included ? "Check" : "X"}
                      size={16}
                      className={`flex-shrink-0 mt-0.5 ${f.included ? "text-blue-400" : "text-white/20"}`}
                    />
                    <span className={`text-sm ${f.included ? "text-blue-100/80" : "text-white/25"}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(plan.ctaAction)}
                className={`w-full py-3 text-sm uppercase tracking-wide font-semibold transition-all duration-300 ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "border border-white/20 text-white hover:border-blue-500 hover:text-blue-400"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}