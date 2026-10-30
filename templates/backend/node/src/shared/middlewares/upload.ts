import multer from 'multer';
import { AppError } from '../errors/app-error.js';

const MAX_MB = 10;

export const uploadPlanilha = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/\.(xlsx|csv)$/i.test(file.originalname)) cb(null, true);
    else cb(new AppError('Envie uma planilha .xlsx ou .csv', 400, 'ARQUIVO_INVALIDO'));
  },
}).single('arquivo');
