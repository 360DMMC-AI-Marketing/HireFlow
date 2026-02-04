import {Router} from 'express' ;
const router = Router();
router.get('/api/jobs', (req, res) => {
    res.send('Jobs list endpoint');
});
router.patch('/api/jobs/:id/status', (req, res) => {
    res.send('Apply to job endpoint');
});
router.delete('/api/jobs/:id', (req, res) => {
    res.send('Delete job endpoint');
}); 
router.get('/api/jobs/create', (req, res) => {
    res.send('Get job details endpoint');   
});

router.post('/api/jobs/draft', (req, res) => {
    res.send('Create job endpoint');   
});
router.post('/api/jobs/generate-description', (req, res) => {
    res.send('Publish job endpoint');   
});
router.post('/api/jobs/validate-slug', (req, res) => {
    res.send('Validate job slug endpoint');
});
router.post('/api/jobs', (req, res) => {
    res.send('Generate job description endpoint');   
}); 

router.get('/api/jobs/:id/distribution-status', (req, res) => {
    res.send('Get job distribution links endpoint');   
}   );
router.get('/api/jobs/:id', (req, res) => {
    res.send('Get job details endpoint');   
}   );  
router.patch('/api/jobs/:id', (req, res) => {
    res.send('Update job endpoint');   
}   );
router.patch('/api/jobs/:id/status', (req, res) => {
    res.send('Distribute job endpoint');   
}         );
router.delete('/api/jobs/:id', (req, res) => {
    res.send('Remove job endpoint');   
}   );  

router.get('/api/jobs/:id/analytics', (req, res) => {
    res.send('Get job analytics endpoint');   
});
router.get('/api/jobs/:id/candidates', (req, res) => {
    res.send('Get job applicants endpoint');   
}   );
router.patch('/api/candidates/bulk-update', (req, res) => {
    res.send('Update applicant status endpoint');   
}   );

router.get('/api/candidates/:id/resume', (req, res) => {
    res.send('Get applicant details endpoint');   
}   );
router.get('/api/candidates/:id/interview-settings', (req, res) => {
    res.send('Get applicant interview settings endpoint');   
}   );
router.put('/api/candidates/:id/interview-settings', (req, res) => {
    res.send('Update applicant interview settings endpoint');   
}   );

export default router;