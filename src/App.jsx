import { useState, useEffect } from 'react';
import Login from './components/Login';
import TheoryGrid from './components/TheoryGrid';
import TheoryEditor from './components/TheoryEditor';
import { initialTheories } from './data/mockData';

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('anchor_user') || '');
  const [selectedTheory, setSelectedTheory] = useState(null);

  // State quản lý Theme chung cho TOÀN BỘ App (Default là 'light' hoặc 'ocean')
  const [themeColor, setThemeColor] = useState(
    () => localStorage.getItem('anchor_theme') || 'light'
  );

  const [theories, setTheories] = useState(() => {
    const currentUser = localStorage.getItem('anchor_user');
    if (!currentUser) return initialTheories;
    const userSavedData = localStorage.getItem(`anchor_data_${currentUser}`);
    return userSavedData ? JSON.parse(userSavedData) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(`anchor_data_${user}`, JSON.stringify(theories));
    }
  }, [theories, user]);

  // Đổi và lưu Theme vào localStorage
  const handleThemeChange = (newTheme) => {
    setThemeColor(newTheme);
    localStorage.setItem('anchor_theme', newTheme);
  };

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem('anchor_user', username);
    const userSavedData = localStorage.getItem(`anchor_data_${username}`);
    if (userSavedData) {
      setTheories(JSON.parse(userSavedData));
    } else {
      setTheories([]);
      localStorage.setItem(`anchor_data_${username}`, JSON.stringify([]));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('anchor_user');
    setUser('');
    setSelectedTheory(null);
  };

  const handleCreateTheory = (title) => {
    const newTheory = {
      id: `theory-${Date.now()}`,
      title,
      items: [],
      tagRules: [],
    };
    setTheories([...theories, newTheory]);
  };

  const handleUpdateTheory = (updatedTheory) => {
    const updatedTheories = theories.map((t) =>
      t.id === updatedTheory.id ? updatedTheory : t
    );
    setTheories(updatedTheories);
    setSelectedTheory(updatedTheory);
  };

  // 1. Màn hình LOGIN (Cũng nhận Theme)
  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        themeColor={themeColor}
        onThemeChange={handleThemeChange}
      />
    );
  }

  // 2. Màn hình EDITOR
  if (selectedTheory) {
    return (
      <TheoryEditor
        theory={selectedTheory}
        onUpdateTheory={handleUpdateTheory}
        onBack={() => setSelectedTheory(null)}
        themeColor={themeColor}
        onThemeChange={handleThemeChange}
      />
    );
  }

  // 3. Màn hình THEORY GRID
  return (
    <TheoryGrid
      theories={theories}
      user={user}
      onSelectTheory={setSelectedTheory}
      onCreateTheory={handleCreateTheory}
      onLogout={handleLogout}
      themeColor={themeColor}
      onThemeChange={handleThemeChange}
    />
  );
}