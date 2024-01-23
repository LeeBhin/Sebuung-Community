import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from "./pages/Login";
import Home from './pages/Home';
import ProjectUpload from './pages/ProjectUpload';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<ProjectUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
