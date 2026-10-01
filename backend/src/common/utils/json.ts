import { logger } from './logger';

/**
 * Parseo defensivo de un array serializado como JSON (p. ej. steps/preconditions
 * almacenados como texto en SQLite). Ante contenido corrupto no lanza: registra
 * la anomalía y devuelve un arreglo vacío para no romper la respuesta.
 */
export function safeJsonArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    logger.warn({ raw: raw.slice(0, 120) }, 'JSON malformado al deserializar; se devuelve []');
    return [];
  }
}

/** Parseo defensivo de un objeto JSON opcional. Devuelve null ante error. */
export function safeJsonObject(raw: string | null | undefined): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    logger.warn({ raw: raw.slice(0, 120) }, 'JSON malformado al deserializar objeto; se devuelve null');
    return null;
  }
}
