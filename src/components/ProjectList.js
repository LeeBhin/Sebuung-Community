import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectList() {
    const navigate = useNavigate();

    const projectDiv = {
        width: "350px",
        height: "250px",
        border: "solid 1px",
        float: "left",
        margin: "15px",
        cursor: "pointer" // 마우스 커서를 포인터로 변경
    };

    const projectThumbnail = {
        height: "80%",
        border: "solid 1px"
    };

    // 프로젝트 상세 페이지로 이동하는 함수
    const goToProjectDetail = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    return (
        <div className="projectList">
            {[1, 2, 3, 4].map((projectId) => (
                <div
                    key={projectId}
                    className="projectDiv"
                    style={projectDiv}
                    onClick={() => goToProjectDetail(projectId)}
                >
                    <div className="projectThumbnail" style={projectThumbnail}>
                        Thumbnail img
                    </div>
                    <div className="projectTitle">Project Title {projectId}</div>
                </div>
            ))}
        </div>
    );
}

export default ProjectList;
