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

    useEffect(() => {
        const fetchProjectData = async () => {
            const docRef = doc(db, 'projects', projectId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTitle(data.title);
                setDescription(data.description);
                setLink(data.link);
                // 불러온 이미지 URL들을 images 상태에 통합
                const loadedImages = data.imageUrls.map(url => ({ file: null, url: url }));
                setImages(loadedImages);
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
            setFile(e.target.files[0]);
        }
    };
    // 이미지 변경 핸들러
    const handleImageChange = (e) => {
        if (e.target.files) {
            const fileObjects = Array.from(e.target.files).map(file => ({
                file: file,
                url: URL.createObjectURL(file) // 파일로부터 생성된 URL
            }));
            setImages(fileObjects); // 파일 객체 배열을 상태에 설정
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
        let imageUrls = existingImageUrls;
        let fileUrl = existingFileUrl;

        if (images.length > 0) {
            imageUrls = await Promise.all(
                images.map(image => uploadFileToStorage(image, 'images'))
            );
        }

        if (file) {
            fileUrl = await uploadFileToStorage(file, 'files');
        }

        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            title,
            description,
            link,
            imageUrls,
            fileUrl,
        });

        alert('프로젝트가 업데이트 되었습니다.');
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
                <p>({maxDescriptionLength - description.length}/{maxDescriptionLength})</p>
                <p>URL</p>
                <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />

                <p>파일</p>
                <input type="file" onChange={handleFileChange} />

                <button type="submit">업로드</button>
            </form>
        </div>
    );
}

export default ProjectUpdate;
