import React, { useState, useRef, useEffect } from 'react';
import { storage, db, auth } from '../firebase';
import { getDoc, doc, updateDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import '../styles/ProjectDetail.css';
import '../styles/ProjectUpload.css'

import { BsBookmark } from 'react-icons/bs';
import { BiSolidDownload } from "react-icons/bi";
import { FaRegShareSquare } from 'react-icons/fa';
import { MdDeleteOutline, MdArrowForwardIos, MdArrowBackIosNew } from "react-icons/md";
import { TbThumbUp } from "react-icons/tb";
import { LiaEditSolid } from "react-icons/lia";

function ProjectUpdate() {

    const { projectId } = useParams();
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [thumbnailIndex, setThumbnailIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [existingFileUrl, setExistingFileUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [toDeleteFile, setToDeleteFile] = useState(null);
    const [createdAt, setCreatedAt] = useState('');
    const [authorDisplayName, setAuthorDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate()

    useEffect(() => {

        const fetchAuthorDisplayName = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setAuthorDisplayName(docSnap.data().displayName);
                } else {
                    console.log("해당 사용자를 찾을 수 없습니다.");
                }
            }
        };

        fetchAuthorDisplayName();

        const fetchProjectData = async () => {
            const docRef = doc(db, 'projects', projectId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (!auth.currentUser || (auth.currentUser && auth.currentUser.uid !== data.userId)) {
                    alert('접근 권한이 없습니다.');
                    navigate('/');
                    return;
                }

                setTitle(data.title);
                setDescription(data.description);
                setLink(data.link);
                const loadedImages = data.imageUrls.map(url => ({ file: null, url: url }));
                setImages(loadedImages);

                const thumbnailUrl = data.thumbnailUrl;
                const thumbnailIndex = loadedImages.findIndex(image => image.url === thumbnailUrl);
                setThumbnailIndex(thumbnailIndex >= 0 ? thumbnailIndex : 0);

                const createdDate = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
                setCreatedAt(formatDate(createdDate));

                const fileName = data.fileUrl ? data.fileUrl.split('/').pop().split('?')[0] : '';
                setExistingFileUrl(data.fileUrl || '');
                setFileName(fileName);
            } else {
                console.log("No such document!");
                navigate('/');
            }
        };

        fetchProjectData();
    }, [projectId, navigate]);

    const handleImageChange = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files).slice(0, 5 - images.length).map(file => ({
                file,
                url: URL.createObjectURL(file) // 미리보기 URL 생성
            }));
            setImages([...images, ...newImages]);
            fileInputRef.current.value = ''; // input 필드 초기화
        }
    };

    const handleImageClick = (index) => {
        setThumbnailIndex(index);
    };

    const removeImage = (index) => {
        // 현재 보여지는 이미지가 삭제되면, 다음 이미지 또는 이전 이미지로 이동
        let newIndex = currentImageIndex;

        if (images.length === 1) {
            // 마지막 남은 이미지를 삭제하는 경우
            newIndex = 0;
        } else if (index === currentImageIndex) {
            // 현재 표시된 이미지를 삭제하는 경우
            if (index === images.length - 1) {
                // 마지막 이미지를 삭제하는 경우, 인덱스를 하나 줄임
                newIndex = currentImageIndex - 1;
            } // 그 외 경우는 다음 이미지를 보여줄 수 있으므로 인덱스 조정 필요 없음
        } else if (index < currentImageIndex) {
            // 현재 표시된 이미지보다 앞에 있는 이미지를 삭제하는 경우, 인덱스 조정
            newIndex = currentImageIndex - 1;
        }

        // 이미지 배열에서 해당 이미지 삭제 후, 현재 이미지 인덱스 업데이트
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
        setCurrentImageIndex(newIndex);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 이전 이미지로 이동하는 함수
    const handlePrevImage = () => {
        setCurrentImageIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : images.length - 1);
    };

    // 다음 이미지로 이동하는 함수
    const handleNextImage = () => {
        setCurrentImageIndex(prevIndex => prevIndex < images.length - 1 ? prevIndex + 1 : 0);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const newFile = e.target.files[0];

            setFile(newFile); // 새 파일 상태 설정
            setFileName(newFile.name); // 새 파일 이름으로 상태 업데이트

            // 기존 파일 URL이 있으면 삭제 예정 목록에 추가
            if (existingFileUrl) {
                setToDeleteFile(existingFileUrl);
            }

            setExistingFileUrl(''); // 기존 파일 URL 상태 초기화
            e.target.value = ''; // 파일 입력 필드를 리셋
        }
    };

    const uploadFiles = async (files, folder) => {
        const urls = [];
        for (const file of files) {
            const fileRef = ref(storage, `${folder}/${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            urls.push(url);
        }
        return urls;
    };

    const uploadFile = async (file, folder) => {
        const fileRef = ref(storage, `${folder}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const handleDeleteFile = () => {
        setToDeleteFile(existingFileUrl); // 삭제할 파일을 삭제 예정 목록에 추가
        setExistingFileUrl(''); // 기존 파일 URL 초기화
        setFileName(''); // 파일 이름 초기화
        setFile(null); // 새 파일 상태 초기화
    };
    const saveProjectData = async (userId, title, description, link, imageUrls, thumbnailUrl, fileUrl) => {
        const projectRef = doc(db, 'projects', projectId);
        const projectData = {
            userId,
            title,
            description,
            link,
            imageUrls,
            thumbnailUrl, // 썸네일 URL 추가
            ...(file ? { fileUrl: fileUrl } : existingFileUrl ? {} : { fileUrl: deleteField() }),
            updatedAt: new Date(),
        };

        try {
            await updateDoc(projectRef, projectData);
            alert('작품 업데이트 완료');
            navigate('/');
        } catch (error) {
            console.error('작품 업데이트 에러:', error);
            alert('작품 업데이트 실패');
        }
    };

    const uploadToFirebase = async () => {
        setIsUploading(true); // 업로드 상태를 true로 설정
        setIsLoading(true); // 로딩 시작
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            alert('로그인이 필요합니다.');
            setIsUploading(false);
            return;
        }

        // 새로운 이미지 파일만 업로드하고, URL을 가져옴
        const newImageFiles = images.filter(image => image.file).map(image => image.file);
        const newImageUrls = await uploadFiles(newImageFiles, 'images');
        const existingImageUrls = images.filter(image => !image.file).map(image => image.url);
        const allImageUrls = [...existingImageUrls, ...newImageUrls];

        // 썸네일 이미지 URL 결정
        const thumbnailUrl = thumbnailIndex >= 0 && allImageUrls[thumbnailIndex] ? allImageUrls[thumbnailIndex] : allImageUrls[0];

        // 파일 URL 업데이트 로직
        let fileUrl = existingFileUrl; // 기존 파일 URL을 초기값으로 설정
        if (file) {
            fileUrl = await uploadFile(file, 'files'); // 새 파일이 있으면 업로드 후 URL 업데이트
        }

        try {
            // 작품 데이터 저장, 썸네일 이미지 URL 포함하여 전달
            await saveProjectData(userId, title, description, link, allImageUrls, thumbnailUrl, fileUrl);
            navigate('/'); // 성공적으로 업로드 후 리다이렉션
        } catch (error) {
            console.error('업로드 중 오류 발생:', error);
            alert('업로드에 실패했습니다.');
        } finally {
            setIsLoading(false); // 로딩 종료
            setIsUploading(false); // 업로드 상태를 false로 설정
        }
    };


    const maxDescriptionLength = 800;
    const handleDescriptionChange = (e) => {
        const text = e.target.value;
        if (text.length <= maxDescriptionLength) {
            setDescription(text);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // 폼의 기본 제출 동작 방지

        // 필수 요소 검증
        if (!title.trim() || !description.trim() || images.length === 0) {
            alert('제목, 설명, 이미지는 모두 필수 요소입니다.');
            return; // 검증 실패 시, 여기서 함수 실행 종료
        }

        if (toDeleteFile) {
            const fileRef = ref(storage, toDeleteFile);
            await deleteObject(fileRef).then(() => {
                console.log('File successfully deleted');
                setToDeleteFile(null); // 삭제 완료 후 상태 업데이트
            }).catch((error) => {
                console.error('Error removing file: ', error);
            });
        }

        // 모든 검증을 통과했을 경우, 업로드 로직 실행
        uploadToFirebase();
    };


    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    const onDragEnd = (result) => {
        // 드롭되지 않은 아이템은 무시
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        // 이미지 순서 변경
        const newImages = reorder(
            images,
            sourceIndex,
            destinationIndex
        );

        // 썸네일 인덱스 업데이트
        let newThumbnailIndex = thumbnailIndex;
        if (thumbnailIndex === sourceIndex) {
            // 원래 썸네일이 이동한 경우, 썸네일 인덱스를 목적지 인덱스로 업데이트
            newThumbnailIndex = destinationIndex;
        } else if (thumbnailIndex > sourceIndex && thumbnailIndex <= destinationIndex) {
            // 원래 썸네일이 이동 범위 안에 있고, 드래그된 아이템이 썸네일 앞에서 뒤로 이동한 경우
            newThumbnailIndex -= 1;
        } else if (thumbnailIndex < sourceIndex && thumbnailIndex >= destinationIndex) {
            // 원래 썸네일이 이동 범위 안에 있고, 드래그된 아이템이 썸네일 뒤에서 앞으로 이동한 경우
            newThumbnailIndex += 1;
        }

        // 상태 업데이트
        setImages(newImages);
        setThumbnailIndex(newThumbnailIndex);
    };

    function formatDate(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1; // getMonth()는 0부터 시작
        const d = date.getDate();
        const h = date.getHours();
        const mi = date.getMinutes();
        const session = h < 12 ? '오전' : '오후';

        const hour = h % 12 || 12; // 12시간제로 변환
        const minute = mi < 10 ? `0${mi}` : mi; // 분이 한 자리수인 경우 앞에 0 추가

        return `${y}. ${m < 10 ? `0${m}` : m}. ${d < 10 ? `0${d}` : d}. ${session} ${hour}:${minute}`;
    }

    return (
        <div className='uploadWrap'>
            <div className="project-detail-popup-up">
                {isLoading && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
                <form>
                    <div className="project-detail-container">
                        <div className="project-content-up">
                            <div className="project-image-slider" id='slider-up'>
                                {images.length > 0 && (
                                    <img src={images[currentImageIndex].url || URL.createObjectURL(images[currentImageIndex].file)} alt={`작품 이미지 ${currentImageIndex + 1}`} />
                                )}
                                <div className="image-index-overlay">
                                    {images.length > 0 ? `${currentImageIndex + 1}/${images.length}` : "0/0"}
                                </div>
                                <div>
                                    <button type="button" className="slider-button prev-button" onClick={handlePrevImage}><MdArrowBackIosNew size={'20px'} /></button>
                                    <button type="button" className="slider-button next-button" onClick={handleNextImage}><MdArrowForwardIos size={'20px'} /></button>
                                </div>
                            </div>
                            <div className="project-info">
                                <div className="project-info-header">
                                    <h2 className="project-title">
                                        <input type="text" placeholder='작품 제목' value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </h2>
                                    <div className="project-date-views">
                                        <span className="project-date">{createdAt}</span>
                                        <span className="project-views">조회수 100회</span>
                                    </div>
                                </div>
                                <div className="project-info-body">
                                    <span className="project-author">{authorDisplayName || '알 수 없음'}</span>
                                    <div className="project-actions">
                                        <button className="like-button" type='button'><span className="likes-count"><TbThumbUp size={"20px"} />99</span></button>
                                        <button className="bookmark-button" type='button'><BsBookmark size={"20px"} /></button>
                                        <button className="share-button" type='button' ><FaRegShareSquare size={'20px'} /> </button>
                                        <button className="download-button" type='button' ><BiSolidDownload size={"20px"} /></button>
                                        <button className="edit-button" type='button'><LiaEditSolid size={"20px"} /></button>
                                        <button className="delete-button" type='button' ><MdDeleteOutline size={"20px"} /></button>
                                    </div>
                                </div>
                                <input type="text" className='project-url' value={link} placeholder='https://example.com' onChange={(e) => setLink(e.target.value)} />
                                <div className="project-description">
                                    <textarea
                                        className='up-texta'
                                        value={description}
                                        onChange={handleDescriptionChange}
                                        rows="7"
                                        placeholder="작품에 대한 설명을 작성하세요"
                                    >
                                    </textarea>
                                    <p>({description.length}/{maxDescriptionLength})</p>
                                </div>
                                {fileName && (
                                    <div>
                                        <p className='nowfile'>현재 파일: <a href={existingFileUrl} target="_blank" rel="noopener noreferrer"> {fileName}</a></p>
                                        <button type="button" className='deleteFile' onClick={handleDeleteFile}><MdDeleteOutline size={"20px"} /></button>
                                    </div>
                                )}
                                <div className='newFile'>새 파일 업로드 (기존 파일 대체):</div>
                                <input type="file" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div className="project-comments-section-up">
                            <p>이미지 (최대 5개)</p>
                            <p style={{ fontSize: '13px', fontWeight: 'normal' }}>클릭해서 썸네일 지정</p>
                            <input type="file" multiple onChange={handleImageChange} ref={fileInputRef} />
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="droppable-images" direction="horizontal">
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="image-preview">
                                            {images.map((image, index) => (
                                                <Draggable key={index} draggableId={`image-${index}`} index={index}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                            className={`preview-item ${index === thumbnailIndex ? 'thumbnail-selected' : ''}`}
                                                            onClick={() => handleImageClick(index)}>
                                                            <img src={image.url} alt={`이미지 ${index + 1}`} />
                                                            {index === thumbnailIndex && <div className="thumbnail-text">썸네일</div>}
                                                            <button type="button" className="delete-img" onClick={(e) => { e.stopPropagation(); removeImage(index); }}>
                                                                <MdDeleteOutline size={"20px"} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}

                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                            <button
                                type="submit"
                                className='submitBtn'
                                onClick={handleSubmit}
                                disabled={isUploading || !title.trim() || !description.trim() || images.length === 0}
                            >
                                수정
                            </button>
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
}

export default ProjectUpdate;