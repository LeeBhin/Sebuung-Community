import React, { useState } from 'react';

function ProjectList() {
    const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
    const [selectedProject, setSelectedProject] = useState(null); // 선택된 프로젝트 정보

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId); // 선택된 프로젝트 설정
        setShowPopup(true); // 팝업 표시
    };

    const projectDiv = {
        width: "350px",
        height: "250px",
        border: "solid 1px",
        float: "left",
        margin: "15px",
        cursor: "pointer"
    };

    const popup = {
        width: '80vw',
        height: '80vh',
        border: 'solid 1px',
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        boxSizing: 'border-box',
        zIndex: 1000,
    };

    const projectThumbnail = {
        height: "80%",
        border: "solid 1px"
    };

    // 프로젝트 상세 페이지로 이동하는 함수
    // const goToProjectDetail = (projectId) => {
    //     navigate(`/project/${projectId}`);
    // };

    return (
        <div className="projectList">
            {[1, 2, 3, 4].map((projectId) => (
                <div
                    key={projectId}
                    className="projectDiv"
                    style={projectDiv}
                    onClick={() => showProjectDetail(projectId)}
                >
                    <div className="projectThumbnail" style={projectThumbnail}>
                        Thumbnail img
                    </div>
                    <div className="projectTitle">Project Title {projectId}</div>
                </div>
            ))}

            {showPopup && (
                <div className="popup" style={popup}>
                    <div>Project Details for {selectedProject}</div>
                    <p>좌우 슬라이더 이미지</p>
                    <p>링크와 본문</p>
                    <p>카테고리</p>
                    <p>별점</p>
                    <p>좋아요/싫어요</p>
                    <p>신고</p>
                    <p>댓글</p>
                    <button onClick={() => setShowPopup(false)}>X</button>
                </div>
            )}
        </div>
    );
}

export default ProjectList;
