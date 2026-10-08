import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../src/main';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';

async function run() {
  const ids: string[] = [];
  const projects: string[] = [];
  const email = `audit-${randomUUID()}@example.invalid`;
  const password = `Audit9-${randomUUID()}`;
  const agent = request.agent(app);
  let checks = 0;
  function check(value: unknown, label: string) { assert.ok(value, label); checks++; console.log(`OK ${checks}: ${label}`); }
  try {
    check((await agent.get('/api/v1/health/db')).status === 200, 'PostgreSQL conectado');
    const registration = await agent.post('/api/v1/auth/register').send({ email, password, fullName: 'Verificación temporal', role: 'ADMIN' });
    check(registration.status === 201, 'Registro real'); ids.push(registration.body.data.user.id);
    check(registration.body.data.user.role === 'QA_TESTER', 'El registro no permite escalar privilegios');
    const config = await agent.get('/api/v1/config/ai-providers');
    check(config.body.data.providers.length === 2 && config.body.data.providers.every((p: { supportedModels: Array<{id: string}> }) => p.supportedModels[0].id), 'Ambos proveedores exponen sus modelos reales configurados');
    const userId = ids[0];
    const originalToken = registration.body.data.token;
    for (const role of ['ADMIN', 'QA_LEAD', 'QA_TESTER']) {
      await prisma.user.update({ where: { id: userId }, data: { role } });
      for (const wrong of ['admin', 'admin123', 'Admin123*TestGenAI', 'qalead123', 'QALead123*TestGenAI', 'tester123', 'Tester123*TestGenAI']) {
        check((await agent.post('/api/v1/auth/login').send({ email, password: wrong })).status === 401, `Sin contraseña universal (${role}, ${wrong})`);
      }
    }
    check((await agent.get('/api/v1/auth/me')).body.data.id === userId, 'Perfil recuperable mediante cookie');
    const expired = await agent.post('/api/v1/auth/refresh').send({});
    check(expired.status === 200, 'Renovación de sesión');
    const login = await agent.post('/api/v1/auth/login').send({ email, password });
    check(login.status === 200, 'Contraseña real aceptada');
    const proj = await agent.post('/api/v1/projects').send({ name: 'Auditoría temporal' });
    check(proj.status === 201, 'Crear proyecto'); const projectId = proj.body.data.id; projects.push(projectId);
    const req = await agent.post('/api/v1/requirements').send({ projectId, title: 'Acceso autorizado', description: 'Una cuenta válida accede al sistema.', acceptanceCriteria: 'Una contraseña incorrecta se rechaza con HTTP 401.' });
    check(req.status === 201, 'Crear requisito con versión inicial'); const requirementId = req.body.data.id;
    const manual = { requirementId, type: 'negative', title: 'Rechazar contraseña incorrecta', preconditions: ['Cuenta existente'], steps: ['Ingresar contraseña incorrecta'], expectedResult: 'Se rechaza con HTTP 401', priority: 'high' };
    const concurrent = await Promise.all(Array.from({ length: 5 }, () => agent.post('/api/v1/test-cases/manual').send(manual)));
    check(concurrent.every(r => r.status === 201) && new Set(concurrent.map(r => r.body.data.code)).size === 5, 'Cinco creaciones simultáneas sin colisión de códigos');
    const tc = concurrent[0].body.data;
    check((await agent.post('/api/v1/test-runs').send({ projectId, name: 'Ciclo temporal', caseIds: [tc.id] })).status === 400, 'No ejecutar casos pendientes');
    check((await agent.post('/api/v1/ai/generate').send({ requirementId, provider: 'mock' })).status === 400, 'Proveedor simulado rechazado');
    if (!env.GEMINI_API_KEY) {
      const noKey = await agent.post('/api/v1/ai/generate').send({ requirementId, provider: 'gemini' });
      check(noKey.status === 502, 'IA sin credenciales devuelve error explícito');
      check(await prisma.testCase.count({ where: { requirementId } }) === 5 && await prisma.aiGeneration.count({ where: { requirementId, status: 'FAILED' } }) === 1, 'Fallo IA auditado sin generar casos ficticios');
    }
    check((await agent.patch('/api/v1/test-cases/' + tc.id + '/review').send({ decision: 'REJECTED' })).status === 400, 'Rechazo exige motivo');
    const approval = await agent.patch(`/api/v1/test-cases/${tc.id}/review`).send({ decision: 'APPROVED', expectedVersion: 1, comments: 'Validado en auditoría temporal' });
    check(approval.status === 200, 'Aprobar con historial');
    check((await agent.patch(`/api/v1/test-cases/${tc.id}/review`).send({ decision: 'APPROVED', expectedVersion: 1 })).status === 409, 'Revisión con versión vieja rechazada');
    const cycle = await agent.post('/api/v1/test-runs').send({ projectId, name: 'Ciclo temporal', caseIds: [tc.id] });
    check(cycle.status === 201 && cycle.body.data.cases.length === 1, 'Ciclo contiene solo los casos seleccionados aprobados'); const runId = cycle.body.data.id;
    check((await agent.patch(`/api/v1/test-runs/${runId}/cases/${tc.id}`).send({ status: 'PASSED', durationSeconds: 1.5 })).status === 400, 'Duración fraccionaria rechazada antes de persistir');
    check((await agent.patch(`/api/v1/test-runs/${runId}/cases/${tc.id}`).send({ status: 'PASSED', durationSeconds: 4 })).status === 200, 'Registrar ejecución real');
    check((await agent.get(`/api/v1/test-runs/${runId}`)).body.data.status === 'COMPLETED', 'Ciclo completo persistido');
    check((await agent.post(`/api/v1/test-runs/${runId}/cases/${tc.id}/defect`).send({ defectNotes: 'Fallo temporal' })).status === 400, 'No registrar defecto en caso exitoso');
    const stranger = request.agent(app);
    const reg2 = await stranger.post('/api/v1/auth/register').send({ email: `audit-${randomUUID()}@example.invalid`, password, fullName: 'Segunda cuenta temporal' });
    ids.push(reg2.body.data.user.id);
    check((await stranger.get(`/api/v1/projects/${projectId}`)).status === 404, 'Aislamiento entre propietarios');
    check((await stranger.get(`/api/v1/test-runs/compare?runA=${runId}&runB=${runId}`)).status === 404, 'Comparador no expone ejecuciones ajenas');
    const metrics = await agent.get(`/api/v1/metrics/project/${projectId}`);
    check(metrics.status === 200 && metrics.body.data.summary.approvedCases === 1, 'Métricas derivadas de registros persistidos');
    check((await agent.get(`/api/v1/traceability/${projectId}`)).body.data.coveragePercent === 100, 'Cobertura real de requisito aprobado');
    for (const format of ['csv', 'json', 'markdown', 'gherkin', 'xray', 'testrail', 'testplan', 'report-html']) {
      const output = await agent.get(`/api/v1/export/${projectId}?format=${format}`);
      check(output.status === 200 && Boolean(output.headers['x-suite-sha256']), `Exportación ${format}`);
    }
    const update = await agent.put(`/api/v1/requirements/${requirementId}`).send({ description: 'Descripción actualizada con nuevas condiciones de acceso.', expectedVersion: 1 });
    check(update.status === 200, 'Editar requisito');
    check((await prisma.testCase.findUniqueOrThrow({ where: { id: tc.id } })).isObsolete, 'Edición invalida casos anteriores');
    check((await agent.get(`/api/v1/export/${projectId}?format=json`)).status === 400, 'Exportación excluye casos obsoletos');
    check((await agent.patch(`/api/v1/projects/${projectId}/archive`).send({})).status === 200, 'Archivo lógico conserva proyecto');
    const project2 = await agent.post('/api/v1/projects').send({ name: 'Importación temporal' });
    const importId = project2.body.data.id; projects.push(importId);
    const batch = await agent.post('/api/v1/requirements/import').send({ projectId: importId, requirements: [
      { code: 'REQ-001', title: 'Código explícito', description: 'Descripción importada real', acceptanceCriteria: 'Criterio importado real' },
      { title: 'Código automático', description: 'Descripción importada real', acceptanceCriteria: 'Criterio importado real' },
    ] });
    check(batch.status === 201 && batch.body.data[1].code === 'REQ-002', 'Importación admite códigos opcionales sin colisión con explícitos');
    const manualReq = await agent.post('/api/v1/requirements').send({ projectId: importId, title: 'Siguiente requisito', description: 'Descripción posterior real', acceptanceCriteria: 'Criterio posterior real' });
    check(manualReq.status === 201 && manualReq.body.data.code === 'REQ-003', 'Contador coherente después de importar');
    const openapi = await agent.post('/api/v1/projects/' + importId + '/import-openapi').send({ spec: { openapi: '3.0.0', paths: { '/public': { get: { responses: { '204': { description: 'Sin contenido' } } } } } } });
    check(openapi.status === 201, 'Importación OpenAPI transaccional');
    const contractCases = await prisma.testCase.findMany({ where: { requirementId: openapi.body.data.requirements[0].id } });
    check(contractCases.length === 1 && contractCases[0].source === 'OPENAPI' && contractCases[0].expectedResult === 'HTTP 204: Sin contenido', 'Contrato sin respuestas o autenticación inventadas');
    const editCase = await agent.post('/api/v1/test-cases/manual').send({ ...manual, requirementId: manualReq.body.data.id });
    const edited = await agent.patch('/api/v1/test-cases/' + editCase.body.data.id + '/review').send({ decision: 'MODIFIED', title: 'Título realmente modificado', expectedVersion: 1 });
    check(edited.status === 200 && edited.body.data.testCase.title === 'Título realmente modificado', 'Cambios de contenido efectivamente persistidos');
    const dbStats = await agent.get('/api/v1/config/database');
    check(dbStats.status === 200 && dbStats.body.data.counts.projects === 2, 'Configuración muestra conteos reales del propietario');
    if (await prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { notIn: ids } } }) === 0) {
      await prisma.user.updateMany({ where: { id: { in: ids } }, data: { role: 'ADMIN' } });
      const demotions = await Promise.all([
        agent.patch('/api/v1/users/' + userId).send({ role: 'QA_TESTER' }),
        stranger.patch('/api/v1/users/' + ids[1]).send({ role: 'QA_TESTER' }),
      ]);
      check(demotions.filter(r => r.status === 200).length === 1 && demotions.filter(r => r.status === 403).length === 1, 'Cambios concurrentes conservan un administrador activo');
    }
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    check((await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${originalToken}`)).status === 401, 'Token de usuario desactivado rechazado');
    console.log(`Verificación completada: ${checks} comprobaciones. IA externa: no invocada, requiere credenciales y validación independiente.`);
  } finally {
    await prisma.project.deleteMany({ where: { id: { in: projects } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
    console.log('Datos temporales eliminados.');
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
