import { Router } from 'express';
import {
  saveUserProfile,
  getProfileByPhoneNumber,
  getFilteredProfiles,
  handleSwipe,
  uploadPhotos,
  updateUserProfile
} from '../controllers/ProfileController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/FileUpload.js';

const router = Router();

// POST: Save or update user profile
router.post('/', saveUserProfile);

// ✅ FIX: Use Multer for updating profile (to handle FormData)
router.put('/update', authMiddleware, upload.array('photos', 6), updateUserProfile);

router.put('/update', authMiddleware, updateUserProfile);

// ✅ FIX: Upload photos separately (if needed)
router.post('/upload-photos', authMiddleware, upload.array('photos', 6), uploadPhotos);

// GET: Fetch user profile by phone number (requires authentication)
router.get('/', authMiddleware, getProfileByPhoneNumber);

// GET: Fetch filtered profiles for the swipe screen (requires authentication)
router.get('/filteredProfiles', authMiddleware, getFilteredProfiles);

router.post('/swipe', authMiddleware, handleSwipe);

export default router;
