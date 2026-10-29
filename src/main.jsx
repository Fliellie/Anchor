import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // <<-- Đảm bảo có dòng này để load Tailwind

import 'katex/dist/katex.min.css'; // Add dòng này để load kiểu chữ toán học

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);