import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import '../styles/ProjectDetail.css';

import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { BiSolidDownload } from "react-icons/bi";
import { FaStar, FaRegStar, FaStarHalfAlt, FaRegShareSquare } from 'react-icons/fa';
import { MdDeleteOutline, MdArrowForwardIos, MdArrowBackIosNew } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { TbThumbUp, TbThumbUpFilled } from "react-icons/tb";
import { LiaEditSolid } from "react-icons/lia";

function ensureAbsoluteUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `http://${url}`;
    }
    return url;
}

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

function ProjectDetail({ projectId, setShowPopup, onPopupClose, OPCBookmarks }) {
    const [projectData, setProjectData] = useState(null);
    const [authorName, setAuthorName] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAuthor, setIsAuthor] = useState(false);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);
    const [rating, setRating] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchProjectData = async () => {
            const projectDocRef = doc(db, "projects", projectId);
            const projectDocSnapshot = await getDoc(projectDocRef);

            if (projectDocSnapshot.exists()) {
                const projectInfo = projectDocSnapshot.data();
                projectInfo.createdAt = projectInfo.createdAt.toDate().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                setProjectData(projectInfo);

                // 좋아요한 작품인지 확인
                const user = auth.currentUser;
                if (user) {
                    const userLikes = projectInfo.likes || [];
                    const userHasLiked = userLikes.includes(user.uid);
                    setIsLiked(userHasLiked);
                }

                // likesCount 초기화
                setLikesCount(projectInfo.likesCount || 0);

                const authorUid = projectInfo.userId;
                const authorRef = doc(db, "users", authorUid);
                const authorDocSnapshot = await getDoc(authorRef);
                if (authorDocSnapshot.exists()) {
                    const authorInfo = authorDocSnapshot.data();
                    setAuthorName(authorInfo.displayName);
                } else {
                    setAuthorName(authorUid);
                }

                if (auth.currentUser) {
                    const userRef = doc(db, "users", auth.currentUser.uid);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsBookmarked(userData.bookmarks?.includes(projectId));
                    }
                }

                const isAuthor = auth.currentUser && auth.currentUser.uid === projectInfo.userId;
                setIsAuthor(isAuthor);
            } else {
                console.log("해당 문서가 존재하지 않습니다.");
            }
        };

        fetchProjectData();
    }, [projectId]);

    const handleEditProject = () => {
        navigate(`/edit/${projectId}`);
    };

    const handleDeleteProject = async () => {
        const isConfirmed = window.confirm('이 프로젝트를 삭제하시겠습니까?');
        if (isConfirmed) {
            try {
                await deleteDoc(doc(db, "projects", projectId));
                alert('프로젝트가 성공적으로 삭제되었습니다.');
                window.location.reload();
            } catch (error) {
                console.error("프로젝트 삭제 중 오류 발생:", error);
                alert('프로젝트 삭제에 실패했습니다.', error);
            }
        }
    };


    const handlePrevClick = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : projectData.imageUrls.length - 1
        );
    };

    const handleNextClick = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex < projectData.imageUrls.length - 1 ? prevIndex + 1 : 0
        );
    };

    const downloadFile = () => {
        if (projectData.fileUrl) {
            window.open(projectData.fileUrl);
        }
    };

    const toggleBookmark = async () => {
        const newBookmarkStatus = !isBookmarked;
        setIsBookmarked(newBookmarkStatus);

        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            let updatedBookmarks = userDoc.data().bookmarks || [];
            if (newBookmarkStatus) {
                updatedBookmarks = [...updatedBookmarks, projectId];
            } else {
                updatedBookmarks = updatedBookmarks.filter(id => id !== projectId);
            }

            await updateDoc(userRef, {
                bookmarks: updatedBookmarks
            });
        }
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        if (location.pathname === '/bookmarks') {
            OPCBookmarks()
        }
        onPopupClose();
    };

    const handleShare = () => {
        const encodedProjectId = btoa(projectId);
        const shareUrl = `${window.location.origin}/?sharingcode=${encodedProjectId}`;

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("공유 URL이 클립보드에 복사되었습니다.");
            })
            .catch(err => {
                console.error("클립보드에 복사 실패:", err);
                alert("URL 복사에 실패했습니다.");
            });
    };

    const submitComment = async () => {
        if (!auth.currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }

        if (comment.trim() !== "" || rating > 0) {
            const commentData = {
                projectId,
                userId: auth.currentUser.uid,
                comment: comment.trim(),
                rating: rating,
                createdAt: new Date(),
            };
            try {
                await addDoc(collection(db, "comments"), commentData);
                setComment("");
                setRating(0);
                fetchComments();
                updateProjectRatingAverage(projectId);
            } catch (error) {
                console.error("댓글 추가 실패:", error);
            }
        } else {
            alert("댓글 또는 별점을 입력해주세요.");
        }
    };


    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchComments = async () => {
        const q = query(collection(db, "comments"), where("projectId", "==", projectId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const commentsWithUsernames = [];

        for (const docSnapshot of querySnapshot.docs) {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id; // 댓글의 ID를 가져옵니다.
            const userRef = doc(db, "users", commentData.userId);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                commentsWithUsernames.push({
                    ...commentData,
                    id: commentId, // 모든 댓글 데이터에 id를 추가
                    displayName: userData.displayName || "익명", // 사용자의 displayName이 존재하면 추가, 없으면 "익명" 사용
                });
            } else {
                commentsWithUsernames.push({
                    ...commentData,
                    id: commentId, // 이 부분을 if 조건문 안에서 밖으로 옮겼습니다.
                    displayName: "알 수 없음", // 사용자 정보가 없는 경우 "익명"으로 설정
                });
            }
        }

        setComments(commentsWithUsernames); // 상태 업데이트
    };

    function StarRating({ rating, setRating }) {
        const handleRatingSelect = (index, position) => {
            const rect = position.currentTarget.getBoundingClientRect();
            const positionX = position.clientX || position.changedTouches[0].clientX;
            const clickPosition = positionX - rect.left;
            const halfWidth = rect.width / 2;

            if (clickPosition < halfWidth) {
                setRating(index - 0.5);
            } else {
                setRating(index);
            }
        };

        const handleStarClick = (index, event) => {
            handleRatingSelect(index, event);
        };

        const handleStarTouch = (index, event) => {
            event.preventDefault();
            handleRatingSelect(index, event);
        };

        return (
            <div>
                {[...Array(5)].map((_, index) => {
                    const starIndex = index + 1;
                    return (
                        <button
                            key={starIndex}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={(e) => handleStarClick(starIndex, e)}
                            onTouchEnd={(e) => handleStarTouch(starIndex, e)}
                        >
                            {starIndex <= rating ? (
                                <FaStar color="#ffc107" size={'25px'} />
                            ) : starIndex - 0.5 === rating ? (
                                <FaStarHalfAlt color="#ffc107" size={'25px'} />
                            ) : (
                                <FaRegStar color="#ffc107" size={'25px'} />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }


    function StarDisplay({ rating }) {
        const totalStars = 5;
        let stars = [];

        let [intPart, decimalPart] = parseFloat(rating).toString().split('.').map(num => parseInt(num, 10));
        decimalPart = decimalPart ? decimalPart / 10 : 0;

        for (let i = 0; i < intPart; i++) {
            stars.push(<FaStar key={i} color="#ffc107" />);
        }

        if (decimalPart >= 0.5) {
            stars.push(<FaStarHalfAlt key="half" color="#ffc107" />);
            intPart += 1;
        }

        for (let i = intPart; i < totalStars; i++) {
            stars.push(<FaRegStar key={i} color="#ffc107" />);
        }

        return <div style={{ display: 'flex' }}>{stars}</div>;
    }

    const handleDeleteComment = async (commentId) => {
        if (window.confirm("정말로 삭제하시겠습니까?")) {
            try {
                await deleteDoc(doc(db, "comments", commentId));
                updateProjectRatingAverage(projectId);
                alert("삭제되었습니다.");
                fetchComments();
            } catch (error) {
                console.error("삭제 중 오류 발생:", error);
                alert("삭제에 실패했습니다.");
            }
        }
    };

    const updateProjectRatingAverage = async (projectId) => {
        const ratingsQuery = query(collection(db, "comments"), where("projectId", "==", projectId));
        const snapshot = await getDocs(ratingsQuery);

        let totalRating = 0;
        snapshot.forEach(doc => {
            totalRating += doc.data().rating;
        });

        const averageRating = snapshot.size > 0 ? totalRating / snapshot.size : 0;

        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            ratingAverage: averageRating
        });
    };

    const toggleLike = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const userLikes = projectData.likes || [];
            const userHasLiked = userLikes.includes(user.uid);

            let updatedLikes;
            if (userHasLiked) {
                // 이미 추천한 경우, 추천 취소
                updatedLikes = userLikes.filter(id => id !== user.uid);
            } else {
                // 아직 추천하지 않은 경우, 추천 추가
                updatedLikes = [...userLikes, user.uid];
            }

            // likesCount를 projects 컬렉션의 likes 배열의 길이로 설정
            const likesCount = updatedLikes.length;

            await updateDoc(projectRef, {
                likes: updatedLikes,
                likesCount: likesCount // likesCount 업데이트
            });

            // 상태 업데이트
            setLikesCount(likesCount);
            setIsLiked(!userHasLiked);
        }
    };

    return (
        <div className="project-detail-overlay">
            <div className="project-detail-popup">
                <button className="close-button" onClick={() => handleClosePopup()}><IoMdClose /></button>
                <div className="project-detail-container">
                    <div className="project-content">
                        {projectData && (
                            <>
                                <div className="project-image-slider">
                                    <img src={projectData.imageUrls[currentImageIndex]} alt={`이미지 ${currentImageIndex + 1}`} />
                                    <div className="image-index-overlay">
                                        {currentImageIndex + 1}/{projectData.imageUrls.length}
                                    </div>
                                    <div>
                                        <button className="slider-button prev-button" onClick={handlePrevClick}><MdArrowBackIosNew size={'20px'} /></button>
                                        <button className="slider-button next-button" onClick={handleNextClick}><MdArrowForwardIos size={'20px'} /></button>
                                    </div>
                                </div>
                                <div className="project-info">
                                    <div className="project-info-header">
                                        <h2 className="project-title">{projectData.title}</h2>
                                        <div className="project-date-views">
                                            <span className="project-date">{projectData.createdAt}</span>
                                            <span className="project-views">조회수 {projectData.views}회</span>
                                        </div>
                                    </div>
                                    <div className="project-info-body">
                                        <span className="project-author">{authorName}</span>
                                        <div className="project-actions">
                                            <button className="like-button" onClick={toggleLike} title='좋아요'>
                                                {isLiked ? <TbThumbUpFilled size={"20px"} /> : <TbThumbUp size={"20px"} />}
                                                <span className="likes-count">{likesCount}</span>
                                            </button>
                                            <button className="bookmark-button" onClick={toggleBookmark} title='북마크'>
                                                {isBookmarked ? <BsBookmarkFill size={"20px"} /> : <BsBookmark size={"20px"} />}
                                            </button>
                                            <button className="share-button" onClick={handleShare} title='공유'><FaRegShareSquare size={'20px'} /> </button>
                                            {projectData.fileUrl && (
                                                <button className="download-button" onClick={downloadFile} title='다운로드'><BiSolidDownload size={"20px"} /></button>
                                            )}
                                            {isAuthor && (
                                                <>
                                                    <button className="edit-button" onClick={handleEditProject} title='수정'><LiaEditSolid size={"20px"} /></button>
                                                    <button className="delete-button" onClick={handleDeleteProject} title='삭제'><MdDeleteOutline size={"20px"} /></button>
                                                </>

                                            )}
                                        </div>
                                    </div>
                                    <a href={ensureAbsoluteUrl(projectData.link)}
                                        className="project-url"
                                        target="_blank"
                                        rel="noopener noreferrer">{projectData.link}</a>
                                    <p className="project-description">{projectData.description}</p>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="project-comments-section">
                        <div className="comments-header">
                            <h3>리뷰</h3>

                        </div>
                        <div className="comments-list">
                            {comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <div className="commentContent">
                                        <div className='namediv' >
                                            <strong>{comment.displayName}</strong>
                                            <StarDisplay rating={comment.rating} />
                                        </div>
                                        <p>{comment.comment}</p>
                                        <p className="comment-date">{timeAgo(comment.createdAt.toDate())}</p>
                                    </div>
                                    {auth.currentUser && auth.currentUser.uid === comment.userId && (
                                        <button className='deleteComment' onClick={() => handleDeleteComment(comment.id)}><MdDeleteOutline size={'20px'} /></button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="rating-input-section">
                            <StarRating rating={rating} setRating={setRating} />
                        </div>
                        <div className="comment-input-section">
                            <input
                                type="text"
                                placeholder="작품을 평가 및 피드백해 주세요! "
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <button type="submit" onClick={submitComment}>작성</button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
export default ProjectDetail;
