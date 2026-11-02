import { useState } from 'react';

export default function Login({ onLogin, themeColor = 'light', onThemeChange }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  const isLight = themeColor === 'light';

  // Map theme nền & màu chữ cho Login
  const themeClasses = {
    light: 'bg-slate-50 text-slate-900',
    ocean: 'bg-[#030b13] text-white',
    cyber: 'bg-[#0a0014] text-cyan-100',
    obsidian: 'bg-[#000000] text-gray-100',
    forest: 'bg-[#02120b] text-emerald-100',
  };

  return (
    <main className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden px-5 py-10 transition-colors duration-300 ${themeClasses[themeColor]}`}>
      {/* Dynamic Background Glow */}
      {isLight ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#cbd5e1_0%,transparent_70%)] opacity-80" />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#15344a_0%,transparent_60%)]" />
      )}

      {/* Selector chuyển Theme ngay tại màn hình Login (ở góc trên bên phải) */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-1 rounded-xl border border-white/20 bg-black/10 p-1.5 backdrop-blur-md">
        {[
          { id: 'light', label: '☀️' },
          { id: 'ocean', label: '🌊' },
          { id: 'cyber', label: '🔮' },
          { id: 'obsidian', label: '🖤' },
          { id: 'forest', label: '🌲' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onThemeChange && onThemeChange(t.id)}
            title={`Chuyển sang ${t.id}`}
            className={`rounded-lg px-2 py-1 text-xs transition ${
              themeColor === t.id
                ? 'bg-cyan-500 text-white font-bold shadow'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Card Login */}
      <div className={`relative grid w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl md:grid-cols-2 ${
        isLight ? 'border-slate-300 bg-white/90 shadow-slate-300/50' : 'border-white/10 bg-[#071522]/80'
      }`}>

        {/* Branding */}
        <section className="relative flex min-h-[320px] flex-col justify-between overflow-hidden p-8 sm:p-12 md:min-h-[560px] md:p-14">
          <div className="relative flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${
              isLight ? 'border-cyan-500/30 bg-cyan-50 text-cyan-600' : 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300'
            }`}>
              ⚓
            </div>
            <span className="text-sm font-semibold tracking-[0.3em]">
              ANCHOR<span className={isLight ? 'text-cyan-600' : 'text-cyan-400'}>.</span>
            </span>
          </div>

          <div className="relative my-12 md:my-0">
            <h1 className="text-5xl font-light leading-[1.15] tracking-tight sm:text-6xl">
              Keep your<br />thoughts<br />
              <span className={`font-semibold italic ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>
                anchored.
              </span>
            </h1>
            <p className={`mt-6 max-w-xs text-sm leading-7 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              A quiet place for your notes, ideas, and everything worth remembering.
            </p>
          </div>

          <div className={`relative flex items-center justify-between border-t pt-5 text-[9px] tracking-[0.15em] ${isLight ? 'border-slate-200 text-slate-400' : 'border-white/[0.08] text-slate-500'}`}>
            <span>PERSONAL KNOWLEDGE SPACE</span>
            <span>EST. 2026</span>
          </div>
        </section>

        {/* Form Login */}
        <section className={`relative flex flex-col justify-center border-t p-8 sm:p-12 md:border-l md:border-t-0 md:p-14 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.08] bg-white/[0.02]'
        }`}>
          <div className="mb-10">
            <h2 className="text-3xl font-semibold tracking-tight">Enter your space.</h2>
            <p className={`mt-3 text-sm leading-6 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Your thoughts deserve a place of their own.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <label htmlFor="username" className={`mb-3 text-[10px] font-semibold tracking-[0.2em] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              ACCOUNT NAME
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              required
              className={`w-full rounded-xl border px-5 py-4 text-sm outline-none transition-all ${
                isLight 
                  ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'
                  : 'border-white/10 bg-[#020b13]/80 text-white placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/[0.08]'
              }`}
            />
            <button
              type="submit"
              className={`mt-5 flex w-full items-center justify-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold transition-all ${
                isLight 
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/20' 
                  : 'bg-cyan-300 text-[#06131e] hover:bg-cyan-200 shadow-lg shadow-cyan-400/10'
              }`}
            >
              Enter Anchor →
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}