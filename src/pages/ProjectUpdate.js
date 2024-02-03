import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage, db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import '../styles/ProjectUpload.css';

function ProjectUpdate() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [existingFileUrl, setExistingFileUrl] = useState('');
    const [imageUrls, setImageUrls] = useState([]);
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        const fetchProjectData = async () => {
            const docRef = doc(db, 'projects', projectId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTitle(data.title);
                setDescription(data.description);
                setLink(data.link);
                const loadedImages = data.imageUrls.map(url => ({ file: null, url: url }));
                setImages(loadedImages);
                const fileName = data.fileUrl ? data.fileUrl.split('/').pop().split('?')[0] : ''; // 간단한 추출 방법
                setExistingFileUrl(data.fileUrl || '');
                setFileName(fileName);
            } else {
                console.log("No such document!");
                navigate('/');
            }
        };

        fetchProjectData();
    }, [projectId, navigate]);

    const uploadFileToStorage = async (file, folder) => {
        const fileRef = ref(storage, `${folder}/${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        return getDownloadURL(snapshot.ref);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            // 사용자에게 기존 파일을 삭제할 것인지 확인
            const confirmDelete = fileName ? window.confirm("기존 파일을 삭제하고 새 파일을 업로드하시겠습니까?") : true;
            if (confirmDelete) {
                setFile(e.target.files[0]); // 새 파일 상태 설정
                setFileName(''); // 기존 파일 이름 상태 초기화
                setExistingFileUrl(''); // 기존 파일 URL 상태 초기화
            } else {
                // 사용자가 취소를 선택한 경우, 파일 입력 필드를 리셋
                e.target.value = '';
            }
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const fileObjects = Array.from(e.target.files).map(file => ({
                file: file,
                url: URL.createObjectURL(file)
            }));
            setImages(prevImages => [...prevImages, ...fileObjects]);
        }
    };

    // 썸네일로 설정
    const setAsThumbnail = (index) => {
        setImages((prevImages) => {
            const newImages = [...prevImages];
            const selectedImage = newImages.splice(index, 1)[0];
            newImages.unshift(selectedImage);
            return newImages;
        });
    };

    const removeImage = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // 파일 입력 필드 초기화
        }
    };

    const updateProjectData = async () => {
        let uploadedImageUrls = [];
        let fileUrl = existingFileUrl;

        // 이미지 파일 업로드 로직 수정
        if (images.length > 0) {
            const uploadPromises = images.map(image => {
                // 파일 객체가 존재할 때만 업로드를 시도합니다.
                if (image.file) {
                    return uploadFileToStorage(image.file, 'images');
                } else {
                    // 파일 객체가 없는 경우(기존에 업로드된 이미지 URL), URL을 직접 반환합니다.
                    return Promise.resolve(image.url);
                }
            });
            uploadedImageUrls = await Promise.all(uploadPromises);
        }

        // 새 파일 업로드 처리
        if (file) {
            fileUrl = await uploadFileToStorage(file, 'files');
        }

        // Firestore 문서 업데이트 시, 업로드된 이미지 URL 배열 사용
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            title,
            description,
            link,
            imageUrls: uploadedImageUrls, // 수정된 이미지 URL 배열
            fileUrl,
        });

        alert('프로젝트 수정 완료');
        navigate('/');
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        updateProjectData();
    };

    const maxDescriptionLength = 800;

    const handleDescriptionChange = (e) => {
        const text = e.target.value;
        if (text.length <= maxDescriptionLength) {
            setDescription(text);
        }
    };

    return (
        <div className="projectUpload">
            <form onSubmit={handleSubmit}>
                <p>프로젝트 이름</p>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

                <p>이미지 (최대 5개)</p>
                <p style={{ fontSize: '13px', fontWeight: 'normal' }}>좌클릭 썸네일 선택, 우클릭 삭제</p>
                <input type="file" multiple onChange={handleImageChange} ref={fileInputRef} />
                <div className="image-preview">
                    {images.map((imageObj, index) => (
                        <div
                            key={index}
                            className={`preview-item ${index === 0 ? 'selected-thumbnail' : ''}`}
                            onClick={() => setAsThumbnail(index)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                removeImage(index);
                            }}
                        >
                            <img src={imageObj.url} alt={`이미지-${index}`} />
                        </div>
                    ))}
                </div>
                <p>설명</p>
                <textarea
                    value={description}
                    onChange={handleDescriptionChange}
                    rows="8"
                    placeholder="프로젝트에 대한 설명을 작성하세요"
                ></textarea>
                <p>({description.length}/{maxDescriptionLength})</p>
                <p>URL</p>
                <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />
                {existingFileUrl && (
                    <div>
                        <p>현재 파일: <a href={existingFileUrl} target="_blank" rel="noopener noreferrer"> {fileName}</a></p>
                        <button type="button" onClick={() => setExistingFileUrl('')}>기존 파일 삭제</button>
                    </div>
                )}
                <p>새 파일 업로드 (기존 파일 대체):</p>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">업로드</button>
            </form>
        </div>
    );
}

export default ProjectUpdate;
