import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiFillHome, AiOutlineUpload, AiOutlineUser } from 'react-icons/ai';
import { FaRegBookmark } from "react-icons/fa6";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; // Firebase 인증 모듈 가져오기
import '../styles/Sidebar.css';

function Sidebar() {
    const [user] = useAuthState(auth);
    const location = useLocation();
    const navigate = useNavigate();

    const getLinkClass = (path) => {
        const isActive = location.pathname === path || (path === '/mypage' && location.pathname === '/login');
        return `sidebar-item ${isActive ? 'active' : ''}`;
    };

    const handleLinkClick = (path) => {
        if (!user && (path === "/upload" || path === "/bookmarks")) {
            alert('로그인이 필요합니다')
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    return (
        <div className="sidebar">
            <div className={getLinkClass("/")} onClick={() => handleLinkClick("/")}>
                <AiFillHome />
                <span>홈</span>
            </div>
            <div className={getLinkClass("/upload")} onClick={() => handleLinkClick("/upload")}>
                <AiOutlineUpload />
                <span>업로드</span>
            </div>
            <div className={getLinkClass("/mypage")} onClick={() => handleLinkClick("/mypage")}>
                <AiOutlineUser />
                <span>마이페이지</span>
            </div>
            <div className={getLinkClass("/bookmarks")} onClick={() => handleLinkClick("/bookmarks")}>
                <FaRegBookmark />
                <span>북마크</span>
            </div>
        </div>
    );
}

export default Sidebar;
