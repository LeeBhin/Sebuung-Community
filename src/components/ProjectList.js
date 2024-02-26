import React, { useState, useEffect } from 'react';
import ProjectDetail from './ProjectDetail';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import '../styles/ProjectList.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useNavigate } from 'react-router-dom';

const defaultProfileImageUrl = 'https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg';

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) return `${seconds}초 전`;
    else if (minutes < 60) return `${minutes}분 전`;
    else if (hours < 24) return `${hours}시간 전`;
    else if (days < 7) return `${days}일 전`;
    else if (weeks < 5) return `${weeks}주 전`;
    else if (months < 12) return `${months}달 전`;
    else return `${years}년 전`;
}

async function fetchAuthorPhotoURLs(projectsData) {
    const usersCache = {};
    const projects = await Promise.all(projectsData.map(async project => {
        if (!usersCache[project.userId]) {
            const userRef = doc(db, "users", project.userId);
            const userSnap = await getDoc(userRef);
            usersCache[project.userId] = userSnap.exists() ? {
                photoURL: userSnap.data().photoURL || defaultProfileImageUrl,
                displayName: userSnap.data().displayName || "알 수 없음"
            } : {
                photoURL: defaultProfileImageUrl,
                displayName: "알 수 없음"
            };
        }
        return {
            ...project,
            authorPhotoURL: usersCache[project.userId].photoURL,
            authorName: usersCache[project.userId].displayName
        };
    }));
    return projects;
}
function ProjectList({ isBookmarkPage, projectsData, setRefreshTrigger, searchQuery = '', searchOption = '', sortOption = '' }) {
    const [showPopup, setShowPopup] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState(Array(5).fill().map((_, index) => ({
        id: `temp-${index}`,
        title: '불러오는 중...',
        thumbnailUrl: defaultProfileImageUrl,
        authorPhotoURL: defaultProfileImageUrl,
        authorName: '로딩 중',
        views: '로딩 중',
        relativeDate: '방금 전',
    })));
    const navigate = useNavigate();

    const loadProjects = async () => {
        NProgress.start();
        let loadedProjectsData = [];

        if (!isBookmarkPage) {
            const snapshot = await getDocs(query(collection(db, "projects")));
            loadedProjectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                relativeDate: timeAgo(doc.data().createdAt.toDate())
            }));
        } else {
            loadedProjectsData = projectsData;
        }

        const projectsWithAuthors = await fetchAuthorPhotoURLs(loadedProjectsData);
        const sortedProjects = sortProjects(projectsWithAuthors, sortOption);
        setProjects(sortedProjects);
        NProgress.done();
    };

    useEffect(() => {
        loadProjects(); // useEffect 내에서 loadProjects 함수를 호출합니다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBookmarkPage, projectsData, searchQuery, searchOption, sortOption]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(() => {
            loadProjects();
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onPopupClose = () => {
        setShowPopup(false); // 팝업 상태를 false로 설정합니다.
        loadProjects(); // 팝업이 닫힐 때 loadProjects 함수를 호출하여 데이터를 새로고침합니다.
    };

    const sortProjects = (projects) => {
        switch (sortOption) {
            case 'popular':
                const calculatePopularityScore = (item) => {
                    const ratingAverageWeight = 4; // 별점 평균의 가중치
                    const ratingCountWeight = 2.5; // 별점 개수의 가중치
                    const viewsWeight = 4.5; // 조회수의 가중치
                    const likesWeight = 3; // 좋아요 수의 가중치

                    // 최소 가중치 팩터
                    const minFactor = 0.01;

                    // 각 값이 undefined일 경우 0으로 취급
                    const ratingAverage = item.ratingAverage || 0;
                    const ratingCount = item.ratingCount || 0;
                    const views = item.views || 0;
                    const likesCount = item.likesCount || 0;

                    const adjustedRatingAverage = ratingAverage + minFactor;
                    const ratingScore = adjustedRatingAverage * ratingAverageWeight;
                    const ratingCountScore = Math.log(1 + ratingCount + minFactor) * ratingCountWeight;
                    const viewsScore = Math.log(1 + views + minFactor) * viewsWeight;
                    const likesScore = Math.log(1 + likesCount + minFactor) * likesWeight;

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

    const incrementViews = async (projectId) => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) return;

        const userViewsRef = doc(db, "userViews", userId);
        const userViewsDoc = await getDoc(userViewsRef);

        if (userViewsDoc.exists()) {
            const viewedProjects = userViewsDoc.data().viewedProjects || [];
            if (!viewedProjects.includes(projectId)) {
                await updateDoc(userViewsRef, { viewedProjects: arrayUnion(projectId) });
                await updateDoc(doc(db, "projects", projectId), { views: increment(1) });
            }
        } else {
            await setDoc(userViewsRef, { viewedProjects: [projectId] });
            await updateDoc(doc(db, "projects", projectId), { views: increment(1) });
        }
    };

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId);
        setShowPopup(true);
        incrementViews(projectId);
    };

    const navigateToMyPage = (userId, event) => {
        event.stopPropagation();
        navigate(`/userProfile/${btoa(userId)}`);
    };

    return (
        <div className="projectList">
            {projects.map(project => (
                <div key={project.id} className={`projectDiv ${project.id.startsWith('temp') ? 'temp' : ''}`}
                    onClick={() => !project.id.startsWith('temp') && showProjectDetail(project.id)}>
                    <div className="projectThumbnail">
                        <img src={project.thumbnailUrl} alt={`${project.title} 프로젝트 썸네일`} />
                    </div>
                    <div className='info'>
                        <img src={project.authorPhotoURL}
                            onClick={(event) => navigateToMyPage(project.userId, event)}
                            alt="Author"
                            className="author-profile-image" />
                        <div className="textInfo">
                            <div className="projectTitle">{project.title}</div>
                            <div className="projectAuthor">{project.authorName}</div>
                            <div className="projectStats">
                                <span className="projectViews">조회수 {project.views}회&nbsp;</span>
                                <span className="projectCreatedAt"> • {project.relativeDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {showPopup && (
                <ProjectDetail
                    projectId={selectedProject}
                    setShowPopup={setShowPopup}
                    onPopupClose={onPopupClose}
                />
            )}
        </div>
    );
}

export default ProjectList;
