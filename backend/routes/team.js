import  {Router} from "express";
const router=Router();
router.get('/api/team/members',(req,res)=>{
    res.send('Team Members API is working');
});
router.post('/api/team/invite',(req,res)=>{
    res.send('Team Invite API is working');
});
router.patch('/api/team/:userId/role',(req,res)=>{
    res.send('Team Remove Member API is working');
});
router.delete('/api/team/:userId',(req,res)=>{
    res.send('Team Remove Member API is working');
}   );

export default router;