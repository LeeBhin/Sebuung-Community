import React, { Suspense } from 'react';
import '../styles/Home.css';

const ProjectList = React.lazy(() => import('../components/ProjectList'));

function Home({ searchQuery, searchOption, sortOption }) {
    return (
        <div className="home">
            <div className="contents">
                <Suspense fallback={<div>Loading projects...</div>}>
                    <ProjectList searchQuery={searchQuery} searchOption={searchOption} sortOption={sortOption} />
                </Suspense>
            </div>
        </div>
    );
}

export default Home;
