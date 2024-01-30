import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from "./pages/Login";
import ProjectUpload from './pages/ProjectUpload';
import MyPage from './pages/MyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/upload" element={<Layout><ProjectUpload /></Layout>} />
        <Route path="/mypage" element={<Layout><MyPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;