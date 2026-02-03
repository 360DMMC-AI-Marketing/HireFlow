import { Router } from "express";
import userrouter from './backend/user/user.js';
const router = Router();
router.use('/auth',authrouter);
router.use('/jobs',jobsrouter);
router.use('/integrations',integrationsrouter);
router.use('/user',userrouter);
router.use('/company',companyrouter);
router.use('/question-banks',questionbanksrouter);
router.use('/candidates',candidatesrouter);
router.use('/interviews',interviewsrouter);
router.use('/analytics',analyticsrouter);
router.use('/settings',settingsrouter);
router.use('/billing',billingrouter);   
router.use('/team',teamrouter); 
router.use('/emails',emailsrouter);  
router.use('/email-templates',emailtemplatesrouter); 

export default router;