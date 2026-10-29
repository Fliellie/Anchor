import { useState } from 'react';

export default function TheoryGrid({ theories, onSelectTheory, onCreateTheory, onLogout, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTheoryName, setNewTheoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Lọc danh sách theory theo thanh tìm kiếm
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
    <div className="flex h-screen w-screen flex-col bg-[#001829] p-8 text-white">
      {/* Header & Thanh tìm kiếm */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-wider text-amber-500 italic">⚡ Anchor</h1>
          <span className="text-sm text-cyan-300/60">({user})</span>
        </div>

        {/* Thanh tìm kiếm ô hình chữ nhật góc bo tròn */}
        <div className="relative w-full max-w-xl">
          <input
            type="text"
            placeholder="Search theory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border-2 border-cyan-400/60 bg-[#00223a] px-5 py-2.5 pl-12 text-center text-cyan-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">🔍</span>
        </div>

        <button
          onClick={onLogout}
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/30"
        >
          Đăng xuất
        </button>
      </div>

      {/* Grid danh sách Theory */}
      <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 align-content-start p-2">
        {filteredTheories.map((theory) => (
          <div
            key={theory.id}
            onClick={() => onSelectTheory(theory)}
            className="group relative flex h-48 cursor-pointer flex-col justify-between rounded-2xl border-2 border-cyan-500/40 bg-[#002b49] p-6 shadow-lg transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-cyan-500/20"
          >
            <h2 className="text-xl font-bold text-cyan-200 group-hover:text-white">
              {theory.title}
            </h2>
            <div className="text-xs text-cyan-400/70">
              {theory.items?.length || 0} mục ghi chú
            </div>
          </div>
        ))}

        {/* Ô bấm tạo mới (+) */}
        {isCreating ? (
          <form
            onSubmit={handleCreate}
            className="flex h-48 flex-col justify-between rounded-2xl border-2 border-dashed border-cyan-400 bg-[#00223a] p-6"
          >
            <input
              type="text"
              placeholder="Đặt tên theory..."
              value={newTheoryName}
              onChange={(e) => setNewTheoryName(e.target.value)}
              className="w-full rounded-lg border border-cyan-400/50 bg-transparent p-2 text-white outline-none focus:border-cyan-300"
              autoFocus
            />
            <p className="text-xs text-emerald-400">đặt tên trước khi tạo thư viện mục</p>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-cyan-500 py-1.5 text-sm font-bold text-[#001829] hover:bg-cyan-400"
              >
                Tạo
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-gray-500 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div
            onClick={() => setIsCreating(true)}
            className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-500/50 bg-[#002845]/50 transition duration-200 hover:border-cyan-300 hover:bg-[#002845]"
          >
            <span className="text-6xl font-light text-cyan-300">+</span>
            <span className="mt-2 text-xs text-emerald-400">đặt tên trước khi tạo thư viện mục</span>
          </div>
        )}
      </div>
    </div>
  );
}