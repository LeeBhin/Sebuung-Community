import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiFillHome, AiOutlineUpload, AiOutlineUser } from 'react-icons/ai';
import { FaRegBookmark } from "react-icons/fa6";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import '../styles/Sidebar.css';

function Sidebar() {
    const [user] = useAuthState(auth);
    const location = useLocation();
    const navigate = useNavigate();

    const getLinkClass = (path) => {
        let isActive = location.pathname === path;
    
        if (path === '/mypage') {
            // 현재 로그인한 사용자의 마이페이지인 경우
            const myPagePath = user ? `/userProfile/${btoa(user.uid)}` : '/mypage';
            isActive = isActive || location.pathname === myPagePath;
    
            // 다른 사용자의 마이페이지인 경우 (현재 로그인한 사용자가 아닌 경우)
            if (!isActive && location.pathname.startsWith('/userProfile/')) {
                const userIdInPath = location.pathname.split('/')[2];
                const currentUserIdEncoded = user ? btoa(user.uid) : null;
                isActive = userIdInPath === currentUserIdEncoded;
            }
        }
    
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
