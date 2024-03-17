import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiFillHome, AiOutlineHome } from 'react-icons/ai';
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import { RiUser3Line, RiUser3Fill } from "react-icons/ri";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { PiUploadSimpleBold } from "react-icons/pi";
import { ImUpload } from "react-icons/im";
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
            const myPagePath = user ? `/userProfile/${btoa(user.uid)}` : '/mypage';
            isActive = isActive || location.pathname === myPagePath;
            if (!isActive && location.pathname.startsWith('/userProfile/')) {
                const userIdInPath = location.pathname.split('/')[2];
                const currentUserIdEncoded = user ? btoa(user.uid) : null;
                isActive = userIdInPath === currentUserIdEncoded;
            }
        }

        return `sidebar-item ${isActive ? 'active' : ''}`;
    };

    const getIcon = (path) => {
        const isActive = getLinkClass(path).includes('active');
        switch (path) {
            case '/':
                return isActive ? <AiFillHome size={"18px"} /> : <AiOutlineHome size={"18px"} />;
            case '/upload':
                return isActive ? < ImUpload size={"18px"} /> : <PiUploadSimpleBold size={"18px"} />;
            case '/mypage':
                return isActive ? < RiUser3Fill size={"18px"} /> : < RiUser3Line size={"18px"} />;
            case '/bookmarks':
                return isActive ? <FaBookmark size={"18px"} /> : <FaRegBookmark size={"18px"} />;
            case '/HiOutlineSpeakerphone':
                return <HiOutlineSpeakerphone size={"18px"} />
            default:
                return null;
        }
    };

    const handleLinkClick = (path) => {
        if (!user && (path === "/upload" || path === "/bookmarks")) {
            alert('로그인이 필요합니다');
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    return (
        <div className="sidebar">
            <div className={getLinkClass("/")} onClick={() => handleLinkClick("/")}>
                {getIcon("/")}
                <span>홈</span>
            </div>
            <div className={getLinkClass("/upload")} onClick={() => handleLinkClick("/upload")}>
                {getIcon("/upload")}
                <span>업로드</span>
            </div>
            <div className={getLinkClass("/mypage")} onClick={() => handleLinkClick("/mypage")}>
                {getIcon("/mypage")}
                <span>마이페이지</span>
            </div>
            <div className={getLinkClass("/bookmarks")} onClick={() => handleLinkClick("/bookmarks")}>
                {getIcon("/bookmarks")}
                <span>북마크</span>
            </div>
            <div className={getLinkClass("/description")} onClick={() => alert(`2세대 세붕이 여러분 환영합니다!`)}>
                {getIcon("/HiOutlineSpeakerphone")}
                <span>공지사항</span>
            </div>
        </div >
    );
}

export default Sidebar;