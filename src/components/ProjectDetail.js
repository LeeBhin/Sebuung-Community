import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/ProjectDetail.css';

function ProjectDetail({ projectId, setShowPopup }) {
    const [projectData, setProjectData] = useState(null);
    const [authorName, setAuthorName] = useState(null);
    useEffect(() => {
        const fetchProjectData = async () => {
            const projectDocRef = doc(db, "projects", projectId);
            const projectDocSnapshot = await getDoc(projectDocRef);

            if (projectDocSnapshot.exists()) {
                const projectInfo = projectDocSnapshot.data();

                // timestamp 객체를 문자열로 변환하여 저장
                projectInfo.createdAt = projectInfo.createdAt.toDate().toLocaleString();

                setProjectData(projectInfo);

                // 작성자의 UID를 가져옵니다.
                const authorUid = projectInfo.userId;

                // UID를 사용하여 작성자 정보를 Firestore에서 가져옵니다.
                const authorRef = doc(db, "users", authorUid); // "users"는 사용자 컬렉션 이름
                const authorDocSnapshot = await getDoc(authorRef);
                if (authorDocSnapshot.exists()) {
                    const authorInfo = authorDocSnapshot.data();
                    setAuthorName(authorInfo.displayName);
                } else {
                    // 사용자 정보가 없는 경우, UID를 표시
                    setAuthorName(authorUid);
                }
            } else {
                console.log("해당 문서가 존재하지 않습니다.");
            }
        };

        // 페이지가 로드될 때 특정 프로젝트 데이터를 가져옵니다.
        fetchProjectData();
    }, [projectId], db);

    return (
        <div className="popup-container">
            <div className="popup">
                <div className="popup-header">
                    <h2>프로젝트 상세 정보</h2>
                    <button className="close-button" onClick={() => setShowPopup(false)}>X</button>
                </div>
                {projectData && (
                    <div className="project-details">
                        <div className="project-detail-item">
                            <strong>프로젝트 이름:</strong> {projectData.title}
                        </div>
                        <div className="project-detail-item">
                            <strong>작성자:</strong> {authorName}
                        </div>
                        <div className="project-detail-item">
                            <strong>작성일:</strong> {projectData.createdAt}
                        </div>
                        <div className="project-detail-item">
                            <strong>설명:</strong> {projectData.description}
                        </div>
                        <div className="project-detail-item">
                            <strong>링크:</strong> <a href={projectData.link} target="_blank" rel="noopener noreferrer">{projectData.link}</a>
                        </div>
                        <div className="project-detail-item">
                            <strong>조회수:</strong> {projectData.views}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProjectDetail;
