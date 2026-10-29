import { useState, useEffect } from 'react';
import Login from './components/Login';
import TheoryGrid from './components/TheoryGrid';
import TheoryEditor from './components/TheoryEditor';
import { initialTheories } from './data/mockData';

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('anchor_user') || '');
  const [selectedTheory, setSelectedTheory] = useState(null);
  const [theories, setTheories] = useState(() => {
    const saved = localStorage.getItem('anchor_data');
    return saved ? JSON.parse(saved) : initialTheories;
  });

  useEffect(() => {
    localStorage.setItem('anchor_data', JSON.stringify(theories));
  }, [theories]);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem('anchor_user', username);
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
    };
    setTheories([...theories, newTheory]);
  };

  // Cập nhật theory khi sửa các mục ghi chú bên trong
  const handleUpdateTheory = (updatedTheory) => {
    const updatedTheories = theories.map((t) =>
      t.id === updatedTheory.id ? updatedTheory : t
    );
    setTheories(updatedTheories);
    setSelectedTheory(updatedTheory);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (selectedTheory) {
    return (
      <TheoryEditor
        theory={selectedTheory}
        onUpdateTheory={handleUpdateTheory}
        onBack={() => setSelectedTheory(null)}
      />
    );
  }

  return (
    <TheoryGrid
      theories={theories}
      user={user}
      onSelectTheory={setSelectedTheory}
      onCreateTheory={handleCreateTheory}
      onLogout={handleLogout}
    />
  );
}