import React, { useState, useEffect } from 'react';
import ProjectDetail from './ProjectDetail'; // ProjectDetail 컴포넌트를 불러옵니다
import { db, auth } from '../firebase'; // Firebase 설정 파일을 불러옵니다
import { collection, query, getDocs } from 'firebase/firestore'; // Firestore 함수를 임포트합니다

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
                const projectData = projectSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 사용자 이름을 가져오기
                const user = auth.currentUser;
                const userName = user ? user.displayName : "Unknown User";

                // 사용자 이름을 추가한 데이터를 설정
                const projectsWithUserName = projectData.map(project => ({
                    ...project,
                    userName: userName
                }));

                setProjects(projectsWithUserName);
            } catch (error) {
                console.error("프로젝트 데이터 가져오기 에러:", error);
            }
        };

        // 페이지가 로드될 때 프로젝트 데이터를 가져옵니다.
        fetchProjects();
    }, []); // []를 빈 배열로 설정하여 한 번만 실행되도록 합니다.

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId); // 선택된 프로젝트 설정
        setShowPopup(true); // 팝업 표시
    };

    const projectDiv = {
        width: "350px",
        height: "300px",
        border: "solid 1px",
        float: "left",
        margin: "15px",
        cursor: "pointer"
    };

    const projectThumbnail = {
        height: "80%",
        border: "solid 1px"
    };

    return (
        <div className="projectList">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="projectDiv"
                    style={projectDiv}
                    onClick={() => showProjectDetail(project.id)}
                >
                    <div className="projectThumbnail" style={projectThumbnail}>
                        <img
                            src={project.imageUrl}
                            alt="프로젝트 이미지"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                width: "auto",
                                height: "auto"
                            }}
                        />
                    </div>
                    <div className="projectTitle">{project.title}</div>
                    <div className="projectCreatedAt">{project.createdAt.toDate().toLocaleString()}</div>
                    <div className="projectAuthor">{project.userName}</div> {/* 사용자 이름 표시 */}
                </div>
            ))}

            {showPopup && (
                <ProjectDetail projectId={selectedProject} setShowPopup={setShowPopup} />
            )}
        </div>
    );
}

export default ProjectList;