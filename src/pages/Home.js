import Header from "../components/Header";
import ProjectList from "../components/ProjectList";

import '../styles/Home.css'

function Home() {
    return (
        <div className="home">
            <Header />

            <div className="contents">
                <ProjectList />
            </div>
        </div>
    );
}

export default Home;
