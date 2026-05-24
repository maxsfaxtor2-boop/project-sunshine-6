import { useState } from "react";
import Icon from "@/components/ui/icon";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("masyanya_user") || "null"); } catch { return null; }
  })();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("masyanya_user");
    window.location.href = "/";
  };

  const closeMenu = () => setMenuOpen(false);

  const touchStyle: React.CSSProperties = { touchAction: "manipulation", WebkitTapHighlightColor: "transparent" };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 p-5 md:p-6 ${className ?? ""}`}
        style={touchStyle}
      >
        <div className="flex justify-between items-center">
          <a href="/" className="text-white text-sm uppercase tracking-wide font-bold hover:text-blue-400 transition-colors">
            MASYANYA AI
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm">
              Возможности
            </a>
            <a href="#ai-chats" className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm">
              ИИ-чаты
            </a>
            <a href="#pricing" className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm">
              Тарифы
            </a>
            {user ? (
              <div className="flex items-center gap-3">
                <a
                  href="/dashboard"
                  className="bg-blue-600 text-white text-xs uppercase tracking-wide px-4 py-2 hover:bg-blue-500 transition-colors duration-300"
                >
                  Личный кабинет
                </a>
                <a
                  href="/"
                  onClick={handleLogout}
                  className="border border-white/30 text-white text-xs uppercase tracking-wide px-4 py-2 hover:border-red-400 hover:text-red-400 transition-colors duration-300"
                >
                  Выйти
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/login"
                  className="text-white hover:text-blue-400 transition-colors duration-300 uppercase text-sm"
                >
                  Войти
                </a>
                <a
                  href="/register"
                  className="bg-blue-600 text-white text-xs uppercase tracking-wide px-4 py-2 hover:bg-blue-500 transition-colors duration-300"
                >
                  Начать
                </a>
              </div>
            )}
          </nav>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <a
                href="/dashboard"
                style={touchStyle}
                className="bg-blue-600 text-white text-xs uppercase tracking-wide px-4 py-3 active:bg-blue-700"
              >
                Кабинет
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  style={touchStyle}
                  className="text-white text-xs uppercase tracking-wide px-3 py-3 border border-white/30 active:bg-white/10"
                >
                  Вход
                </a>
                <a
                  href="/register"
                  style={touchStyle}
                  className="bg-blue-600 text-white text-xs uppercase tracking-wide px-4 py-3 active:bg-blue-700"
                >
                  Начать
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              style={touchStyle}
              className="text-white p-2 active:bg-white/10"
              aria-label="Меню"
            >
              <Icon name={menuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col md:hidden" style={touchStyle}>
          <div className="flex justify-between items-center p-5">
            <a href="/" className="text-white text-sm uppercase tracking-wide font-bold">
              MASYANYA AI
            </a>
            <button
              type="button"
              onClick={closeMenu}
              style={touchStyle}
              className="text-white p-2 active:bg-white/10"
              aria-label="Закрыть"
            >
              <Icon name="X" size={28} />
            </button>
          </div>

          <nav className="flex flex-col flex-1 px-6 pt-4 gap-1 overflow-y-auto">
            <a
              href="#features"
              onClick={closeMenu}
              style={touchStyle}
              className="text-white text-lg uppercase tracking-widest py-5 border-b border-white/10 active:text-blue-400"
            >
              Возможности
            </a>
            <a
              href="#ai-chats"
              onClick={closeMenu}
              style={touchStyle}
              className="text-white text-lg uppercase tracking-widest py-5 border-b border-white/10 active:text-blue-400"
            >
              ИИ-чаты
            </a>
            <a
              href="#pricing"
              onClick={closeMenu}
              style={touchStyle}
              className="text-white text-lg uppercase tracking-widest py-5 border-b border-white/10 active:text-blue-400"
            >
              Тарифы
            </a>

            <div className="flex flex-col gap-3 mt-8 pb-8">
              {user ? (
                <>
                  <a
                    href="/dashboard"
                    style={touchStyle}
                    className="w-full bg-blue-600 text-white text-sm uppercase tracking-wide py-4 text-center active:bg-blue-700"
                  >
                    Личный кабинет
                  </a>
                  <a
                    href="/"
                    onClick={handleLogout}
                    style={touchStyle}
                    className="w-full border border-white/30 text-white text-sm uppercase tracking-wide py-4 text-center active:bg-white/10"
                  >
                    Выйти
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/register"
                    style={touchStyle}
                    className="w-full bg-blue-600 text-white text-sm uppercase tracking-wide py-4 text-center active:bg-blue-700"
                  >
                    Начать бесплатно
                  </a>
                  <a
                    href="/login"
                    style={touchStyle}
                    className="w-full border border-white/30 text-white text-sm uppercase tracking-wide py-4 text-center active:bg-white/10"
                  >
                    Войти в аккаунт
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
