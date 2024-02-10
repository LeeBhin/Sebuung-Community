import React, { useState, useEffect } from 'react';
import ProjectDetail from './ProjectDetail';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import '../styles/ProjectList.css'

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

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

function ProjectList({ isBookmarkPage, projectsData, setRefreshTrigger, searchQuery = '', searchOption = '', sortOption = '' }) {

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
        NProgress.start();
        const temporaryProjects = Array(15).fill().map((_, index) => ({
            id: `temp-${index}`,
            title: '불러오는 중...',
            imageUrls: ['https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg'],
            views: '999,999',
            relativeDate: '방금 전',
            authorName: '불러오는 중...'
        }));
        setProjects(temporaryProjects);

        const sortProjects = (projects) => {
            switch (sortOption) {
                case 'popular':
                    const calculatePopularityScore = (item) => {
                        const ratingAverageWeight = 5; // 별점 평균의 가중치
                        const ratingCountWeight = 2; // 별점 개수의 가중치
                        const viewsWeight = 1; // 조회수의 가중치
                        const likesWeight = 3; // 좋아요 수의 가중치

                        // 각 지표가 0일 경우에도 최소한의 가중치를 부여하기 위해, Math.log의 인자에 1을 더하는 대신
                        // 작은 값을 더하여 로그 함수가 0을 반환하지 않도록 합니다.
                        const minFactor = 0.01; // 최소 가중치 팩터

                        const ratingScore = item.ratingAverage * ratingAverageWeight;
                        const ratingCountScore = Math.log(1 + item.ratingCount + minFactor) * ratingCountWeight;
                        const viewsScore = Math.log(1 + item.views + minFactor) * viewsWeight;
                        const likesScore = Math.log(1 + item.likesCount + minFactor) * likesWeight;

                        const popularityScore = ratingScore + ratingCountScore + viewsScore + likesScore;

                        return popularityScore;
                    };

                    return projects.sort((a, b) => calculatePopularityScore(b) - calculatePopularityScore(a));
                case 'latest':
                    // 최신순
                    return projects.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
                case 'views':
                    // 조회수순
                    return projects.sort((a, b) => b.views - a.views);
                case 'likes':
                    // 추천순
                    return projects.sort((a, b) => b.likesCount - a.likesCount);
                case 'oldest':
                    // 오래된 순
                    return projects.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
                default:
                    return projects;
            }
        };


        const loadProjects = async () => {
            if (!isBookmarkPage) {
                const projectCollection = collection(db, "projects");
                const projectQuery = query(projectCollection);

                try {
                    const projectSnapshot = await getDocs(projectQuery);
                    const projectDataPromises = projectSnapshot.docs.map(async (docRef) => {
                        const projectInfo = docRef.data();
                        projectInfo.id = docRef.id;
                        projectInfo.relativeDate = timeAgo(projectInfo.createdAt.toDate());

                        const authorDocRef = doc(db, "users", projectInfo.userId);
                        const authorDocSnapshot = await getDoc(authorDocRef);
                        projectInfo.authorName = authorDocSnapshot.exists() ? authorDocSnapshot.data().displayName : "알 수 없음";

                        return projectInfo;
                    });

                    const loadedProjects = await Promise.all(projectDataPromises);
                    const sortedProjects = sortProjects(loadedProjects);
                    setProjects(sortedProjects);
                } catch (error) {
                    console.error("프로젝트 데이터 가져오기 에러:", error);
                }
            } else {
                setProjects(projectsData);
            }

            NProgress.done();
        };

        loadProjects();
    }, [isBookmarkPage, projectsData, reloadTrigger, searchQuery, searchOption, sortOption]);

    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase()
        switch (searchOption) {
            case 'title':
                return project.title.toLowerCase().includes(query)
            case 'content':
                return project.description.toLowerCase().includes(query)
            case 'both':
                return project.title.toLowerCase().includes(query) || project.description.toLowerCase().includes(query)
            default:
                return true;
        }
    });

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId);
        setShowPopup(true);
        incrementViews(projectId);
    };

    return (
        <div className="projectList">
            {filteredProjects.map(project => (
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