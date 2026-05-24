import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("masyanya_user") || "null"); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("masyanya_user");
    navigate("/");
    window.location.reload();
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 p-5 md:p-6 ${className ?? ""}`}>
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
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 text-white text-xs uppercase tracking-wide px-4 py-2 hover:bg-blue-500 transition-colors duration-300"
                >
                  Личный кабинет
                </button>
                <button
                  onClick={handleLogout}
                  className="border border-white/30 text-white text-xs uppercase tracking-wide px-4 py-2 hover:border-red-400 hover:text-red-400 transition-colors duration-300"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="text-white hover:text-blue-400 transition-colors duration-300 uppercase text-sm"
                >
                  Войти
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-blue-600 text-white text-xs uppercase tracking-wide px-4 py-2 hover:bg-blue-500 transition-colors duration-300"
                >
                  Начать
                </button>
              </div>
            )}
          </nav>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 text-white text-xs uppercase tracking-wide px-3 py-2 hover:bg-blue-500 transition-colors"
              >
                Кабинет
              </button>
            ) : (
              <button
                onClick={() => navigate("/register")}
                className="bg-blue-600 text-white text-xs uppercase tracking-wide px-3 py-2 hover:bg-blue-500 transition-colors"
              >
                Начать
              </button>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="text-white p-1"
              aria-label="Меню"
            >
              <Icon name={menuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/95 flex flex-col md:hidden">
          <div className="flex justify-between items-center p-5">
            <a href="/" className="text-white text-sm uppercase tracking-wide font-bold">
              MASYANYA AI
            </a>
            <button onClick={closeMenu} className="text-white p-1">
              <Icon name="X" size={24} />
            </button>
          </div>

          <nav className="flex flex-col flex-1 px-6 pt-8 gap-2">
            <a
              href="#features"
              onClick={closeMenu}
              className="text-white text-lg uppercase tracking-widest py-4 border-b border-white/10 hover:text-blue-400 transition-colors"
            >
              Возможности
            </a>
            <a
              href="#ai-chats"
              onClick={closeMenu}
              className="text-white text-lg uppercase tracking-widest py-4 border-b border-white/10 hover:text-blue-400 transition-colors"
            >
              ИИ-чаты
            </a>
            <a
              href="#pricing"
              onClick={closeMenu}
              className="text-white text-lg uppercase tracking-widest py-4 border-b border-white/10 hover:text-blue-400 transition-colors"
            >
              Тарифы
            </a>

            <div className="flex flex-col gap-3 mt-8">
              {user ? (
                <>
                  <button
                    onClick={() => { navigate("/dashboard"); closeMenu(); }}
                    className="w-full bg-blue-600 text-white text-sm uppercase tracking-wide py-4 hover:bg-blue-500 transition-colors"
                  >
                    Личный кабинет
                  </button>
                  <button
                    onClick={() => { handleLogout(); closeMenu(); }}
                    className="w-full border border-white/30 text-white text-sm uppercase tracking-wide py-4 hover:border-red-400 hover:text-red-400 transition-colors"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { navigate("/register"); closeMenu(); }}
                    className="w-full bg-blue-600 text-white text-sm uppercase tracking-wide py-4 hover:bg-blue-500 transition-colors"
                  >
                    Начать бесплатно
                  </button>
                  <button
                    onClick={() => { navigate("/login"); closeMenu(); }}
                    className="w-full border border-white/30 text-white text-sm uppercase tracking-wide py-4 hover:text-blue-400 hover:border-blue-400 transition-colors"
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}