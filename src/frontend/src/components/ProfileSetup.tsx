import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";

export default function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
      <div className="w-full max-w-md glassmorphism neon-border box-glow-purple p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-[#00ffff] font-orbitron text-glow-cyan mb-6 text-center">
          НАСТРОЙКА ПРОФИЛЯ
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="profile-username"
              className="block text-[#9933ff] text-sm font-jetbrains mb-2"
            >
              Имя пользователя
            </label>
            <input
              id="profile-username"
              data-ocid="profile.input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[rgba(10,0,30,0.7)] border border-[#00ffff]/30 text-[#00ffff] rounded-lg px-4 py-2 font-jetbrains focus:outline-none focus:border-[#00ffff]"
              placeholder="Enter username"
            />
          </div>
          <button
            data-ocid="profile.submit_button"
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full btn-gradient-cyan text-black font-bold py-3 rounded-lg font-orbitron disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Сохранить"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
