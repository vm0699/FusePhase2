import express from 'express';
import { verifyPhoneNumber, verifyCode, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/verifyPhoneNumber', verifyPhoneNumber);
router.post('/verifyCode', verifyCode);
router.post('/refresh-token', refreshToken);

export default router;
