import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import '../styles/ProjectDetail.css';
import { PiDownloadSimple } from "react-icons/pi";

function ensureAbsoluteUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `http://${url}`;
    }
    return url;
}

function ProjectDetail({ projectId, setShowPopup, onPopupClose, OPCBookmarks }) {
    const [projectData, setProjectData] = useState(null);
    const [authorName, setAuthorName] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAuthor, setIsAuthor] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchProjectData = async () => {
            const projectDocRef = doc(db, "projects", projectId);
            const projectDocSnapshot = await getDoc(projectDocRef);

            if (projectDocSnapshot.exists()) {
                const projectInfo = projectDocSnapshot.data();
                projectInfo.createdAt = projectInfo.createdAt.toDate().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                setProjectData(projectInfo);

                const authorUid = projectInfo.userId;
                const authorRef = doc(db, "users", authorUid);
                const authorDocSnapshot = await getDoc(authorRef);
                if (authorDocSnapshot.exists()) {
                    const authorInfo = authorDocSnapshot.data();
                    setAuthorName(authorInfo.displayName);
                } else {
                    setAuthorName(authorUid);
                }

                if (auth.currentUser) {
                    const userRef = doc(db, "users", auth.currentUser.uid);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsBookmarked(userData.bookmarks?.includes(projectId));
                    }
                }

                const isAuthor = auth.currentUser && auth.currentUser.uid === projectInfo.userId;
                setIsAuthor(isAuthor); // 상태 업데이트
            } else {
                console.log("해당 문서가 존재하지 않습니다.");
            }
        };

        fetchProjectData();
    }, [projectId]);

    const handleEditProject = () => {
        navigate(`/edit/${projectId}`);
    };

    const handleDeleteProject = async () => {
        const isConfirmed = window.confirm('이 프로젝트를 삭제하시겠습니까?');
        if (isConfirmed) {
            try {
                await deleteDoc(doc(db, "projects", projectId));
                alert('프로젝트가 성공적으로 삭제되었습니다.');
                window.location.reload();
            } catch (error) {
                console.error("프로젝트 삭제 중 오류 발생:", error);
                alert('프로젝트 삭제에 실패했습니다.', error);
            }
        }
    };


    const handlePrevClick = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : projectData.imageUrls.length - 1
        );
    };

    const handleNextClick = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex < projectData.imageUrls.length - 1 ? prevIndex + 1 : 0
        );
    };

    const downloadFile = () => {
        if (projectData.fileUrl) {
            window.open(projectData.fileUrl);
        }
    };

    const toggleBookmark = async () => {
        // 북마크 상태 토글
        const newBookmarkStatus = !isBookmarked;
        setIsBookmarked(newBookmarkStatus);

        // Firestore 데이터 업데이트
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            let updatedBookmarks = userDoc.data().bookmarks || [];
            if (newBookmarkStatus) {
                // 프로젝트 ID 추가
                updatedBookmarks = [...updatedBookmarks, projectId];
            } else {
                // 프로젝트 ID 제거
                updatedBookmarks = updatedBookmarks.filter(id => id !== projectId);
            }

            await updateDoc(userRef, {
                bookmarks: updatedBookmarks
            });
        }
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        if (location.pathname === '/bookmarks') {
            OPCBookmarks()
        }
        onPopupClose();
    };

    const handleShare = () => {
        const encodedProjectId = btoa(projectId);
        const shareUrl = `${window.location.origin}/?sharingcode=${encodedProjectId}`;

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("공유 URL이 클립보드에 복사되었습니다.");
            })
            .catch(err => {
                console.error("클립보드에 복사 실패:", err);
                alert("URL 복사에 실패했습니다.");
            });
    };

    return (
        <div className="project-detail-overlay">
            <div className="project-detail-popup">
                <button className="close-button" onClick={() => handleClosePopup()}>X</button>
                <div className="project-detail-container">
                    <div className="project-content">
                        {projectData && (
                            <>
                                <div className="project-image-slider">
                                    <img src={projectData.imageUrls[currentImageIndex]} alt={`이미지 ${currentImageIndex + 1}`} />
                                    <div className="image-index-overlay">
                                        {currentImageIndex + 1}/{projectData.imageUrls.length}
                                    </div>
                                    <div>
                                        <button className="slider-button prev-button" onClick={handlePrevClick}>이전</button>
                                        <button className="slider-button next-button" onClick={handleNextClick}>다음</button>
                                    </div>
                                </div>
                                <div className="project-info">
                                    <div className="project-info-header">
                                        <h2 className="project-title">{projectData.title}</h2>
                                        <div className="project-date-views">
                                            <span className="project-date">{projectData.createdAt}</span>
                                            <span className="project-views">조회수 {projectData.views}회</span>
                                        </div>
                                    </div>
                                    <div className="project-info-body">
                                        <span className="project-author">{authorName}</span>
                                        <div className="project-actions">
                                            <button className="bookmark-button" onClick={toggleBookmark}>
                                                {isBookmarked ? <BsBookmarkFill size={"20px"} /> : <BsBookmark size={"20px"} />}
                                            </button>
                                            <button className="like-button">추천</button>
                                            <button className="share-button" onClick={handleShare}>공유</button>
                                            {projectData.fileUrl && (
                                                <button className="download-button" onClick={downloadFile}><PiDownloadSimple size={"20px"} /></button>
                                            )}
                                            {isAuthor && (
                                                <>
                                                    <button className="edit-button" onClick={handleEditProject}>수정</button>
                                                    <button className="delete-button" onClick={handleDeleteProject}>삭제</button>
                                                </>

                                            )}
                                        </div>
                                    </div>
                                    <a href={ensureAbsoluteUrl(projectData.link)}
                                        className="project-url"
                                        target="_blank"
                                        rel="noopener noreferrer">{projectData.link}</a>
                                    <p className="project-description">{projectData.description}</p>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="project-comments-section">
                        <div className="comments-header">
                            <h3>댓글</h3>
                        </div>
                        <div className="comments-list">
                        </div>
                        <div className="comment-input-section">
                            <input type="text" placeholder="댓글 달기..." />
                            <button type="submit">게시</button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default ProjectDetail;
