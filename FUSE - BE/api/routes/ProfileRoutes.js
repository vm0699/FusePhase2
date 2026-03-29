import { Router } from 'express';
import {
  saveUserProfile,
  getProfileByPhoneNumber,
  getFilteredProfiles,
  handleSwipe,
  uploadPhotos,
  updateUserProfile,
  reorderPhotos,
  deletePhoto,
} from '../controllers/ProfileController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/FileUpload.js';

const router = Router();

// POST: Save or update user profile
router.post('/', authMiddleware, saveUserProfile);

// ✅ FIX: Use Multer for updating profile (to handle FormData)
// router.put('/update', authMiddleware, upload.array('photos', 6), updateUserProfile);

router.put('/update', authMiddleware, updateUserProfile);

// ✅ FIX: Multer MUST run BEFORE authMiddleware on multipart routes.
// authMiddleware does an async DB call; if the stream hasn't been consumed yet
// the TCP receive buffer fills up → ECONNRESET. Parsing first, then authenticating.
router.post('/upload-photos', upload.array('photos', 6), authMiddleware, uploadPhotos);


// GET: Fetch user profile by phone number (requires authentication)
router.get('/', authMiddleware, getProfileByPhoneNumber);

// GET: Fetch filtered profiles for the swipe screen (requires authentication)
router.get('/filteredProfiles', authMiddleware, getFilteredProfiles);
router.post('/filteredProfiles', authMiddleware, getFilteredProfiles);

router.post('/swipe', authMiddleware, handleSwipe);

router.put("/reorder-photos", authMiddleware, reorderPhotos);
router.delete("/delete-photo", authMiddleware, deletePhoto);

export default router;
