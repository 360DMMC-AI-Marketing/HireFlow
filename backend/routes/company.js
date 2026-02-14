import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getCompany, createCompany, updateCompany, addMember, removeMember } from "../controllers/companyController.js";

const router = Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(getCompany)
    .post(createCompany)
    .put(updateCompany);

router.route('/members')
    .post(addMember);

router.route('/members/:userId')
    .delete(removeMember);

export default router;