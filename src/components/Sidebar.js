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
            <div className={getLinkClass("/description")} onClick={() => alert(`"자랑 다모음"은 여러분의 숨겨진 작품과 이야기를 세상에 공유하고 싶었으나, 너무 사소하거나 자신 없어 망설였던 순간들을 위해 만들어졌습니다. 우리 모두에게는 자랑하고 싶은 순간들이 있지만, 때론 그것을 나눌 장소나 기회를 찾지 못합니다. "자랑 다모음"은 바로 그러한 순간들을 위한 공간입니다. 여기서는 여러분의 작은 성취부터 큰 업적까지 모두 자랑하고, 다른 이들과 공유하며, 진정성 있는 평가와 피드백을 받을 수 있습니다.

이 플랫폼은 여러분의 이야기와 작품이 주목받을 수 있는 기회를 제공하며, 서로의 성취를 축하하고 영감을 주고받는 공간입니다. 저는 "자랑 다모음"이 여러분이 자신감을 얻고, 새로운 관점을 발견하며, 창의적인 아이디어를 확장하는 데 도움이 되기를 바랍니다.

아직 완벽하지 않은 서비스이지만, 여러분의 이해와 지원을 부탁드립니다. 여러분의 제안과 피드백을 바탕으로 "자랑 다모음"을 더욱 발전시키고 개선해 나갈 계획입니다. 여러분의 소중한 의견이 이 공간을 더욱 특별하게 만들어 줄 것입니다.

문의사항이나 제안이 있으시면 언제든지 damoeumofficial@gmail.com 으로 연락해 주세요. 여러분의 목소리를 듣고, 함께 성장해 나가길 기대합니다. "자랑 다모음"과 함께 여러분의 멋진 이야기를 세상에 공유해 보세요!



(현재 '자랑 다모음'은 아직 로고를 준비하지 못했습니다. 우리의 서비스와 비전을 담을 수 있는 독창적이고 의미 있는 로고를 고민 중입니다. '자랑 다모음'을 상징할 수 있는 아이디어가 있다면, 많은 관심과 제안을 부탁드립니다!)`)}>
                {getIcon("/HiOutlineSpeakerphone")}
                <span>공지사항</span>
            </div>
        </div >
    );
}

export default Sidebar;