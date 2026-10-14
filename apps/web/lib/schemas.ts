import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email('El correo no tiene un formato valido.'),
  password: z.string().min(8, 'La contrasena tiene al menos 8 caracteres.'),
});

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(120, 'Maximo 120 caracteres.'),
});

export const SaveDraftSchema = z.object({
  projectId: z.string().uuid(),
  rawText: z.string().max(51200, 'El texto excede el limite de 50 KB.'),
  textHash: z.string(),
  summary: z.object({
    reqs: z.number(),
    findings: z.number(),
    cases: z.number(),
    score: z.number(),
    verifPct: z.number(),
  }),
});

export const SaveVersionSchema = z.object({
  projectId: z.string().uuid(),
  note: z.string().max(280).optional(),
});

export const SetDecisionSchema = z.object({
  setId: z.string().uuid(),
  findingKey: z.string().max(120),
  status: z.enum(['aceptado', 'rechazado']).nullable(),
});

export const SetRuleEnabledSchema = z.object({
  projectId: z.string().uuid(),
  ruleId: z.string().regex(/^[A-Z]{3}-\d{2}$/),
  enabled: z.boolean(),
});

export const DomainTermSchema = z.object({
  projectId: z.string().uuid(),
  term: z.string().trim().min(1).max(60),
});
