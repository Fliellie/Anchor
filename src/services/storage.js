// src/services/storage.js

// Kiểm tra môi trường xem ứng dụng có đang chạy trên Desktop Tauri hay không
export const isTauri = () => {
  return typeof window !== 'undefined' && (!!window.__TAURI_INTERNALS__ || !!window.__TAURI__);
};

/**
 * Lưu toàn bộ dữ liệu một Note/Theory thành file JSON riêng biệt trên đĩa cứng
 * Đường dẫn: Documents/AnchorNotes/<theory_id>.json
 */
export const saveTheoryToFile = async (theory) => {
  if (!theory || !theory.id) return;

  if (isTauri()) {
    try {
      const { mkdir, writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      
      // 1. Tự động tạo thư mục AnchorNotes trong thư mục Documents
      await mkdir('AnchorNotes', {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });

      // 2. Định dạng tên file JSON chuẩn Obsidian
      const filePath = `AnchorNotes/${theory.id}.json`;
      const content = JSON.stringify(theory, null, 2);

      // 3. Ghi dữ liệu xuống đĩa
      await writeTextFile(filePath, content, {
        baseDir: BaseDirectory.Document,
      });
      console.log(`[Tauri FS] Saved note to Documents/${filePath}`);
      return;
    } catch (error) {
      console.error('[Tauri FS Error] Save failed, fallback to localStorage:', error);
    }
  }

  // Fallback an toàn cho Web Browser
  localStorage.setItem(`anchor_theory_${theory.id}`, JSON.stringify(theory));
};

/**
 * Đọc dữ liệu ghi chú từ file JSON trong thư mục Documents/AnchorNotes/
 */
export const loadTheoryFromFile = async (theoryId) => {
  if (isTauri()) {
    try {
      const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const filePath = `AnchorNotes/${theoryId}.json`;
      const content = await readTextFile(filePath, {
        baseDir: BaseDirectory.Document,
      });
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[Tauri FS] File Documents/AnchorNotes/${theoryId}.json not found:`, error);
    }
  }

  // Fallback cho Web Browser
  const localData = localStorage.getItem(`anchor_theory_${theoryId}`);
  return localData ? JSON.parse(localData) : null;
};