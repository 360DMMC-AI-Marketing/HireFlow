import JobForm from '../components/jobs/JobForm';
import api from '@/utils/axios';

const EditJobPage = ({ existingJobData }) => {
    const handleUpdate = async (formData) => {
        try {
            await api.patch(`/jobs/${existingJobData.id}`, formData);
            alert('Job Updated!');
            // Redirect user...
        } catch (error) {
            console.error(error);
        }   
    };

    return (
        <div className="p-6">
            <JobForm 
                initialData={existingJobData} 
                onSubmit={handleUpdate} 
            />
        </div>
    );
};

export default EditJobPage; 