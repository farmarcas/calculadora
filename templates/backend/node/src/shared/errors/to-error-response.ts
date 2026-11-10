import { ZodError } from 'zod';
import { AppError } from './app-error.js';

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
};

export type ErrorResponse = {
  statusCode: number;
  body: ErrorBody;
  level: 'warn' | 'error';
};

const internalError = (): ErrorResponse => ({
  statusCode: 500,
  level: 'error',
  body: {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      details: [],
    },
  },
});

const isUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof Error) || !('code' in error)) return false;
  return error.code === 'P2002';
};

export const toErrorResponse = (error: unknown): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      level: error.statusCode >= 500 ? 'error' : 'warn',
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  // Arquivo acima do limite do envio (Multer): mensagem de como corrigir, em vez de erro interno.
  if (error instanceof Error && error.name === 'MulterError' && 'code' in error) {
    const limite = error.code === 'LIMIT_FILE_SIZE';
    return {
      statusCode: 400,
      level: 'warn',
      body: {
        error: {
          code: limite ? 'ARQUIVO_GRANDE' : 'ARQUIVO_INVALIDO',
          message: limite
            ? 'O arquivo tem mais de 10 MB. Divida a planilha em arquivos menores.'
            : 'Envie uma planilha .xlsx ou .csv no campo "arquivo".',
          details: [],
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      level: 'warn',
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.issues.map((issue) => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        },
      },
    };
  }

  if (isUniqueViolation(error)) {
    return {
      statusCode: 409,
      level: 'warn',
      body: {
        error: {
          code: 'CONFLICT',
          message: 'Registro duplicado',
          details: [],
        },
      },
    };
  }

  return internalError();
};
