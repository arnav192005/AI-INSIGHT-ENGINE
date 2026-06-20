import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './Dashboard';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem('AUTH_SESSION');
    if (token) {
      setIsLoggedIn(true);
    }
    setIsInitialized(true);
  }, []);

  if (!isInitialized) return null;

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Auth setIsLoggedIn={setIsLoggedIn} />} 
        />
        <Route 
          path="/dashboard" 
          element={isLoggedIn ? <Dashboard setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
