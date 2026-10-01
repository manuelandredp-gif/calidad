// ==========================================================================
// AI Provider Registry & Factory - Open/Closed Principle Compliant
// Strategy Registry Pattern: Extensible at runtime without modifying code
// ==========================================================================

import { IAIProvider } from './interfaces/ai-provider.interface';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { MockAIAdapter } from './adapters/mock.adapter';
import { env } from '../config/env';

export type AIProviderFactoryFn = () => IAIProvider;

export class AIFactory {
  private static registry: Map<string, AIProviderFactoryFn> = new Map();
  private static instances: Map<string, IAIProvider> = new Map();

  // Inicialización de proveedores por defecto
  static {
    this.registerProvider('gemini', () => new GeminiAdapter());
    this.registerProvider('openai', () => new OpenAIAdapter());
    this.registerProvider('mock', () => new MockAIAdapter());
  }

  /**
   * Registra un nuevo proveedor sin necesidad de modificar el código interno (Cumple OCP).
   */
  public static registerProvider(name: string, factoryFn: AIProviderFactoryFn): void {
    const key = name.trim().toLowerCase();
    this.registry.set(key, factoryFn);
    // Invalidar instancia previa si se sobreescribe
    this.instances.delete(key);
  }

  /**
   * Obtiene la instancia del proveedor solicitado con caché de instancia.
   */
  public static getProvider(providerName?: string): IAIProvider {
    const selected = (providerName || env.AI_PROVIDER_DEFAULT || 'mock').trim().toLowerCase();

    if (this.instances.has(selected)) {
      return this.instances.get(selected)!;
    }

    const factoryFn = this.registry.get(selected) || this.registry.get('mock');
    if (!factoryFn) {
      throw new Error(`[AIFactory] Proveedor de IA '${selected}' no registrado.`);
    }

    const instance = factoryFn();
    this.instances.set(selected, instance);
    return instance;
  }

  public static hasProvider(name: string): boolean {
    return this.registry.has(name.trim().toLowerCase());
  }

  public static getAvailableProviders(): string[] {
    return Array.from(this.registry.keys());
  }
}
