import { useParams } from 'react-router-dom';

function ProjectDetail() {
    let { id } = useParams();

    return (
        <div className="projectDetail">
            project detail : {id}
        </div>
    );
}

export default ProjectDetail;
