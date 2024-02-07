import React, { Suspense } from 'react';
import '../styles/Home.css';
import ProjectUpload from './ProjectUpload';

// ProjectList 컴포넌트를 lazy loading으로 불러옵니다.
const ProjectList = React.lazy(() => import('../components/ProjectList'));

function Home() {
    return (
        <div className="home">
            <div className="contents">
                <Suspense fallback={<ProjectUpload />}>
                    <ProjectList />
                </Suspense>
            </div>
        </div>
    );
}

export default Home;