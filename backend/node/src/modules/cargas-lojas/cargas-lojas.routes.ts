import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { auditar } from '../../shared/auditoria/auditoria.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { exigirPerfil, type Perfil } from '../../shared/middlewares/perfil.js';
import { uploadPlanilha } from '../../shared/middlewares/upload.js';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { cargasLojasRepository, type CargasLojasRepository } from './cargas-lojas.repository.js';
import { makeCargasLojasService } from './cargas-lojas.service.js';
import { gerarModeloLojas } from './modelo-lojas.js';

const vazio = z.object({}).strict();
const confirmarReq = z.object({
  body: z
    .object({
      // "nenhum" mantém o que o empresário corrigiu; "todos" substitui; ou a lista de CNPJs a substituir.
      substituirConflitos: z
        .union([z.enum(['nenhum', 'todos']), z.array(z.string().max(14)).max(5000)])
        .default('nenhum'),
    })
    .strict(),
  params: z.object({ id: z.string().uuid() }).strict(),
  query: vazio.default({}),
});

const soOperador = exigirPerfil('PLATFORM_OPERATOR');

// Carga de lojas da plataforma: o arquivo traz vários GEs, então estas rotas não usam o X-GE.
export const cargasLojasRouter = (repo: CargasLojasRepository = cargasLojasRepository) => {
  const s = makeCargasLojasService(repo, auditar);
  const r = Router();

  r.get('/cargas-lojas/modelo', soOperador, async (_req, res) => {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="modelo-lojas.xlsx"');
    res.send(await gerarModeloLojas());
  });

  r.post('/cargas-lojas', soOperador, uploadPlanilha, async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('Envie o arquivo no campo "arquivo".');
    res.status(201).json(await s.conferir(req.file.originalname, req.file.buffer));
  });

  r.post('/cargas-lojas/:id/confirmar', soOperador, validate(confirmarReq), async (_req, res) => {
    const { params, body } = readValidated<z.infer<typeof confirmarReq>>(res);
    res.json(await s.confirmar(params.id, body.substituirConflitos, res.locals.perfil as Perfil));
  });
  return r;
};
