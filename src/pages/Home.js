import React from 'react';
import '../styles/Home.css';

const ProjectList = React.lazy(() => import('../components/ProjectList'));

function Home(searchQuery) {

    return (
        <div className="home">
            <div className="contents">
                <ProjectList searchQuery={searchQuery} />
            </div>
        </div>
    );
}

export default Home;