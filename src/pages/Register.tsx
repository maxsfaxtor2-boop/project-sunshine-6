import { useState } from "react";
import { useNavigate } from "react-router-dom";
import func2url from "../../backend/func2url.json";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(func2url.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const raw = await res.json();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
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
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">Создать аккаунт</h1>
          <p className="text-blue-200/60 text-sm">Начни создавать с ИИ бесплатно</p>
        </div>

        {success ? (
          <div className="border border-blue-500/30 bg-blue-500/10 p-6 text-center">
            <p className="text-blue-400 text-lg font-semibold mb-1">Регистрация успешна!</p>
            <p className="text-blue-200/60 text-sm">Перенаправляем на главную...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-200/70 text-xs uppercase tracking-wide mb-2">Имя</label>
              <input
                name="name"
                type="text"
                placeholder="Ваше имя"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-blue-200/70 text-xs uppercase tracking-wide mb-2">Email</label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-blue-200/70 text-xs uppercase tracking-wide mb-2">Пароль</label>
              <input
                name="password"
                type="password"
                placeholder="Минимум 6 символов"
                value={form.password}
                onChange={handleChange}
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
              {loading ? "Регистрация..." : "Начать бесплатно"}
            </button>

            <p className="text-center text-blue-200/40 text-xs pt-2">
              Уже есть аккаунт?{" "}
              <a href="/" className="text-blue-400 hover:underline">На главную</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}