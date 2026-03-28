import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import { createOrganization, getOrganizationById, getAllOrganizations } from '../controllers/organizationController.js';
import multer from 'multer'; // ✅ Add karo

const upload = multer({ dest: 'uploads/' }); // ✅ Add karo

const router = express.Router();

router.post('/create', checkAuth, upload.single('logo'),  createOrganization);
router.get('/:id', checkAuth, getOrganizationById);
router.get('/', checkAuth, getAllOrganizations);
router.delete('/:id', checkAuth, createOrganization);

export default router;