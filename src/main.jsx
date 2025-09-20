import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SocketProvider } from './context/SocketProvider.jsx';
import QueryProvider from './context/QueryProvider.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<App />} />
            <Route path="/chat/:id" element={<App />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </QueryProvider>
  </React.StrictMode>
);
