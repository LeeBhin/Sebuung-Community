import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import '../styles/ProjectDetail.css';

function ensureAbsoluteUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `http://${url}`;
    }
    return url;
}

function ProjectDetail({ projectId, setShowPopup }) {
    const [projectData, setProjectData] = useState(null);
    const [authorName, setAuthorName] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
            } else {
                console.log("해당 문서가 존재하지 않습니다.");
            }
        };

        fetchProjectData();
    }, [projectId]);

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


    return (
        <div className="project-detail-overlay">
            <div className="project-detail-popup">
                <button className="close-button" onClick={() => setShowPopup(false)}>X</button>
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
                                                {isBookmarked ? <BsBookmarkFill /> : <BsBookmark />}
                                            </button>
                                            <button className="like-button">추천</button>
                                            <button className="share-button">공유</button>
                                            {projectData.fileUrl && (
                                                <button className="download-button" onClick={downloadFile}>다운</button>
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
        </div>
    );
}

export default ProjectDetail;
