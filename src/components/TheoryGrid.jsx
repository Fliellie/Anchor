import { useState } from 'react';

export default function TheoryGrid({
  theories,
  onSelectTheory,
  onCreateTheory,
  onLogout,
  user,
  themeColor = 'light',
  onThemeChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTheoryName, setNewTheoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Bảng tra cứu Tailwind CSS theo Theme (Hỗ trợ cả Sáng & Tối)
  const themeBgMap = {
    light: 'bg-slate-50 text-slate-900 border-slate-200',
    ocean: 'bg-[#030b13] text-white border-white/10',
    cyber: 'bg-[#0a0014] text-cyan-100 border-purple-500/20',
    obsidian: 'bg-[#000000] text-gray-100 border-white/10',
    forest: 'bg-[#02120b] text-emerald-100 border-emerald-500/20',
  };

  const isLight = themeColor === 'light';

  const filteredTheories = theories.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e) => {
    e.preventDefault();
    if (newTheoryName.trim()) {
      onCreateTheory(newTheoryName.trim());
      setNewTheoryName('');
      setIsCreating(false);
    }
  };

  return (
    <main
      className={`relative flex min-h-screen flex-col overflow-hidden font-sans transition-colors duration-300 ${
        themeBgMap[themeColor] || themeBgMap.ocean
      }`}
    >
      {/* Background Gradient & Pattern linh hoạt theo Light / Dark */}
      {isLight ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#e2e8f0_0%,transparent_70%)] opacity-70" />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#123044_0%,transparent_60%)] opacity-40" />
          <div className="pointer-events-none absolute -right-40 top-40 h-96 w-96 rounded-full bg-cyan-500/[0.06] blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </>
      )}

      {/* Header */}
      <header
        className={`relative z-10 border-b backdrop-blur-xl transition-colors duration-300 ${
          isLight
            ? 'border-slate-200 bg-white/80'
            : 'border-white/[0.08] bg-[#071522]/70'
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                isLight
                  ? 'border-cyan-500/30 bg-cyan-50 text-cyan-600'
                  : 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300'
              }`}
            >
              ⚓
            </div>
            <div>
              <h1 className="text-base font-bold tracking-[0.2em]">
                ANCHOR<span className={isLight ? 'text-cyan-600' : 'text-cyan-400'}>.</span>
              </h1>
            </div>
          </div>

          {/* Search Input với Icon */}
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-md sm:px-4 lg:max-w-xl">
            <div className="group relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className={`absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors ${
                  isLight
                    ? 'text-slate-400 group-focus-within:text-cyan-600'
                    : 'text-slate-500 group-focus-within:text-cyan-300'
                }`}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>

              <input
                type="text"
                placeholder="Search your knowledge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search theories"
                className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm outline-none transition-all ${
                  isLight
                    ? 'border-slate-300 bg-slate-100/80 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10'
                    : 'border-white/[0.09] bg-white/[0.03] text-white placeholder:text-slate-600 hover:border-white/[0.15] focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-cyan-400/[0.05]'
                }`}
              />
            </div>
          </div>

          {/* Theme Selector, User Badge & Logout */}
          <div className="flex items-center gap-3">
            {/* Bộ chọn Theme */}
            <div
              className={`flex items-center gap-1 rounded-xl border p-1 ${
                isLight ? 'border-slate-300 bg-slate-100' : 'border-white/10 bg-white/5'
              }`}
            >
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
                  title={`Chủ đề ${t.id}`}
                  className={`rounded-lg px-2 py-1 text-xs transition ${
                    themeColor === t.id
                      ? 'bg-cyan-500 text-white font-bold shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* User Badge */}
            {user && (
              <div
                className={`hidden items-center gap-3 rounded-xl border px-3 py-1.5 sm:flex ${
                  isLight
                    ? 'border-slate-300 bg-slate-100/70'
                    : 'border-white/[0.08] bg-white/[0.03]'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                    isLight
                      ? 'bg-cyan-100 text-cyan-700'
                      : 'bg-cyan-300/10 text-cyan-200'
                  }`}
                >
                  {user.charAt(0).toUpperCase()}
                </div>
                <p
                  className={`truncate text-xs font-medium ${
                    isLight ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  {user}
                </p>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                isLight
                  ? 'border-slate-300 text-slate-600 hover:border-red-400 hover:bg-red-50 hover:text-red-600'
                  : 'border-white/10 text-slate-400 hover:border-red-400/30 hover:bg-red-400/[0.06] hover:text-red-300'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <section className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        {/* Page Heading & Stats */}
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
              Your{' '}
              <span className={`font-semibold ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>
                library.
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <div className={`border-l pl-4 ${isLight ? 'border-slate-300' : 'border-white/10'}`}>
              <p className={`text-2xl font-light ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {theories.length.toString().padStart(2, '0')}
              </p>
              <p
                className={`mt-0.5 text-[9px] uppercase tracking-[0.2em] ${
                  isLight ? 'text-slate-500' : 'text-slate-500'
                }`}
              >
                Total theories
              </p>
            </div>

            <div className={`border-l pl-4 ${isLight ? 'border-slate-300' : 'border-white/10'}`}>
              <p className={`text-2xl font-light ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>
                {theories
                  .reduce(
                    (total, theory) => total + (theory.items?.length || 0),
                    0
                  )
                  .toString()
                  .padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-slate-500">
                Notes collected
              </p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div
          className={`mb-6 flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-200' : 'border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-3">
            <h3
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {searchTerm ? 'Search results' : 'All theories'}
            </h3>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] ${
                isLight
                  ? 'border-slate-300 bg-slate-200/60 text-slate-600'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-500'
              }`}
            >
              {filteredTheories.length}
            </span>
          </div>
        </div>

        {/* Theory Grid */}
        <div className="grid auto-rows-[160px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTheories.map((theory) => (
            <button
              key={theory.id}
              type="button"
              onClick={() => onSelectTheory(theory)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 ${
                isLight
                  ? 'border-slate-200 bg-white text-slate-900 shadow-sm hover:border-cyan-500 hover:shadow-md'
                  : 'border-white/[0.09] bg-[#0a1926]/80 text-white hover:border-cyan-300/40 hover:bg-[#0c2030] hover:shadow-[0_16px_45px_rgba(0,0,0,0.25)]'
              }`}
            >
              {!isLight && (
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-400/[0.04] blur-3xl transition-all duration-500 group-hover:bg-cyan-300/[0.12]" />
              )}
              <h4
                className={`line-clamp-2 break-words text-xl font-semibold leading-7 transition-colors ${
                  isLight ? 'group-hover:text-cyan-600' : 'group-hover:text-cyan-200'
                }`}
              >
                {theory.title}
              </h4>
              <div
                className={`flex items-center justify-between border-t pt-3 ${
                  isLight ? 'border-slate-100' : 'border-white/[0.07]'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isLight ? 'text-cyan-600' : 'text-cyan-400/80'
                  }`}
                >
                  {theory.items?.length || 0} ghi chú
                </span>
              </div>
            </button>
          ))}

          {/* Form Create Theory */}
          {isCreating && (
            <form
              onSubmit={handleCreate}
              className={`flex flex-col justify-between rounded-2xl border p-5 ${
                isLight
                  ? 'border-cyan-400 bg-white shadow-lg'
                  : 'border-cyan-300/30 bg-[#0a1926]/90 shadow-[0_0_35px_rgba(34,211,238,0.04)]'
              }`}
            >
              <div>
                <label
                  htmlFor="new-theory-name"
                  className={`mb-2 block text-[10px] font-medium uppercase tracking-widest ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  Theory name
                </label>
                <input
                  id="new-theory-name"
                  type="text"
                  placeholder="e.g. Python"
                  value={newTheoryName}
                  onChange={(e) => setNewTheoryName(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition ${
                    isLight
                      ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500'
                      : 'border-white/10 bg-[#030b13] text-white focus:border-cyan-400/50'
                  }`}
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    isLight
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                      : 'bg-cyan-300 text-[#06131e] hover:bg-cyan-200'
                  }`}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTheoryName('');
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs transition ${
                    isLight
                      ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      : 'border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Add Theory Button Card */}
          {!isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className={`group flex flex-col items-center justify-center rounded-2xl border border-dashed p-5 transition-all duration-300 ${
                isLight
                  ? 'border-slate-300 bg-slate-100/50 hover:border-cyan-500 hover:bg-cyan-50/50'
                  : 'border-white/[0.13] bg-white/[0.015] hover:border-cyan-300/40 hover:bg-cyan-300/[0.025]'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all duration-300 group-hover:scale-110 ${
                  isLight
                    ? 'border-slate-300 bg-white text-slate-500 group-hover:border-cyan-500 group-hover:bg-cyan-100 group-hover:text-cyan-600'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/10 group-hover:text-cyan-300'
                }`}
              >
                +
              </div>
              <h4
                className={`mt-3 text-sm font-medium transition-colors ${
                  isLight
                    ? 'text-slate-600 group-hover:text-slate-900'
                    : 'text-slate-300 group-hover:text-white'
                }`}
              >
                Create a theory
              </h4>
            </button>
          )}
        </div>

        {/* Empty State khi tìm kiếm không ra kết quả */}
        {filteredTheories.length === 0 && searchTerm.trim() !== '' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3
              className={`text-base font-medium ${
                isLight ? 'text-slate-700' : 'text-slate-200'
              }`}
            >
              No theories found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Không tìm thấy thư viện phù hợp với "{searchTerm}".
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className={`mt-4 text-xs transition ${
                isLight
                  ? 'text-cyan-600 hover:text-cyan-700'
                  : 'text-cyan-300 hover:text-cyan-200'
              }`}
            >
              Xóa tìm kiếm →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}