import Header from "../components/Header";
import ProjectList from "../components/ProjectList";

function Home() {
    return (
        <div className="home">
            <Header />

            <div className="contents" style={{ border: "solid 1px", width: "95%", height: "88vh", margin: "20px auto" }}>
                <ProjectList />
            </div>
        </div>
    );
}

export default Home;
