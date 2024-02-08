import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from "./pages/Login";
import ProjectUpload from './pages/ProjectUpload';
import MyPage from './pages/MyPage';
import LoadingBar from './components/LoadingBar';
import Bookmarks from './pages/Bookmarks';
import ProjectUpdate from './pages/ProjectUpdate';
import ProjectDetail from './components/ProjectDetail';

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [projectId, setProjectId] = useState(null);
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const projectIdFromUrl = queryParams.get('sharingcode');

    if (projectIdFromUrl) {
      const decodedProjectId = atob(projectIdFromUrl);
      setShowPopup(true);
      setProjectId(decodedProjectId);
    }
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <Router>
      <LoadingBar />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/upload" element={<Layout><ProjectUpload /></Layout>} />
        <Route path="/mypage" element={<Layout><MyPage /></Layout>} />
        <Route path="/bookmarks" element={<Layout><Bookmarks /></Layout>} />
        <Route path="/edit/:projectId" element={<Layout><ProjectUpdate /></Layout>} />
      </Routes>
      {showPopup && <ProjectDetail projectId={projectId} setShowPopup={setShowPopup} onPopupClose={handleClosePopup} />}
    </Router>
  );
}

export default App;