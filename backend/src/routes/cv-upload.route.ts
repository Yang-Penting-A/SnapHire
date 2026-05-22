import { Router } from 'express';
import multer from 'multer';
import { uploadCv } from '../controllers/cv.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadCv);

export default router;