import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { saveTheoryToFile } from '../services/storage';

const generateId = (prefix) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

// 🌟 Helper: Nén ảnh WebP sang Blob / DataURL
const compressImageToBlob = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', quality);
        canvas.toBlob(
          (blob) => {
            resolve({ blob, dataUrl });
          },
          'image/webp',
          quality
        );
      };
    };
  });
};

// 🌟 Helper: Lưu file ảnh ra ổ đĩa nếu chạy trên Tauri (Desktop)
const saveImageToLocalFolder = async (file) => {
  const { blob, dataUrl } = await compressImageToBlob(file, 1200, 0.7);

  if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
    try {
      const { mkdir, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      const { appLocalDataDir, join } = await import('@tauri-apps/api/path');

      // 1. Tạo thư mục Anchor_Images trong AppLocalData
      await mkdir('Anchor_Images', {
        baseDir: BaseDirectory.AppLocalData,
        recursive: true,
      });

      // 2. Tạo tên file duy nhất
      const fileName = `Anchor_Images/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;

      // 3. Ghi file nhị phân ảnh xuống đĩa
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await writeFile(fileName, uint8Array, {
        baseDir: BaseDirectory.AppLocalData,
      });

      // 4. Lấy đường dẫn tuyệt đối và chuyển sang URL hiển thị UI
      const baseDirPath = await appLocalDataDir();
      const fullPath = await join(baseDirPath, fileName);
      const displayUrl = convertFileSrc(fullPath);

      return { path: fullPath, displayUrl };
    } catch (error) {
      console.warn('Tauri FS API error, fallback to DataURL:', error);
    }
  }

  return { path: dataUrl, displayUrl: dataUrl };
};

export default function TheoryEditor({
  theory,
  onUpdateTheory,
  onBack,
  themeColor = 'light',
  onThemeChange,
}) {
  const [items, setItems] = useState(theory.items || []);
  const [selectedItemId, setSelectedItemId] = useState(
    theory.items?.[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const [tagRules, setTagRules] = useState(theory.tagRules || []);
  const [newExt, setNewExt] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState(null);

  // Toggle Right Sidebar (Tags)
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Settings State (Ctrl + E)
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState('text-sm');
  const [fontFamily, setFontFamily] = useState('font-sans');

  const searchInputRef = useRef(null);
  const isLight = themeColor === 'light';

  const activeItem = items.find((item) => item.id === selectedItemId);
  const activeBlocks = activeItem?.blocks || [];

  // 🌟 ĐƯA HÀM CẬP NHẬT LÊN TRƯỚC USEEFFECT (ĐỂ TRÁNH LỖI HOISTING)
  function updateTheoryData(newItems, newRules = tagRules) {
    setItems(newItems);
    setTagRules(newRules);

    const updatedTheory = {
      ...theory,
      items: newItems,
      tagRules: newRules,
      updatedAt: Date.now(),
    };

    onUpdateTheory(updatedTheory);
    saveTheoryToFile(updatedTheory);
  }

  // 1. Hotkeys: F5 (Focus Search) & Ctrl + E (Settings Modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Paste Image -> Save to Local Images Folder (Save Path Only)
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!selectedItemId) return;

      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = clipboardItems[i].getAsFile();
          if (!file) break;

          const { path, displayUrl } = await saveImageToLocalFolder(file);

          const newImageBlock = {
            id: generateId('block'),
            type: 'image',
            content: path,       // Chỉ lưu đường dẫn file trên ổ đĩa
            displaySrc: displayUrl, // URL cho giao diện Webview
            caption: '',
          };

          setItems((prevItems) => {
            const currentActiveItem = prevItems.find((item) => item.id === selectedItemId);
            if (!currentActiveItem) return prevItems;

            const blocks = currentActiveItem.blocks || [];
            let updatedBlocks = [];

            if (activeBlockId) {
              const currentIndex = blocks.findIndex((b) => b.id === activeBlockId);
              if (currentIndex !== -1) {
                updatedBlocks = [...blocks];
                updatedBlocks.splice(currentIndex + 1, 0, newImageBlock);
              } else {
                updatedBlocks = [...blocks, newImageBlock];
              }
            } else {
              updatedBlocks = [...blocks, newImageBlock];
            }

            const updatedItems = prevItems.map((item) =>
              item.id === selectedItemId ? { ...item, blocks: updatedBlocks } : item
            );

            updateTheoryData(updatedItems, tagRules);
            return updatedItems;
          });

          setActiveBlockId(newImageBlock.id);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedItemId, activeBlockId, tagRules, theory]);

  const autoResizeTextarea = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: generateId('item'),
      title: newItemTitle.trim(),
      blocks: [
        { id: generateId('block'), type: 'text', content: '', isPreview: false }
      ],
      description: '',
      createdAt: Date.now(),
    };

    const updated = [newItem, ...items];
    updateTheoryData(updated);
    setSelectedItemId(newItem.id);
    setNewItemTitle('');
    setIsAddingItem(false);
  };

  const handleDeleteItem = () => {
    if (!selectedItemId) return;
    const updated = items.filter((item) => item.id !== selectedItemId);
    updateTheoryData(updated);
    setSelectedItemId(updated[0]?.id || null);
    setConfirmDelete(false);
  };

  const handleItemChange = (field, value) => {
    if (!activeItem) return;
    const updated = items.map((item) =>
      item.id === activeItem.id ? { ...item, [field]: value } : item
    );
    updateTheoryData(updated);
  };

  const handleAddBlock = (type) => {
    if (!activeItem) return;
    const newBlock = {
      id: generateId('block'),
      type,
      content: '',
      language: type === 'code' ? 'js' : '',
      isPreview: false,
    };

    let updatedBlocks = [];
    if (activeBlockId) {
      const currentIndex = activeBlocks.findIndex((b) => b.id === activeBlockId);
      if (currentIndex !== -1) {
        updatedBlocks = [...activeBlocks];
        updatedBlocks.splice(currentIndex + 1, 0, newBlock);
      } else {
        updatedBlocks = [...activeBlocks, newBlock];
      }
    } else {
      updatedBlocks = [...activeBlocks, newBlock];
    }

    handleItemChange('blocks', updatedBlocks);
    setActiveBlockId(newBlock.id);
  };

  const handleBlockChange = (blockId, field, value) => {
    if (!activeItem) return;
    const updatedBlocks = activeBlocks.map((b) =>
      b.id === blockId ? { ...b, [field]: value } : b
    );
    handleItemChange('blocks', updatedBlocks);
  };

  const handleRemoveBlock = (blockId) => {
    if (!activeItem) return;
    const updatedBlocks = activeBlocks.filter((b) => b.id !== blockId);
    handleItemChange('blocks', updatedBlocks);
    if (activeBlockId === blockId) setActiveBlockId(null);
  };

  const handleRemoveRule = (indexToRemove) => {
    const updatedRules = tagRules.filter((_, idx) => idx !== indexToRemove);
    updateTheoryData(items, updatedRules);
  };

  const extractTagsFromTitle = (title) => {
    if (!title || !title.includes('.')) return [];
    return title
      .split('.')
      .slice(1)
      .filter((tag) => tag.trim() !== '');
  };

  const getTagColorClass = (tags) => {
    if (!tags || tags.length === 0) return 'border-transparent';
    const lastTag = tags[tags.length - 1].toLowerCase();
    let hash = 0;
    for (let i = 0; i < lastTag.length; i++) {
      hash = lastTag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'border-l-cyan-500',
      'border-l-emerald-500',
      'border-l-purple-500',
      'border-l-amber-500',
      'border-l-rose-500',
      'border-l-blue-500',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const autoTags = activeItem ? extractTagsFromTitle(activeItem.title) : [];

  const filteredItems = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const itemTags = extractTagsFromTitle(item.title);
    if (q.startsWith('.')) {
      return itemTags.some((tag) => tag.toLowerCase().includes(q.slice(1)));
    }
    return (
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newExt.trim() || !newLabel.trim()) return;
    const ext = newExt.trim().startsWith('.') ? newExt.trim() : `.${newExt.trim()}`;
    const updatedRules = [...tagRules, { ext, label: newLabel.trim() }];
    updateTheoryData(items, updatedRules);
    setNewExt('');
    setNewLabel('');
    setIsAddingRule(false);
  };

  const themeBgMap = {
    light: 'bg-slate-50 text-slate-900 border-slate-200',
    ocean: 'bg-[#020b14] text-slate-100 border-white/20',
    cyber: 'bg-[#0a0014] text-cyan-100 border-purple-500/20',
    obsidian: 'bg-[#000000] text-gray-100 border-white/20',
    forest: 'bg-[#02120b] text-emerald-100 border-emerald-500/20',
  };

  return (
    <main className={`relative flex h-screen min-h-[500px] w-full overflow-hidden transition-colors duration-300 ${themeBgMap[themeColor] || themeBgMap.light} ${fontFamily}`}>
      {/* Background Glow */}
      {isLight ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#cbd5e1_0%,transparent_70%)] opacity-60" />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#153854_0%,transparent_70%)] opacity-40" />
      )}

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`relative z-10 flex w-60 shrink-0 flex-col border-r p-3 backdrop-blur-2xl sm:w-64 ${
        isLight ? 'border-slate-200 bg-white/90 text-slate-900' : 'border-white/20 bg-[#061523]/95 text-white'
      }`}>
        <button
          type="button"
          onClick={onBack}
          className={`group mb-3 flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
            isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg border text-sm font-bold ${
            isLight ? 'border-slate-300 text-cyan-600' : 'border-white/20 text-cyan-400'
          }`}>
            ←
          </span>
          <span className="font-semibold">Back to library</span>
        </button>

        <div className="mb-3 px-1">
          <h1 title={theory.title} className="break-words text-lg font-bold tracking-tight">
            ⚓ {theory.title}
          </h1>
          <p className={`mt-0.5 text-[11px] font-medium ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>
            {items.length} notes
          </p>
        </div>

        <div className={`mb-2 flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-white/15'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Content</span>
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
            isLight ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
          }`}>
            {filteredItems.length}
          </span>
        </div>

        {/* Item List */}
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {filteredItems.map((item, index) => {
            const itemTags = extractTagsFromTitle(item.title);
            const selected = selectedItemId === item.id;
            const borderLeftClass = getTagColorClass(itemTags);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedItemId(item.id);
                  setConfirmDelete(false);
                }}
                className={`group relative w-full overflow-hidden rounded-xl border border-l-4 p-2.5 text-left transition-all ${borderLeftClass} ${
                  selected
                    ? isLight
                      ? 'border-cyan-500 bg-cyan-50 text-slate-900 shadow-sm'
                      : 'border-cyan-400 bg-cyan-500/20 text-white shadow-md'
                    : isLight
                      ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100 text-slate-700'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold ${
                    selected 
                      ? isLight ? 'bg-cyan-600 text-white' : 'bg-cyan-400 text-black' 
                      : isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-slate-400'
                  }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`break-words text-xs font-bold leading-4 ${selected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-700' : 'text-slate-200')}`}>
                      {item.title || 'Untitled note'}
                    </p>
                    {itemTags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {itemTags.map((tag, idx) => (
                          <span key={idx} className={`rounded border px-1 py-0.2 font-mono text-[9px] font-semibold ${
                            isLight ? 'border-cyan-200 bg-cyan-100/60 text-cyan-800' : 'border-cyan-400/30 bg-cyan-950/80 text-cyan-300'
                          }`}>
                            .{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add New Item */}
        <div className={`mt-2 border-t pt-2 ${isLight ? 'border-slate-200' : 'border-white/15'}`}>
          {isAddingItem ? (
            <form onSubmit={handleAddItem} className={`space-y-2 rounded-xl border p-2.5 ${isLight ? 'border-cyan-400 bg-white shadow-md' : 'border-cyan-400/40 bg-[#03101c]'}`}>
              <input
                type="text"
                placeholder="Item title..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${
                  isLight ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500' : 'border-white/20 bg-black/40 text-white focus:border-cyan-400'
                }`}
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button type="submit" className={`flex-1 rounded-lg py-1 text-xs font-bold ${isLight ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-cyan-400 text-black hover:bg-cyan-300'}`}>
                  Create item
                </button>
                <button type="button" onClick={() => setIsAddingItem(false)} className={`rounded-lg border px-2.5 text-xs ${isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-white/20 text-slate-300 hover:bg-white/10'}`}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-2 text-xs font-bold transition ${
                isLight 
                  ? 'border-cyan-500/40 bg-cyan-50 text-cyan-700 hover:border-cyan-600 hover:bg-cyan-100/50' 
                  : 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              <span className="text-base">+</span> Add new item
            </button>
          )}
        </div>
      </aside>

      {/* ================= CENTER AREA: OBSIDIAN CANVAS ================= */}
      <section className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Sticky Header Bar */}
        <header className={`sticky top-0 z-20 flex min-h-[56px] shrink-0 items-center justify-between gap-3 border-b px-6 backdrop-blur-2xl ${
          isLight ? 'border-slate-200 bg-white/80' : 'border-white/20 bg-[#061523]/95'
        }`}>
          <div className="relative flex-1 max-w-lg">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search content... (Press F5 to search, Ctrl+E for Settings, Ctrl+V to paste image)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl border py-1.5 pl-8 pr-12 text-xs outline-none transition-all ${
                isLight 
                  ? 'border-slate-300 bg-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white' 
                  : 'border-white/20 bg-black/40 text-white focus:border-cyan-400'
              }`}
            />
            <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[9px] font-mono ${
              isLight ? 'border-slate-300 text-slate-500' : 'border-white/20 text-slate-400'
            }`}>
              F5
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
                isLight 
                  ? 'border-slate-300 bg-slate-100 text-slate-700 hover:border-cyan-500 hover:text-cyan-700' 
                  : 'border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400 hover:text-cyan-300'
              }`}
            >
              ⚙️ Settings (Ctrl+E)
            </button>

            <button
              type="button"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className={`rounded-xl border px-2.5 py-1 text-xs font-bold transition ${
                showRightSidebar
                  ? isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-white'
                  : isLight ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
              }`}
              title={showRightSidebar ? 'Hide Tags Sidebar' : 'Show Tags Sidebar'}
            >
              {showRightSidebar ? '▶ Hide Tags' : '◀ Show Tags'}
            </button>

            {activeItem && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-red-500/50 bg-red-950/90 p-1">
                    <span className="text-[11px] font-bold text-red-200 pl-1.5">Delete?</span>
                    <button type="button" onClick={handleDeleteItem} className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-500">
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded bg-gray-700 px-2 py-0.5 text-xs text-slate-200">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    title="Delete this item"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Editor Main Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-12 lg:px-20">
          {activeItem ? (
            <div className="mx-auto w-full max-w-5xl space-y-4">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/30 pb-3">
                <input
                  type="text"
                  value={activeItem.title || ''}
                  onChange={(e) => handleItemChange('title', e.target.value)}
                  placeholder="Document title..."
                  className={`min-w-[200px] flex-1 bg-transparent text-2xl font-extrabold outline-none tracking-tight ${
                    isLight ? 'text-slate-900 placeholder:text-slate-300' : 'text-white placeholder:text-slate-600'
                  }`}
                />

                <div className="flex items-center gap-1.5 rounded-xl border border-slate-300/30 bg-black/5 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => handleAddBlock('text')}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 transition"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('code')}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-500 hover:bg-cyan-500/10 transition"
                  >
                    + Code
                  </button>
                  <span className="px-1 text-[11px] text-slate-400 italic">
                    (Auto-saves image to folder on Ctrl+V)
                  </span>
                </div>
              </div>

              {/* Dynamic Blocks List */}
              <div className="space-y-4">
                {activeBlocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setActiveBlockId(block.id)}
                    className="group relative transition-all"
                  >
                    <div className="absolute -top-3 right-2 z-20 hidden gap-1 rounded-lg border border-slate-300/30 bg-black/70 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:flex group-hover:opacity-100">
                      {block.type === 'text' && (
                        <button
                          type="button"
                          onClick={() => handleBlockChange(block.id, 'isPreview', !block.isPreview)}
                          className="hover:text-cyan-400 font-semibold"
                        >
                          {block.isPreview ? '✏️ Edit' : '👁️ View'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(block.id)}
                        className="hover:text-red-400 font-semibold ml-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 1. TEXT BLOCK */}
                    {block.type === 'text' && (
                      <div className="w-full">
                        {block.isPreview ? (
                          <div
                            onClick={() => handleBlockChange(block.id, 'isPreview', false)}
                            className={`prose ${isLight ? 'prose-slate' : 'prose-invert'} max-w-none ${fontSize} leading-relaxed cursor-pointer whitespace-pre-wrap`}
                          >
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {block.content || '*Click here to write text...*'}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <textarea
                            value={block.content || ''}
                            onInput={autoResizeTextarea}
                            onFocus={() => setActiveBlockId(block.id)}
                            onChange={(e) => handleBlockChange(block.id, 'content', e.target.value)}
                            onBlur={() => handleBlockChange(block.id, 'isPreview', true)}
                            placeholder="Type free-form text here (Markdown & LaTeX supported)..."
                            spellCheck={false}
                            rows={2}
                            autoFocus
                            className={`w-full overflow-hidden resize-none bg-transparent ${fontSize} ${
                              isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-slate-100 placeholder:text-slate-600'
                            } outline-none border-none p-0 leading-relaxed shadow-none focus:ring-0 whitespace-pre-wrap`}
                          />
                        )}
                      </div>
                    )}

                    {/* 2. CODE BLOCK */}
                    {block.type === 'code' && (
                      <div className="relative my-3 overflow-hidden rounded-xl border border-slate-700/60 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-700/60 bg-[#1e1e1e] px-4 py-1.5 text-xs text-slate-400 font-mono">
                          <input
                            type="text"
                            value={block.language || 'js'}
                            onChange={(e) => handleBlockChange(block.id, 'language', e.target.value)}
                            placeholder="Language (js, py, cpp...)"
                            className="bg-transparent text-cyan-400 font-bold outline-none border-b border-transparent focus:border-cyan-400"
                          />
                          <span className="text-[10px] text-slate-500 uppercase">Code Block</span>
                        </div>

                        <div className="flex bg-[#2d2d2d] font-mono leading-relaxed">
                          <div className="select-none py-3 pl-3 pr-3 text-right font-mono text-xs text-slate-500 border-r border-slate-700/60 bg-[#252525]">
                            {(block.content || '').split('\n').map((_, i) => (
                              <div key={i}>{i + 1}</div>
                            ))}
                          </div>

                          <div className="relative flex-1 p-3">
                            <textarea
                              value={block.content || ''}
                              onInput={autoResizeTextarea}
                              onFocus={() => setActiveBlockId(block.id)}
                              onChange={(e) => handleBlockChange(block.id, 'content', e.target.value)}
                              placeholder="// Type code here..."
                              spellCheck={false}
                              rows={3}
                              className={`w-full overflow-hidden resize-none bg-transparent font-mono ${fontSize} text-cyan-200 outline-none leading-relaxed caret-white`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. LOCAL FILE IMAGE BLOCK */}
                    {block.type === 'image' && (
                      <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-slate-300/30 bg-black/10 p-3 shadow-lg backdrop-blur">
                        <div className="relative overflow-hidden rounded-xl border border-slate-700/50 shadow-md">
                          <img
                            src={block.displaySrc || block.content}
                            alt={block.caption || 'Pasted image'}
                            className="max-h-[550px] w-auto object-contain rounded-xl"
                          />
                        </div>
                        <span title={block.content} className="mt-1 text-[10px] font-mono text-slate-500 truncate max-w-full px-2">
                          📁 {block.content}
                        </span>
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => handleBlockChange(block.id, 'caption', e.target.value)}
                          placeholder="Image caption (optional)..."
                          className={`mt-1 w-full max-w-md bg-transparent text-center text-xs italic outline-none border-b border-transparent focus:border-cyan-400 ${
                            isLight ? 'text-slate-600 placeholder:text-slate-400' : 'text-slate-300 placeholder:text-slate-600'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`flex h-full items-center justify-center italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Select a note from the left sidebar or click "+ Add new item" to get started!
            </div>
          )}
        </div>
      </section>

      {/* ================= RIGHT SIDEBAR: TAGS ================= */}
      {showRightSidebar && (
        <aside className={`relative z-10 flex w-60 shrink-0 flex-col gap-3 border-l p-3 backdrop-blur-2xl transition-all duration-300 ${
          isLight ? 'border-slate-200 bg-white/90 text-slate-900' : 'border-white/20 bg-[#061523]/95 text-white'
        }`}>
          <div className={`flex flex-col h-1/2 rounded-xl border p-2.5 overflow-hidden ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/20 bg-[#081b2c]'}`}>
            <div className={`mb-1.5 flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <span className={`text-[11px] font-bold uppercase ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>Tag Rules</span>
              <button
                type="button"
                onClick={() => setIsAddingRule(!isAddingRule)}
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'}`}
              >
                +
              </button>
            </div>

            {isAddingRule && (
              <form onSubmit={handleAddRule} className={`mb-2 space-y-1 p-2 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-white/10'}`}>
                <input
                  type="text"
                  placeholder="Ext (e.g. .dt)"
                  value={newExt}
                  onChange={(e) => setNewExt(e.target.value)}
                  className={`w-full rounded border p-1 text-xs outline-none ${isLight ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/20 bg-black text-white'}`}
                  required
                />
                <input
                  type="text"
                  placeholder="Rule label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className={`w-full rounded border p-1 text-xs outline-none ${isLight ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/20 bg-black text-white'}`}
                  required
                />
                <button type="submit" className={`w-full rounded py-1 text-[11px] font-bold ${isLight ? 'bg-cyan-600 text-white' : 'bg-cyan-400 text-black'}`}>
                  Save Rule
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {tagRules.map((rule, idx) => (
                <div key={idx} className={`flex items-center justify-between gap-2 text-xs rounded border p-1 ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/30'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded border px-1 py-0.2 font-mono font-bold text-[10px] ${isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300'}`}>
                      {rule.ext}
                    </span>
                    <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{rule.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-slate-400 hover:text-red-500 font-bold px-1 text-[11px]"
                    title="Delete this rule"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`flex flex-col h-1/2 rounded-xl border p-2.5 overflow-hidden ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/20 bg-[#081b2c]'}`}>
            <span className={`mb-1.5 block border-b pb-1.5 text-[11px] font-bold uppercase ${isLight ? 'border-slate-200 text-cyan-700' : 'border-white/10 text-cyan-300'}`}>
              Detected Tags
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {autoTags.length > 0 ? (
                autoTags.map((tag, idx) => {
                  const matchedRule = tagRules.find((r) => r.ext === `.${tag}`);
                  return (
                    <div key={idx} className={`flex items-center justify-between rounded border p-1.5 text-xs ${isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-black/40'}`}>
                      <span className={`font-mono font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>.{tag}</span>
                      <span className="text-[10px] text-slate-400">
                        {matchedRule ? matchedRule.label : 'Free Tag'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  Auto-extracted tags when title contains dots (e.g. note.dt.t7)
                </p>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 ${
            isLight ? 'border-slate-300 bg-white text-slate-900' : 'border-cyan-400/40 bg-[#061523] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-white/15'}`}>
              <h3 className="text-base font-bold">⚙️ Editor Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className={`mb-1.5 block text-xs font-bold uppercase ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Editor Font Size</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Small', val: 'text-xs' },
                  { label: 'Medium', val: 'text-sm' },
                  { label: 'Large', val: 'text-base' },
                  { label: 'Extra Large', val: 'text-lg' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFontSize(item.val)}
                    className={`rounded-lg border py-1.5 text-xs font-bold ${
                      fontSize === item.val
                        ? isLight ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`mb-1.5 block text-xs font-bold uppercase ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Font Family</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sans-Serif', val: 'font-sans' },
                  { label: 'Monospace', val: 'font-mono' },
                  { label: 'Serif', val: 'font-serif' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFontFamily(item.val)}
                    className={`rounded-lg border py-1.5 text-xs font-bold ${
                      fontFamily === item.val
                        ? isLight ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`mb-1.5 block text-xs font-bold uppercase ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Theme Color</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Clean Light ☀️', val: 'light' },
                  { label: 'Ocean Dark 🌊', val: 'ocean' },
                  { label: 'Neon Cyber 🔮', val: 'cyber' },
                  { label: 'Deep Obsidian 🖤', val: 'obsidian' },
                  { label: 'Forest Night 🌲', val: 'forest' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onThemeChange && onThemeChange(item.val)}
                    className={`rounded-lg border py-1.5 text-xs font-bold ${
                      themeColor === item.val
                        ? isLight ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className={`w-full rounded-xl py-2 text-xs font-bold ${
                isLight ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-cyan-400 text-black hover:bg-cyan-300'
              }`}
            >
              Save & Close (Esc)
            </button>
          </div>
        </div>
      )}
    </main>
  );
}