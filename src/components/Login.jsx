import { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#001f3f] text-white">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center rounded-2xl border-2 border-cyan-500/30 bg-[#002b49] p-12 shadow-2xl">
        {/* Logo & Slogan */}
        <div className="relative mb-8 text-center">
          <h1 className="text-6xl font-extrabold tracking-wider text-white italic">
            <span className="text-amber-500">⚡</span> Anchor
          </h1>
          <p className="mt-2 -rotate-6 text-sm text-cyan-300 opacity-80">
            Safe storage for all your dry study notes.
          </p>
        </div>

        {/* Form Account */}
        <form onSubmit={handleSubmit} className="mt-6 flex w-full max-w-md flex-col items-center">
          <label className="mb-2 text-2xl font-semibold text-cyan-200">account</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="name"
            className="w-full rounded-xl border-4 border-cyan-400 bg-transparent px-6 py-3 text-center text-xl text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300"
            autoFocus
          />
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-cyan-500 py-3 text-lg font-bold text-[#001f3f] transition hover:bg-cyan-400"
          >
            Vào ứng dụng
          </button>
        </form>
      </div>
    </div>
  );
}