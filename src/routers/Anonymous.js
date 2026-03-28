import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
const router = express.Router();
import { createAnonymousReview, getAnonymousReviews, deleteAnonymousReview, getAllAnonymousReviews } from '../controllers/Anonymous.js';



router.post('/addReview', checkAuth, createAnonymousReview);
router.get('/allReviews', checkAuth, getAllAnonymousReviews);
router.get('/reviews/:meetingId', checkAuth, getAnonymousReviews);
router.delete('/review/:id', checkAuth, deleteAnonymousReview);

export default router;