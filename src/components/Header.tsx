import { useNavigate } from "react-router-dom";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("masyanya_user") || "null"); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("masyanya_user");
    navigate("/");
    window.location.reload();
  };

  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <a href="/" className="text-white text-sm uppercase tracking-wide font-bold hover:text-blue-400 transition-colors">
          MASYANYA AI
        </a>
        <nav className="flex items-center gap-6">
          <a href="#features" className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm hidden md:block">
            Возможности
          </a>
          <a href="#ai-chats" className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm hidden md:block">
            ИИ-чаты
          </a>
          <a href="#pricing" className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm hidden md:block">
            Тарифы
          </a>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-blue-300 text-sm hidden md:block">{user.name}</span>
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
      </div>
    </header>
  );
}
