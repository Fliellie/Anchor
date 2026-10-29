import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function TheoryEditor({ theory, onUpdateTheory, onBack }) {
  const [items, setItems] = useState(theory.items || []);
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');

  // State tạo mục mới ở cột trái
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  // State quản lý quy tắc tags (Khung trên bên phải)
  const [tagRules, setTagRules] = useState(theory.tagRules || [
    { ext: '.dt', label: 'điện từ' }
  ]);
  const [newExt, setNewExt] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isMathPreview, setIsMathPreview] = useState(false);

  // Cập nhật dữ liệu về App
  const updateTheoryData = (newItems, newRules = tagRules) => {
    setItems(newItems);
    setTagRules(newRules);
    onUpdateTheory({
      ...theory,
      items: newItems,
      tagRules: newRules,
    });
  };

  // 1. Logic tạo mục mới (mới nhất xếp trên đầu)
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: `item-${Date.now()}`,
      title: newItemTitle.trim(),
      quickType: 'code', // Chế độ mặc định: 'code' hoặc 'text'
      quickCode: '',
      quickText: '',
      description: '',
      createdAt: Date.now(),
    };

    const updated = [newItem, ...items];
    updateTheoryData(updated);
    setSelectedItemId(newItem.id);
    setNewItemTitle('');
    setIsAddingItem(false);
  };

  // 2. Logic Xóa mục
  const handleDeleteItem = () => {
    if (!selectedItemId) return;
    const updated = items.filter((item) => item.id !== selectedItemId);
    updateTheoryData(updated);
    setSelectedItemId(updated[0]?.id || null);
    setConfirmDelete(false);
  };

  // Item đang chọn
  const activeItem = items.find((item) => item.id === selectedItemId);

  // Cập nhật thuộc tính của item
  const handleItemChange = (field, value) => {
    if (!activeItem) return;
    const updated = items.map((item) =>
      item.id === activeItem.id ? { ...item, [field]: value } : item
    );
    updateTheoryData(updated);
  };

  // 3. Logic tự động tách tags từ tên mục
  const extractTagsFromTitle = (title) => {
    if (!title || !title.includes('.')) return [];
    const parts = title.split('.');
    return parts.slice(1).filter((p) => p.trim() !== '');
  };

  const autoTags = activeItem ? extractTagsFromTitle(activeItem.title) : [];

  // 4. Logic tìm kiếm
  const filteredItems = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const itemTags = extractTagsFromTitle(item.title);

    if (q.startsWith('.')) {
      const searchExt = q.slice(1);
      return itemTags.some((t) => t.toLowerCase().includes(searchExt));
    }

    if (item.title?.toLowerCase().includes(q)) return true;
    return item.description?.toLowerCase().includes(q);
  });

  // 5. Thêm Quy tắc Tags mới
  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newExt.trim() || !newLabel.trim()) return;
    
    const formattedExt = newExt.startsWith('.') ? newExt.trim() : `.${newExt.trim()}`;
    const updatedRules = [...tagRules, { ext: formattedExt, label: newLabel.trim() }];
    
    updateTheoryData(items, updatedRules);
    setNewExt('');
    setNewLabel('');
    setIsAddingRule(false);
  };

  // Tính số dòng cho khung Quick Code
  const lineNumbers = activeItem?.quickCode
    ? activeItem.quickCode.split('\n').map((_, i) => i + 1)
    : [1];

  return (
    <div className="flex h-screen w-screen bg-[#001829] font-sans text-cyan-100">
      {/* ================= CỘT TRÁI: SIDEBAR MỤC ================= */}
      <div className="flex w-72 flex-col border-r-2 border-cyan-500/30 bg-[#001f35] p-4">
        <button
          onClick={onBack}
          className="mb-4 text-left text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-200"
        >
          ← Back
        </button>

        <h2 className="mb-4 truncate text-xl font-extrabold text-amber-500 italic">
          ⚡ {theory.title}
        </h2>

        {/* Danh sách mục */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredItems.map((item) => {
            const itemTags = extractTagsFromTitle(item.title);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                  selectedItemId === item.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-lg'
                    : 'border-transparent bg-[#002845]/60 hover:border-cyan-500/40 text-cyan-200'
                }`}
              >
                <p className="font-bold truncate">{item.title || 'Mục không tên'}</p>
                {itemTags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {itemTags.map((tag, idx) => (
                      <span key={idx} className="rounded bg-cyan-900/60 px-1.5 py-0.5 text-[10px] text-cyan-300">
                        .{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form thêm mục */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20">
          {isAddingItem ? (
            <form onSubmit={handleAddItem} className="space-y-2">
              <input
                type="text"
                placeholder="Nhập tên mục (vd: camungtu.dt.t7)..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-cyan-400 bg-[#001829] px-3 py-2 text-xs text-white outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-500 py-1.5 text-xs font-bold text-[#001829] hover:bg-emerald-400"
                >
                  Tạo
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="rounded-lg border border-gray-500 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cyan-400/60 bg-cyan-500/10 py-3 font-bold text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-500/20"
            >
              <span className="text-xl">+</span> add mục
            </button>
          )}
        </div>
      </div>

      {/* ================= KHU VỰC GIỮA: EDITOR ================= */}
      <div className="flex flex-1 flex-col p-6 overflow-hidden">
        {/* Thanh tìm kiếm & Thùng rác */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm tên, nội dung, hoặc tag dạng .t7..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-2 border-cyan-400/60 bg-[#00223a] px-5 py-2.5 text-sm text-cyan-100 outline-none focus:border-cyan-300"
            />
          </div>

          {/* Nút Xóa mục */}
          {activeItem && (
            <div className="relative">
              {confirmDelete ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-950/80 p-1.5">
                  <span className="text-xs text-red-200">Xóa mục?</span>
                  <button
                    onClick={handleDeleteItem}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-500"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded bg-gray-600 px-2 py-1 text-xs text-gray-200"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Xóa mục"
                  className="rounded-2xl border-2 border-cyan-500/40 p-2.5 text-cyan-400 hover:border-red-400 hover:text-red-400 transition"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {activeItem ? (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            
            {/* THÊM BỘ NÚT SWITCH CODE / TEXT NGAY BÊN PHẢI TÊN MỤC */}
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                value={activeItem.title}
                onChange={(e) => handleItemChange('title', e.target.value)}
                placeholder="tên mục..."
                className="w-1/2 border-b-2 border-cyan-400 bg-transparent text-xl font-bold text-cyan-200 outline-none focus:border-cyan-300 pb-1"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleItemChange('quickType', 'code')}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold uppercase transition ${
                    (activeItem.quickType || 'code') === 'code'
                      ? 'bg-cyan-400 text-[#001829] shadow-md'
                      : 'border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10'
                  }`}
                >
                  code
                </button>

                <button
                  onClick={() => handleItemChange('quickType', 'text')}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold uppercase transition ${
                    activeItem.quickType === 'text'
                      ? 'bg-cyan-400 text-[#001829] shadow-md'
                      : 'border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10'
                  }`}
                >
                  text
                </button>
              </div>
            </div>

            {/* Ô 1: QUICK USING BLOCK (ĐỔI CHẾ ĐỘ CODE HOẶC TEXT) */}
            <div className="flex flex-col min-h-[260px] rounded-2xl border-2 border-cyan-500/40 bg-[#001f35] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400/80">
                  quick using ({(activeItem.quickType || 'code')})
                </span>

                {activeItem.quickType === 'text' && (
                  <button
                    onClick={() => setIsMathPreview(!isMathPreview)}
                    className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/30"
                  >
                    {isMathPreview ? '✏️ Sửa Text/Toán' : '👁️ Preview Math'}
                  </button>
                )}
              </div>

              {/* CHẾ ĐỘ 1: CODE (Có số thứ tự dòng) */}
              {(activeItem.quickType || 'code') === 'code' && (
                <div className="flex flex-1 rounded-xl bg-[#001829] p-3 font-mono text-sm">
                  <div className="flex flex-col select-none border-r border-cyan-500/30 pr-3 text-right text-cyan-500/50">
                    {lineNumbers.map((num) => (
                      <span key={num} className="leading-6">
                        {num}
                      </span>
                    ))}
                  </div>
                  <textarea
                    value={activeItem.quickCode || ''}
                    onChange={(e) => handleItemChange('quickCode', e.target.value)}
                    placeholder="// Nhập code lý thuyết tại đây..."
                    className="flex-1 resize-none bg-transparent pl-3 text-cyan-100 outline-none leading-6 font-mono"
                  />
                </div>
              )}

              {/* CHẾ ĐỘ 2: TEXT (Gõ văn bản & công thức toán LaTeX) */}
              {activeItem.quickType === 'text' && (
                <div className="flex flex-1 rounded-xl bg-[#001829] p-3 text-sm">
                  {isMathPreview ? (
                    <div className="prose prose-invert flex-1 overflow-y-auto p-1 text-cyan-100 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {activeItem.quickText || '*Chưa có nội dung text/toán*'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      value={activeItem.quickText || ''}
                      onChange={(e) => handleItemChange('quickText', e.target.value)}
                      placeholder="Nhập văn bản hoặc công thức toán LaTeX (ví dụ: $W_{d1} = \frac{1}{2}mv_1^2$)..."
                      className="flex-1 resize-none bg-transparent text-cyan-100 outline-none leading-relaxed"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Ô 2: MÔ TẢ NỘI DUNG */}
            <div className="flex flex-col flex-1 min-h-[180px] rounded-2xl border-2 border-cyan-500/40 bg-[#001f35] p-4">
              <span className="mb-2 text-xs font-bold uppercase text-cyan-400/80 tracking-wider">
                mô tả
              </span>
              <textarea
                value={activeItem.description}
                onChange={(e) => handleItemChange('description', e.target.value)}
                placeholder="Ghi chú chi tiết bài học..."
                className="flex-1 w-full resize-y bg-transparent text-sm text-cyan-100 outline-none leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-cyan-400/40 italic">
            Chọn một mục ở danh sách bên trái hoặc bấm "+ add mục" để bắt đầu!
          </div>
        )}
      </div>

      {/* ================= CỘT PHẢI: TAGS & QUY TẮC ================= */}
      <div className="flex w-72 flex-col gap-4 border-l-2 border-cyan-500/30 bg-[#001f35] p-4">
        {/* KHUNG TRÊN: Quy tắc Tags */}
        <div className="flex flex-col h-1/2 rounded-2xl border-2 border-cyan-500/40 bg-[#001829] p-3 overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-cyan-300">Quy tắc Tags</span>
            <button
              onClick={() => setIsAddingRule(!isAddingRule)}
              className="rounded-lg bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300 hover:bg-cyan-500/40"
            >
              +
            </button>
          </div>

          {isAddingRule && (
            <form onSubmit={handleAddRule} className="mb-2 space-y-1 bg-[#00223a] p-2 rounded-lg">
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder=".dt"
                  value={newExt}
                  onChange={(e) => setNewExt(e.target.value)}
                  className="w-1/3 rounded border border-cyan-500/40 bg-[#001829] p-1 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="điện từ"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-2/3 rounded border border-cyan-500/40 bg-[#001829] p-1 text-xs text-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-cyan-500 py-1 text-[11px] font-bold text-[#001829]"
              >
                Lưu quy tắc
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {tagRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="rounded bg-cyan-500/20 border border-cyan-400/40 px-2 py-1 font-bold text-cyan-300">
                  {rule.ext}
                </span>
                <span className="text-cyan-200">{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KHUNG DƯỚI: Tags bóc tách */}
        <div className="flex flex-col h-1/2 rounded-2xl border-2 border-cyan-500/40 bg-[#001829] p-3 overflow-hidden">
          <span className="mb-2 text-xs font-bold uppercase text-cyan-300">
            Tags 
          </span>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {autoTags.length > 0 ? (
              autoTags.map((tag, idx) => {
                const matchedRule = tagRules.find((r) => r.ext === `.${tag}`);
                return (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-[#00223a] p-2 text-xs">
                    <span className="font-mono font-bold text-cyan-300">.{tag}</span>
                    <span className="text-[11px] text-cyan-400/70">
                      {matchedRule ? matchedRule.label : 'Tag tự do'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-cyan-400/40 italic">
                Tự hiện các tags ở đây nếu tên mục có dấu "." (ví dụ: a.bt.7)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}