import React, { useState, useEffect, useRef } from 'react';
import ProjectDetail from './ProjectDetail';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, setDoc, orderBy, limit, where, startAfter } from 'firebase/firestore';
import '../styles/ProjectList.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useNavigate } from 'react-router-dom';

import { PiEye } from "react-icons/pi";
import { TbThumbUp } from "react-icons/tb";

import defaultProfileImageUrl from '../fish.png'

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

function ProjectList({ isBookmarkPage, projectsData, searchQuery = '', searchOption = '', sortOption = '' }) {
    const [showPopup, setShowPopup] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    // const [projects, setProjects] = useState([])
    const [selectedTag, setSelectedTag] = useState('');
    const [projects, setProjects] = useState(Array(50).fill().map((_, index) => ({
        id: `temp-${index}`,
        title: '세붕 커뮤니티',
        thumbnailUrl: defaultProfileImageUrl,
        authorPhotoURL: defaultProfileImageUrl,
        authorName: '세붕이',
        views: '999,999',
        relativeDate: '방금 전',
        likesCount: '999,999'
    })));
    const navigate = useNavigate();

    const sortOptionRef = useRef(sortOption);
    const [lastVisible, setLastVisible] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [prevSort, setPrevSort] = useState('views');

    const calculateProjectsPerRow = () => {
        const projectWidth = 300; // 프로젝트 div의 대략적인 너비 (CSS와 일치시켜야 함)
        const windowWidth = window.innerWidth;
        return Math.floor(windowWidth / projectWidth);
    };

    // 두 줄 분량의 프로젝트 수를 계산하는 함수
    const calculateProjectsForTwoRows = () => {
        const projectsPerRow = calculateProjectsPerRow();
        return projectsPerRow * 3; // 두 줄에 걸쳐서 표시할 총 프로젝트 수
    };

    const loadMoreProjects = () => {
        // 스크롤 시 추가로 불러올 프로젝트 수 동적 조정
        const additionalProjectsToLoad = calculateProjectsForTwoRows() + calculateProjectsPerRow();
        setProjectsLimit(additionalProjectsToLoad);
    };

    const [projectsLimit, setProjectsLimit] = useState(() => {
        const initialProjectsToLoad = calculateProjectsForTwoRows() + calculateProjectsPerRow();
        return initialProjectsToLoad;
    });

    useEffect(() => {
        sortOptionRef.current = sortOption;
        // 정렬 옵션이 변경되었을 때 초기화
        if (prevSort !== sortOption) {
            setProjects([]);
            setLastVisible(null);
            setPrevSort(sortOption);
            setIsLoading(true);
        }
        loadProjects()
    }, [sortOption, prevSort]);

    const loadProjects = async () => {
        if (isLoading) return; // 이미 로딩 중이라면 함수 실행을 중단
        setIsLoading(true)
        NProgress.start();
        let loadedProjectsData = [];

        let hap = false;

        if (!isBookmarkPage) {
            const projectsRef = collection(db, "projects");

            // 사용자가 선택한 정렬 옵션에 따라 동적으로 쿼리를 생성
            let q;
            switch (sortOptionRef.current) {
                case 'star':
                    q = query(projectsRef, orderBy("ratingAverage", "desc"), orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
                case 'latest':
                    q = query(projectsRef, orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
                case 'oldest':
                    q = query(projectsRef, orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
                case 'views':
                    q = query(projectsRef, orderBy("views", "desc"), orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
                case 'likes':
                    q = query(projectsRef, orderBy("likesCount", "desc"), orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
                default:
                    q = query(projectsRef, orderBy("views", "desc"), orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
            }

            if (prevSort === sortOption) {
                if (lastVisible) {
                    hap = true;
                    q = query(q, startAfter(lastVisible));
                }
            } else {
                setLastVisible(null)
            }

            const snapshot = await getDocs(q);

            loadedProjectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                relativeDate: timeAgo(doc.data().createdAt.toDate())
            }));

            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

            loadMoreProjects();
        } else {
            loadedProjectsData = projectsData;
        }
        let allProjectsData = loadedProjectsData

        // 첫 번째 데이터가 이전에 불러온 데이터의 첫 번째 요소와 동일한지 확인
        if ((prevSort === sortOption) && loadedProjectsData.length > 0 && projects.length > 0 && loadedProjectsData[0].id === projects[0].id) {
            setIsLoading(false);
            NProgress.done();
            return; // 더 이상 데이터를 불러오지 않음
        }

        if (hap) {
            allProjectsData = [...projects, ...loadedProjectsData];
        }

        // 중복된 데이터 제거
        let uniqueProjectsData = allProjectsData.filter((project, index, self) =>
            index === self.findIndex(p => p.id === project.id)
        );

        if (searchQuery) {
            // Firestore에서 검색 쿼리 실행
            const searchResults = await searchProjects(searchQuery, searchOption);
            uniqueProjectsData = searchResults;
            searchQuery = ''
        }

        // fetchAuthorPhotoURLs 함수를 호출하여 작성자의 프로필 사진 URL을 가져옴
        const projectsWithAuthors = await fetchAuthorPhotoURLs(uniqueProjectsData);

        const datedProjectsData = projectsWithAuthors.map(project => ({
            ...project,
            relativeDate: timeAgo(project.createdAt.toDate())
        }));

        // 정렬된 데이터를 상태에 설정
        setProjects(datedProjectsData);
        setIsLoading(false); // 함수 마지막에서 로딩 상태를 false로 설정
        NProgress.done();
    };

    const searchProjects = async (searchQuery, searchOption) => {
        let loadedProjectsData = [];

        // Firestore 쿼리 생성
        const projectsRef = collection(db, "projects");

        // 검색 옵션에 따라 쿼리 필드를 선택하여 조건 추가
        if (searchQuery && searchQuery.trim() !== '') {
            let docs = []; // 문서를 저장할 배열
            if (searchOption === 'title') {
                // title 필드를 기준으로 검색 쿼리 생성
                const q = query(projectsRef, where('title', '>=', searchQuery), where('title', '<', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                docs = snapshot.docs;
            } else if (searchOption === 'content') {
                // content 필드를 기준으로 검색 쿼리 생성
                const q = query(projectsRef, where('description', '>=', searchQuery), where('description', '<', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                docs = snapshot.docs;
            } else {
                // 'both' 옵션 선택 시, title과 description 필드 각각에 대해 쿼리를 실행하고 결과를 합침
                const qTitle = query(projectsRef, where('title', '>=', searchQuery), where('title', '<', searchQuery + '\uf8ff'));
                const qDescription = query(projectsRef, where('description', '>=', searchQuery), where('description', '<', searchQuery + '\uf8ff'));
                const snapshotTitle = await getDocs(qTitle);
                const snapshotDescription = await getDocs(qDescription);
                // 두 결과를 합침
                docs = [...snapshotTitle.docs, ...snapshotDescription.docs];
            }

            // ID를 기준으로 중복 제거
            const uniqueIds = new Set();
            docs = docs.filter(doc => {
                const isDuplicate = uniqueIds.has(doc.id);
                uniqueIds.add(doc.id);
                return !isDuplicate;
            });

            // 문서 데이터 추출
            loadedProjectsData = docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return loadedProjectsData;
    };

    const [lastScrollTop, setLastScrollTop] = useState(0); // 이전 스크롤 위치 저장

    useEffect(() => {
        const projectListElement = document.querySelector('.projectList'); // projectList 클래스를 가진 요소 선택

        const handleScroll = () => {
            if (!projectListElement) return;

            const { scrollTop, clientHeight, scrollHeight } = projectListElement; // 선택한 요소의 스크롤 속성 사용
            const isScrollingDown = scrollTop > lastScrollTop;

            // 스크롤을 아래로 내리고, 요소의 바닥에 도달했으며, 현재 로딩 중이 아닐 때
            if (isScrollingDown && !isLoading && scrollTop + clientHeight >= scrollHeight - 50) {
                setIsLoading(true);
                loadProjects().then(() => {
                    setIsLoading(false);
                });
            }

            setLastScrollTop(scrollTop);
        };

        if (projectListElement) {
            projectListElement.addEventListener('scroll', handleScroll); // 선택한 요소에 스크롤 이벤트 리스너 추가
        }

        return () => {
            if (projectListElement) {
                projectListElement.removeEventListener('scroll', handleScroll); // 컴포넌트 언마운트 시 이벤트 리스너 제거
            }
        };
    }, [lastScrollTop, isLoading]); // 의존성 배열에 lastScrollTop, isLoading 추가

    useEffect(() => {
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBookmarkPage, projectsData, searchQuery, searchOption, selectedTag]);

    useEffect(() => {
        onPopupClose(false)
        loadProjects();
    }, [selectedTag]);

    const onPopupClose = () => {
        setShowPopup(false); // 팝업 상태를 false로 설정합니다.
        loadProjects(); // 팝업이 닫힐 때 loadProjects 함수를 호출하여 데이터를 새로고침합니다.
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

    const handleTagClick = (tag) => {
        setSelectedTag(tag);
    };

    return (
        <div className="projectList">
            {projects.length > 0 ? (
                <>
                    {projects.map(project => (
                        // 선택된 태그와 관련된 프로젝트만 렌더링
                        selectedTag && !project.hashtags.includes(selectedTag) ? null : (
                            <div key={project.id} className={`projectDiv ${project.id.startsWith('temp') ? 'temp' : ''}`}
                                onClick={() => !project.id.startsWith('temp') && showProjectDetail(project.id)}>
                                <div className="projectThumbnail">
                                    <img src={project.thumbnailUrl} alt={`${project.title} 프로젝트 썸네일`} />
                                    <img src={project.authorPhotoURL}
                                        onClick={(event) => navigateToMyPage(project.userId, event)}
                                        alt="Author"
                                        className="author-profile-image" />
                                </div>
                                <div className='info'>
                                    <div className="textInfo">
                                        <div className="projectTitle">{project.title}</div>
                                        <div className="authorContainer">
                                            <span className="projectAuthor">{project.authorName}</span>
                                            <span>&nbsp;•&nbsp;</span>
                                            <span className="projectCreatedAt">{project.relativeDate}</span>
                                        </div>
                                        <div className="projectStats">
                                            <span className='statsSvg'><PiEye size={"16px"} /></span>
                                            <span>{project.views}&nbsp;&nbsp;</span>
                                            <span className='statsSvg'><TbThumbUp size={"16px"} /></span>
                                            <span>{project.likesCount}</span>
                                        </div>
                                        <span className='hashtags'>{project.hashtags}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                    {showPopup && (
                        <ProjectDetail
                            projectId={selectedProject}
                            setShowPopup={setShowPopup}
                            onTagClick={handleTagClick}
                            onPopupClose={onPopupClose}
                        />
                    )}
                </>
            ) : (
                <>
                    <div className="no-results">இ௰இ</div>
                </>
            )}
        </div >
    );
}

export default ProjectList;