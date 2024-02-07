import React, { useState, useEffect } from 'react';
import ProjectDetail from './ProjectDetail';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import '../styles/ProjectList.css'

import NProgress from 'nprogress';
import 'nprogress/nprogress.css'; // NProgress 스타일

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) {
        return `${seconds}초 전`;
    } else if (minutes < 60) {
        return `${minutes}분 전`;
    } else if (hours < 24) {
        return `${hours}시간 전`;
    } else if (days < 7) {
        return `${days}일 전`;
    } else if (weeks < 5) {
        return `${weeks}주 전`;
    } else if (months < 12) {
        return `${months}달 전`;
    } else {
        return `${years}년 전`;
    }
}

function ProjectList({ isBookmarkPage, projectsData, setRefreshTrigger }) {

    const [showPopup, setShowPopup] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [reloadTrigger, setReloadTrigger] = useState(false);


    const incrementViews = async (projectId) => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) return;

        const userViewsRef = doc(db, "userViews", userId);
        const userViewsDoc = await getDoc(userViewsRef);

        if (userViewsDoc.exists()) {
            const viewedProjects = userViewsDoc.data().viewedProjects || [];
            if (!viewedProjects.includes(projectId)) {
                await updateDoc(userViewsRef, {
                    viewedProjects: arrayUnion(projectId)
                });
                const projectRef = doc(db, "projects", projectId);
                await updateDoc(projectRef, {
                    views: increment(1)
                });
            }
        } else {
            await setDoc(userViewsRef, {
                viewedProjects: [projectId]
            });
            const projectRef = doc(db, "projects", projectId);
            await updateDoc(projectRef, {
                views: increment(1)
            });
        }
    };

    useEffect(() => {
        NProgress.start(); // 데이터 로딩 시작 시 NProgress 시작

        // 임시 데이터로 UI 초기화
        const temporaryProjects = Array(15).fill().map((_, index) => ({
            id: `temp-${index}`, // 고유한 ID를 보장하기 위해 임시 인덱스 사용
            title: '불러오는 중...',
            imageUrls: ['https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg'],
            views: '통합사',
            relativeDate: '방금 전',
            authorName: '불러오는 중...'
        }));
        setProjects(temporaryProjects);

        const loadProjects = async () => {
            // 북마크 페이지가 아닐 때 Firestore에서 실제 데이터 불러오기
            if (!isBookmarkPage) {
                const projectCollection = collection(db, "projects");
                const projectQuery = query(projectCollection);

                try {
                    const projectSnapshot = await getDocs(projectQuery);
                    const projectDataPromises = projectSnapshot.docs.map(async (docRef) => {
                        const projectInfo = docRef.data();
                        projectInfo.id = docRef.id;
                        projectInfo.relativeDate = timeAgo(projectInfo.createdAt.toDate());

                        // 작성자 정보 불러오기
                        const authorDocRef = doc(db, "users", projectInfo.userId);
                        const authorDocSnapshot = await getDoc(authorDocRef);
                        projectInfo.authorName = authorDocSnapshot.exists() ? authorDocSnapshot.data().displayName : "알 수 없음";

                        return projectInfo;
                    });

                    // 모든 프로젝트 데이터의 Promise가 해결된 후 상태 업데이트
                    const loadedProjects = await Promise.all(projectDataPromises);
                    setProjects(loadedProjects.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()));
                } catch (error) {
                    console.error("프로젝트 데이터 가져오기 에러:", error);
                }
            } else {
                // 북마크 페이지일 경우 전달받은 데이터 사용
                setProjects(projectsData);
            }

            NProgress.done(); // 데이터 로딩 완료 시 NProgress 종료
        };

        loadProjects();
    }, [isBookmarkPage, projectsData, reloadTrigger]);

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId);
        setShowPopup(true);
        incrementViews(projectId);
    };

    return (
        <div className="projectList">
            {projects.map(project => (
                <div key={project.id} className={`projectDiv ${project.id.startsWith('temp') ? 'temp' : ''}`}
                    onClick={() => !project.id.startsWith('temp') && showProjectDetail(project.id)}>
                    <div className="projectThumbnail">
                        {project.imageUrls && project.imageUrls.length > 0 && (
                            <img src={project.imageUrls[0]} alt={`${project.title} 프로젝트 썸네일`} />
                        )}
                    </div>
                    <div className='info'>
                        <div className="projectTitle">{project.title}</div>
                        <div className="projectAuthor">{project.authorName}</div>
                        <div className="projectStats">
                            <span className="projectViews">조회수 {project.views}회 •</span>
                            <span className="projectCreatedAt">&nbsp;{project.relativeDate}</span>
                        </div>
                    </div>
                </div>
            ))}
            {showPopup && (
                <ProjectDetail
                    projectId={selectedProject}
                    setShowPopup={setShowPopup}
                    onPopupClose={() => setReloadTrigger(prev => !prev)}
                    OPCBookmarks={() => setRefreshTrigger(prev => !prev)}
                />
            )}
        </div>
    );
}

export default ProjectList;