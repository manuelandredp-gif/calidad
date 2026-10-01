import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de Carga y Rendimiento (Mejora #40)
export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp-up inicial
    { duration: '30s', target: 50 },  // Carga sostenida
    { duration: '15s', target: 100 }, // Pico de estrés
    { duration: '15s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% de las peticiones deben responder en menos de 500ms
    http_req_duration: ['p(95)<500'],
    // La tasa de errores de red o HTTP debe ser menor al 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Healthcheck del servicio
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status es 200': (r) => r.status === 200,
    'servicio reporta online': (r) => r.json().status === 'online',
  });

  // 2. Healthcheck del proveedor de IA
  const aiHealthRes = http.get(`${BASE_URL}/api/health/ai`);
  check(aiHealthRes, {
    'ai health status es 200': (r) => r.status === 200,
  });

  sleep(1);
}
