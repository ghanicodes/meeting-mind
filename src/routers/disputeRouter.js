import express from 'express';
import {
    createDispute,
    getDisputeById,
    getAllDisputes,
    updateDispute,
    resolveDispute
} from '../controllers/dispute.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.post('/',                checkAuth, createDispute);
router.get('/',                 checkAuth, getAllDisputes);
router.get('/:id',              checkAuth, getDisputeById);
router.patch('/:id',            checkAuth, updateDispute);
router.patch('/:id/resolve',    checkAuth, resolveDispute);

export default router;
// ```

// ---

// **Postman tests:**

// | Action | Method | URL |
// |--------|--------|-----|
// | Create | `POST` | `/dispute` |
// | Read All | `GET` | `/dispute` |
// | Read By ID | `GET` | `/dispute/:id` |
// | Update | `PATCH` | `/dispute/:id` |
// | Resolve | `PATCH` | `/dispute/:id/resolve` |

// **Advanced query examples:**
// ```
// GET /dispute?isResolved=false
// GET /dispute?meetingId=abc123
// GET /dispute?search=incorrect&page=1&limit=5
// GET /dispute?startDate=2026-01-01&endDate=2026-03-20



