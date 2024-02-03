import React, { useState, useEffect } from 'react';
import ProjectList from '../components/ProjectList';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

async function fetchProjectsByIds(projectIds) {
    const projects = [];

    for (const projectId of projectIds) {
        const projectRef = doc(db, "projects", projectId);
        const projectSnapshot = await getDoc(projectRef);
        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            projects.push({
                id: projectSnapshot.id,
                ...projectData,
                relativeDate: timeAgo(projectData.createdAt.toDate()),
            });
        }
    }

    return projects;
}

function Bookmarks() {
    const [bookmarkedProjects, setBookmarkedProjects] = useState([]);
    const [displayName, setDisplayName] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    useEffect(() => {
        const fetchBookmarkedProjects = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const projects = await fetchProjectsByIds(userData.bookmarks || []);
                    setBookmarkedProjects(projects);
                    setDisplayName(userData.displayName || "");
                }
            }
        };

        auth.onAuthStateChanged((user) => {
            fetchBookmarkedProjects();
        });
    }, [refreshTrigger]);

    return (
        <div>
            <h2>{displayName && `${displayName}님의 북마크`}</h2>
            <ProjectList projectsData={bookmarkedProjects} isBookmarkPage={true} setRefreshTrigger={setRefreshTrigger} />
        </div>
    );
}

export default Bookmarks;