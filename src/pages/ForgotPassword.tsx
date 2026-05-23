import { useState } from "react";
import func2url from "../../backend/func2url.json";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(func2url.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_request", email: email.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      setSent(true);
    } else {
      const raw = await res.json();
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
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
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">Восстановление пароля</h1>
          <p className="text-blue-200/60 text-sm">Введи email — пришлём ссылку для сброса</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-6 py-5 text-sm">
              Письмо отправлено! Проверь почту и перейди по ссылке в письме.
            </div>
            <p className="text-white/30 text-xs">Не пришло? Проверь папку «Спам»</p>
            <a href="/login" className="block text-blue-400 text-sm hover:underline">
              Вернуться ко входу
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-200/70 text-xs uppercase tracking-wide mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm border border-red-500/20 bg-red-500/10 px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 uppercase tracking-wide text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </button>

            <p className="text-center text-blue-200/40 text-xs pt-2">
              Вспомнил пароль?{" "}
              <a href="/login" className="text-blue-400 hover:underline">Войти</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
