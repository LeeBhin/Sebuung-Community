import React, { useState, useEffect } from 'react';
import ProjectDetail from './ProjectDetail';
import { db } from '../firebase'; //
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';

import '../styles/ProjectList.css'

function ProjectList() {
    const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
    const [selectedProject, setSelectedProject] = useState(null); // 선택된 프로젝트 정보
    const [projects, setProjects] = useState([]); // Firestore에서 가져온 프로젝트 데이터를 저장할 상태

    useEffect(() => {
        // Firestore에서 프로젝트 데이터를 가져오는 함수
        const fetchProjects = async () => {
            const projectCollection = collection(db, "projects");
            const projectQuery = query(projectCollection);

            try {
                const projectSnapshot = await getDocs(projectQuery);
                const projectData = [];

                for (const docRef of projectSnapshot.docs) {
                    const projectInfo = docRef.data();
                    const authorDocRef = doc(db, "users", projectInfo.userId); // projectInfo.userId로 접근
                    const authorDocSnapshot = await getDoc(authorDocRef);

                    if (authorDocSnapshot.exists()) {
                        const authorInfo = authorDocSnapshot.data();
                        projectInfo.authorName = authorInfo.displayName;
                    }

                    projectData.push({
                        id: docRef.id,
                        ...projectInfo
                    });
                }

                // 프로젝트 데이터를 최신순으로 정렬
                projectData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

                // 모든 데이터를 가져온 후에 상태를 업데이트합니다.
                setProjects(projectData);
            } catch (error) {
                console.error("프로젝트 데이터 가져오기 에러:", error);
            }
        };

        // 페이지가 로드될 때 프로젝트 데이터를 가져옵니다.
        fetchProjects();
    }, [])


    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId); // 선택된 프로젝트 설정
        setShowPopup(true); // 팝업 표시
    };

    return (
        <div className="projectList">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="projectDiv"
                    onClick={() => showProjectDetail(project.id)}
                >
                    <div className="projectThumbnail">
                        <img
                            src={project.imageUrl}
                            alt="프로젝트 이미지"
                        />
                    </div>
                    <div className="projectTitle">{project.title}</div>
                    <div className="projectCreatedAt">{project.createdAt.toDate().toLocaleString()}</div>
                    <div className="projectAuthor">{project.authorName}</div> {/* 작성자 이름 표시 */}
                </div>
            ))}

            {showPopup && (
                <ProjectDetail projectId={selectedProject} setShowPopup={setShowPopup} />
            )}
        </div>
    );
}

export default ProjectList;
