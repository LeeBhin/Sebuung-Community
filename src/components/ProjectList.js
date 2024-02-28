import React, { useState, useEffect } from 'react';
import ProjectDetail from './ProjectDetail';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, setDoc, orderBy, startAfter, limit, where } from 'firebase/firestore';
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
    const [projects, setProjects] = useState([])
    // const [projects, setProjects] = useState(Array(5).fill().map((_, index) => ({
    //     id: `temp-${index}`,
    //     title: '불러오는 중...',
    //     thumbnailUrl: defaultProfileImageUrl,
    //     authorPhotoURL: defaultProfileImageUrl,
    //     authorName: '로딩 중',
    //     views: '로딩 중',
    //     relativeDate: '방금 전',
    // })));
    const navigate = useNavigate();

    console.log('a', sortOption)

    const initialProjectsLimit = 10; // 한 번에 불러올 초기 프로젝트 수
    const additionalProjectsLimit = 5; // 스크롤할 때마다 추가로 불러올 프로젝트 수
    let projectsLimit = initialProjectsLimit; // 현재 불러올 프로젝트 수
    const loadProjects = async () => {
        console.log('b', sortOption)
        NProgress.start();
        let loadedProjectsData = [];

        if (!isBookmarkPage) {
            const projectsRef = collection(db, "projects");

            // 사용자가 선택한 정렬 옵션에 따라 동적으로 쿼리를 생성
            let q;
            console.log('c', sortOption)
            switch (sortOption) {
                case 'star':
                    q = query(projectsRef, orderBy("ratingAverage", "desc"), limit(projectsLimit));
                    break;
                case 'latest':
                    q = query(projectsRef, orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
                case 'oldest':
                    q = query(projectsRef, orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
                case 'views':
                    q = query(projectsRef, orderBy("views", "desc"), limit(projectsLimit));
                    break;
                case 'likes':
                    q = query(projectsRef, orderBy("likesCount", "desc"), limit(projectsLimit));
                    break;
            }

            const snapshot = await getDocs(q);
            loadedProjectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                relativeDate: timeAgo(doc.data().createdAt.toDate())
            }));
        } else {
            loadedProjectsData = projectsData;
        }

        if (searchQuery && searchQuery.trim() !== '') {
            // Firestore에서 검색 쿼리 실행
            const searchResults = await searchProjects(searchQuery, searchOption);
            loadedProjectsData = searchResults;
        }

        // fetchAuthorPhotoURLs 함수를 호출하여 작성자의 프로필 사진 URL을 가져옴
        const projectsWithAuthors = await fetchAuthorPhotoURLs(loadedProjectsData);

        // 이전에 불러온 프로젝트 데이터와 새로 불러온 데이터를 결합
        const allProjectsData = [...projects, ...projectsWithAuthors];

        // 중복된 데이터 제거
        const uniqueProjectsData = allProjectsData.filter((project, index, self) =>
            index === self.findIndex(p => p.id === project.id)
        );

        console.log(uniqueProjectsData)
        // 결합된 데이터를 현재 정렬 옵션에 따라 다시 정렬
        let sortedProjectsData = [];
        console.log(sortOption)
        switch (sortOption) {
            case 'star':
                sortedProjectsData = uniqueProjectsData.sort((a, b) => b.ratingAverage - a.ratingAverage);
                break;
            case 'latest':
                sortedProjectsData = uniqueProjectsData.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'oldest':
                sortedProjectsData = uniqueProjectsData.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'views':
                sortedProjectsData = uniqueProjectsData.sort((a, b) => b.views - a.views);
                break;
            case 'likes':
                sortedProjectsData = uniqueProjectsData.sort((a, b) => b.likesCount - a.likesCount);
                break;
            default:
                sortedProjectsData = uniqueProjectsData.sort((a, b) => b.views - a.views);
        }
        console.log(sortedProjectsData)

        // 정렬된 데이터를 상태에 설정
        setProjects(sortedProjectsData);
        NProgress.done();
    };


    const searchProjects = async (searchQuery, searchOption) => {
        let loadedProjectsData = [];

        // Firestore 쿼리 생성
        const projectsRef = collection(db, "projects");

        // 검색 옵션에 따라 쿼리 필드를 선택하여 조건 추가
        if (searchQuery && searchQuery.trim() !== '') {
            if (searchOption === 'title') {
                // title 필드를 기준으로 검색 쿼리 생성
                const q = query(projectsRef, where('title', '>=', searchQuery), where('title', '<=', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                loadedProjectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else if (searchOption === 'content') {
                // content 필드를 기준으로 검색 쿼리 생성
                const q = query(projectsRef, where('description', '>=', searchQuery), where('description', '<=', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                loadedProjectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else { // 'both' 또는 기타
                // title과 description 필드를 모두 검색 쿼리 생성
                const q = query(projectsRef, where('title', '>=', searchQuery), where('title', '<=', searchQuery + '\uf8ff'),
                    where('description', '>=', searchQuery), where('description', '<=', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                loadedProjectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        }

        return loadedProjectsData;
    };

    useEffect(() => {
        let loading = false; // 데이터를 로드하는 중 여부를 나타내는 변수

        const handleScroll = () => {
            if (!isBookmarkPage) {
                if (loading) return; // 데이터를 로드하는 중인 경우 더 이상 호출하지 않음

                const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
                if (scrollTop + clientHeight >= scrollHeight - 50 && projects.length < projectsLimit) {
                    if (projects.length < initialProjectsLimit) {
                        // 초기 프로젝트 수만큼 불러오는 경우
                        projectsLimit += additionalProjectsLimit; // 추가로 불러올 프로젝트 수 증가
                    } else {
                        // 두 번째 이후에는 한 번에 모든 프로젝트를 불러옵니다.
                        projectsLimit = projects.length + additionalProjectsLimit; // 다음 불러올 프로젝트 수 설정
                    }
                    loading = true; // 데이터를 로드하는 중임을 표시
                    loadProjects() // 프로젝트 불러오기 함수 호출
                        .then(() => {
                            loading = false; // 데이터 로딩이 끝났음을 표시
                        })
                        .catch((error) => {
                            console.error('Error loading projects:', error);
                            loading = false; // 데이터 로딩이 실패했음을 표시
                        });
                }
            }
        };

        window.addEventListener('scroll', handleScroll); // 스크롤 이벤트 리스너 등록

        return () => {
            window.removeEventListener('scroll', handleScroll); // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
        };
    }, [projectsLimit]);

    useEffect(() => {
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBookmarkPage, projectsData, searchQuery, searchOption, sortOption]);


    const onPopupClose = () => {
        setShowPopup(false); // 팝업 상태를 false로 설정합니다.
        loadProjects(); // 팝업이 닫힐 때 loadProjects 함수를 호출하여 데이터를 새로고침합니다.
    };

    // const sortProjects = (projects) => {
    //     switch (sortOption) {
    //         case 'popular':
    //             const calculatePopularityScore = (item) => {
    //                 const ratingAverageWeight = 4; // 별점 평균의 가중치
    //                 const ratingCountWeight = 2.5; // 별점 개수의 가중치
    //                 const viewsWeight = 4.5; // 조회수의 가중치
    //                 const likesWeight = 3; // 좋아요 수의 가중치

    //                 // 최소 가중치 팩터
    //                 const minFactor = 0.01;

    //                 // 각 값이 undefined일 경우 0으로 취급
    //                 const ratingAverage = item.ratingAverage || 0;
    //                 const ratingCount = item.ratingCount || 0;
    //                 const views = item.views || 0;
    //                 const likesCount = item.likesCount || 0;

    //                 const adjustedRatingAverage = ratingAverage + minFactor;
    //                 const ratingScore = adjustedRatingAverage * ratingAverageWeight;
    //                 const ratingCountScore = Math.log(1 + ratingCount + minFactor) * ratingCountWeight;
    //                 const viewsScore = Math.log(1 + views + minFactor) * viewsWeight;
    //                 const likesScore = Math.log(1 + likesCount + minFactor) * likesWeight;

    //                 const popularityScore = ratingScore + ratingCountScore + viewsScore + likesScore;

    //                 return popularityScore;
    //             };

    //             return projects.sort((a, b) => calculatePopularityScore(b) - calculatePopularityScore(a));
    //         case 'latest':
    //             // 최신순
    //             return projects.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    //         case 'views':
    //             // 조회수순
    //             return projects.sort((a, b) => b.views - a.views);
    //         case 'likes':
    //             // 추천순
    //             return projects.sort((a, b) => b.likesCount - a.likesCount);
    //         case 'oldest':
    //             // 오래된 순
    //             return projects.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
    //         default:
    //             return projects;
    //     }
    // };

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
            {projects.length > 0 ? (
                <>
                    {projects.map(project => (
                        <div key={project.id} className={`projectDiv ${project.id.startsWith('temp') ? 'temp' : ''}`}
                            onClick={() => !project.id.startsWith('temp') && showProjectDetail(project.id)}>
                            <div className="projectThumbnail">
                                <img src={project.thumbnailUrl} alt={`${project.title} 프로젝트 썸네일`} />
                            </div>
                            <div className='info'>
                                <div className="authorContainer">
                                    <img src={project.authorPhotoURL}
                                        onClick={(event) => navigateToMyPage(project.userId, event)}
                                        alt="Author"
                                        className="author-profile-image" />
                                    <div className="projectAuthor">{project.authorName}</div>
                                </div>
                                <div className="textInfo">
                                    <div className="projectTitle">{project.title}</div>
                                    <div className="projectStats">
                                        <span className="projectViews">
                                            {project.views > 0 ? `조회수 ${project.views}회` : '아무도 안 봄'}
                                        </span>
                                        <span className="projectCreatedAt">{project.relativeDate}</span>
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
                </>
            ) : (
                <>
                    <div className="no-results">검색 결과가 없습니다.</div>
                </>
            )}
        </div>
    );
}

export default ProjectList;