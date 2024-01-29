import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/ProjectDetail.css';

function ProjectDetail({ projectId, setShowPopup }) {
    const [projectData, setProjectData] = useState(null);
    const [authorName, setAuthorName] = useState(null);
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
                                            <button className="like-button bookmark-button">☆</button>
                                            <button className="like-button">추천</button>
                                            <button className="share-button">공유</button>
                                            {projectData.fileUrl && (
                                                <button className="download-button" onClick={downloadFile}>다운</button>
                                            )}
                                        </div>
                                    </div>
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
