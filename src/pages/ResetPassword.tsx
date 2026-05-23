import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import func2url from "../../backend/func2url.json";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    if (!t) setError("Ссылка недействительна. Запроси новую.");
    setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch(func2url.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_confirm", token, password }),
    });

    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    setLoading(false);

    if (data.success) {
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setError(data.error || "Что-то пошло не так");
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="text-white text-sm uppercase tracking-widest font-bold hover:text-blue-400 transition-colors">
            MASYANYA AI
          </a>
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">Новый пароль</h1>
          <p className="text-blue-200/60 text-sm">Придумай новый пароль для аккаунта</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-6 py-5 text-sm">
              Пароль успешно изменён! Перенаправляем на страницу входа...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-200/70 text-xs uppercase tracking-wide mb-2">Новый пароль</label>
              <input
                type="password"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-blue-200/70 text-xs uppercase tracking-wide mb-2">Повтори пароль</label>
              <input
                type="password"
                placeholder="Повтори пароль"
                value={password2}
                onChange={e => { setPassword2(e.target.value); setError(""); }}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm border border-red-500/20 bg-red-500/10 px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-600 text-white py-3 uppercase tracking-wide text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Сохраняем..." : "Сохранить пароль"}
            </button>

            <p className="text-center text-blue-200/40 text-xs pt-2">
              <a href="/forgot-password" className="text-blue-400 hover:underline">Запросить новую ссылку</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
