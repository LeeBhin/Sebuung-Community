import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AiFillHome, AiOutlineUpload, AiOutlineUser } from 'react-icons/ai';
import '../styles/Sidebar.css';

function Sidebar() {
    const location = useLocation();

    const getLinkClass = (path) => {
        const isActive = location.pathname === path || (path === '/mypage' && location.pathname === '/login');
        return `sidebar-item ${isActive ? 'active' : ''}`;
    };

    return (
        <div className="sidebar">
            <Link to="/" className={getLinkClass("/")}>
                <AiFillHome />
                <span>홈</span>
            </Link>
            <Link to="/upload" className={getLinkClass("/upload")}>
                <AiOutlineUpload />
                <span>업로드</span>
            </Link>
            <Link to="/mypage" className={getLinkClass("/mypage")}>
                <AiOutlineUser />
                <span>마이페이지</span>
            </Link>
        </div>
    );
}

export default Sidebar;
