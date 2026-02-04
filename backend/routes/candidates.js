import Router from 'express';
const router = Router();
router.patch('/api/candidates/bulk-updates', (req, res) => {
    res.send('Update candidate status endpoint');
}   );
router.get('/api/candidates/:id/resume', (req, res) => {
    res.send('Get candidate resume endpoint');
}   );
router.get('/api/candidates/:id', (req, res) => {
    res.send('Get candidate details endpoint');
}   );
router.get('/api/candidates/:id/resume-url', (req, res) => {
    res.send('Get candidate resume URL endpoint');
}   );
router.get('/api/candidates/:id/analysis', (req, res) => {
    res.send('Get candidate analysis endpoint');
}   );
router.patch('/api/candidates/:id/notes', (req, res) => {
    res.send('Update candidate notes endpoint');
}   );
router.patch('/api/candidates/:id/status', (req, res) => {
    res.send('Update candidate status endpoint');
}   );  
router.get('/api/candidates/:id/comparison', (req, res) => {
    res.send('Get candidate comparison endpoint');
}   );
router.get('/api/candidates/:id/emails', (req, res) => {
    res.send('Get candidate interview emails endpoint');
}   );
router.post('/api/candidates/:id/interview', (req, res) => {
    res.send('Interview endpoint');
}   );
router.get('/api/candidates/:id/interview-recording', (req, res) => {
    res.send('Get candidate interview recording endpoint');
}   );
router.get('/api/candidates/:id/interview-transcript', (req, res) => {
    res.send('Get candidate interview transcripts endpoint');
}   );
router.get  ('/api/candidates/:id/interview-analysis', (req, res) => {
    res.send('Get candidate interview analysis endpoint');
}   );
router.post('/api/candidates/:id/interview/dismiss-flag', (req, res) => {
    res.send('Dismiss interview flag endpoint');
}   );
router.post('/api/candidates/:id/interview/share', (req, res) => {
    res.send('Share interview endpoint');
}   );
export default router;