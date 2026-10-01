# TestGenAI: Generador Inteligente de Casos de Prueba Funcionales

**Tipo de proyecto:** Aplicación web de apoyo al aseguramiento de calidad de software  
**Área:** Ingeniería de Software / Calidad de Software / Inteligencia Artificial Generativa  
**Fecha:** 25 de agosto de 2026

---

# Parte 1 — Propuesta lista para presentar

## 1. Título

**TestGenAI: Generador Inteligente de Casos de Prueba Funcionales a partir de Requisitos de Software**

**Título académico alternativo:**  
**Sistema inteligente para la generación, validación y trazabilidad de casos de prueba funcionales a partir de requisitos de software mediante inteligencia artificial generativa**

## 2. Descripción breve

TestGenAI es una aplicación web orientada al aseguramiento de calidad de software que utiliza inteligencia artificial generativa para analizar requisitos funcionales, historias de usuario y criterios de aceptación, y proponer automáticamente casos de prueba positivos, negativos, alternativos y de valores límite. La plataforma no busca reemplazar al profesional QA, sino asistirlo en la elaboración inicial de pruebas, mantener trazabilidad entre requisitos y casos generados, detectar posibles omisiones o ambigüedades y permitir que cada caso sea revisado, editado, aprobado o rechazado antes de incorporarse al conjunto oficial de pruebas del proyecto.

## 3. Problema detallado

### 3.1 Contexto del problema

El diseño de casos de prueba es una actividad fundamental del aseguramiento de calidad de software. Antes de ejecutar una prueba es necesario comprender qué debe hacer el sistema, identificar condiciones que deben verificarse, preparar datos, definir resultados esperados y analizar escenarios normales, negativos, alternativos y de frontera.

ISTQB dedica una parte importante del proceso de testing al análisis y diseño de pruebas, y reconoce que requisitos, historias de usuario, criterios de aceptación, casos de uso y otros productos de trabajo deben ser suficientemente claros, completos, consistentes y verificables para poder ser probados adecuadamente. También destaca el valor de detectar defectos en requisitos lo antes posible.

Fuentes:
- https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/
- https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf

En un proceso manual, un tester debe leer cada requisito y convertirlo en escenarios verificables. Esta tarea exige interpretación, conocimiento del dominio y experiencia en técnicas de diseño de pruebas. Cuando el número de requisitos aumenta, también aumenta el esfuerzo necesario para redactar pruebas, evitar duplicados, mantener trazabilidad y comprobar cobertura.

La investigación reciente muestra que la generación de escenarios desde requisitos mediante modelos de lenguaje es técnicamente posible, pero también evidencia limitaciones que obligan a incorporar control humano. Arora, Herda y Homm estudiaron generación de escenarios con LLM en proyectos industriales y encontraron resultados prometedores, aunque observaron limitaciones en secuencias exactas y matices del dominio:
- https://arxiv.org/abs/2404.12772

Bhatia, Gandhi, Kumar y Jalote evaluaron generación de diseños de prueba desde documentos de requisitos. En su estudio, aproximadamente el 87 % de los casos generados fueron considerados válidos; el resto fue no aplicable o redundante. Además, algunos casos válidos generados no habían sido considerados inicialmente por los desarrolladores:
- https://arxiv.org/abs/2412.03693

Sami et al. propusieron una herramienta web basada en LLM para automatizar la creación de escenarios de prueba a partir de requisitos:
- https://arxiv.org/abs/2406.07021

Alagarsamy et al. estudiaron generación de casos desde texto y evaluaron corrección sintáctica, alineación con requisitos y cobertura, mostrando que la calidad debe medirse y no asumirse:
- https://arxiv.org/abs/2402.11910

### 3.2 Situación problemática

En proyectos donde los casos se elaboran manualmente pueden presentarse:

1. Alto tiempo de preparación al crecer el número de requisitos.
2. Omisión involuntaria de escenarios negativos o alternativos.
3. Poca consideración de valores límite.
4. Duplicación de casos redactados de manera diferente.
5. Dificultad para mantener trazabilidad requisito–caso.
6. Diferencias de detalle entre testers.
7. Requisitos ambiguos trasladados a pruebas poco precisas.
8. Actualización manual cuando cambia un requisito.
9. Trabajo repetitivo de redacción y estructuración.
10. Dificultad para medir cobertura desde los requisitos.

Usar un chatbot de manera directa tampoco resuelve por completo el problema, porque puede introducir:
- condiciones inexistentes;
- supuestos no confirmados;
- casos redundantes;
- respuestas inconsistentes;
- ausencia de trazabilidad;
- falta de auditoría;
- dificultad para medir validez y costo.

Por ello, se propone una plataforma que combine IA con reglas de validación, almacenamiento estructurado, trazabilidad y revisión humana.

### 3.3 Problema general

**¿En qué medida una aplicación basada en inteligencia artificial generativa puede reducir el tiempo requerido para diseñar casos de prueba funcionales y mantener una adecuada calidad, cobertura y trazabilidad respecto de los requisitos de software?**

### 3.4 Problemas específicos

1. ¿Cuánto tiempo se reduce al elaborar casos con TestGenAI frente al proceso manual?
2. ¿Qué porcentaje de casos generados puede aprobar un evaluador sin modificaciones sustanciales?
3. ¿Qué tipos de escenarios puede identificar correctamente el sistema?
4. ¿Qué porcentaje introduce supuestos no respaldados por los requisitos?
5. ¿Puede mantener trazabilidad completa entre requisitos y casos?
6. ¿Qué modelo de IA ofrece mejor relación entre calidad, costo y latencia?


## 4. Justificación

### 4.1 Tecnológica
Los modelos de lenguaje actuales permiten interpretar lenguaje natural y producir salidas estructuradas. No es necesario entrenar un modelo propio. La IA puede utilizarse solo para las tareas semánticas, mientras el sistema convencional administra usuarios, proyectos, persistencia, trazabilidad, métricas, exportaciones y reglas.

### 4.2 Académica
El proyecto integra ingeniería de requisitos, pruebas de software, aseguramiento de calidad, diseño de sistemas, bases de datos, desarrollo web, APIs, IA generativa, métricas y evaluación experimental.

### 4.3 Práctica
El tester puede reducir trabajo repetitivo de redacción y concentrarse en revisar escenarios, riesgos y reglas de negocio.

### 4.4 Económica
No se necesita GPU propia. El principal costo variable es la API de IA. En agosto de 2026, Google publica para Gemini 2.5 Flash-Lite USD 0.10 por millón de tokens de entrada y USD 0.40 por millón de salida. OpenAI publica para GPT-5 nano USD 0.05 por millón de entrada y USD 0.40 por millón de salida.

Fuentes:
- https://ai.google.dev/gemini-api/docs/pricing
- https://developers.openai.com/api/docs/models/gpt-5-nano

## 5. Objetivos de investigación y solución

### 5.1 Objetivo general de investigación
**Evaluar el impacto del uso de TestGenAI en la eficiencia y calidad del diseño de casos de prueba funcionales a partir de requisitos de software, comparando el proceso asistido por IA con un proceso manual.**

### 5.2 Objetivos específicos de investigación
1. Medir el tiempo promedio de elaboración manual y asistida.
2. Calcular el porcentaje de casos aprobados, modificados y rechazados.
3. Medir cobertura de requisitos.
4. Medir la tasa de casos con supuestos no respaldados.
5. Medir duplicidad.
6. Comparar al menos dos modelos según calidad, costo y latencia.
7. Medir costo de IA por requisito y por proyecto.

### 5.3 Objetivo general de la solución
**Desarrollar una aplicación web que utilice inteligencia artificial generativa para generar, organizar, validar y mantener trazabilidad de casos de prueba funcionales derivados de requisitos de software.**

### 5.4 Objetivos específicos de la solución
1. Registrar proyectos y requisitos.
2. Integrar un LLM mediante API.
3. Generar pruebas positivas, negativas, alternativas y de límite.
4. Obtener salida estructurada.
5. Mantener trazabilidad requisito–caso.
6. Permitir aprobación, edición, rechazo y regeneración.
7. Identificar supuestos no confirmados.
8. Registrar tokens, latencia y costo.
9. Mostrar indicadores de cobertura.
10. Exportar resultados.
11. Mantener historial.
12. Evaluar la solución experimentalmente.

## 6. Metas medibles del MVP

| Indicador | Meta propuesta |
|---|---:|
| Requisitos procesados correctamente | ≥ 95 % |
| Trazabilidad requisito-caso | 100 % |
| Casos con estructura válida | ≥ 95 % |
| Casos disponibles para revisión humana | 100 % |
| Llamadas IA con tokens/costo registrados | 100 % |
| Tiempo promedio objetivo | < 15 s por requisito |
| Reducción de tiempo frente a manual | objetivo ≥ 30 % |
| Casos aprobados o con ajustes menores | objetivo ≥ 80 % |
| Casos sin respaldo explícito | objetivo < 15 % |

Estas cifras son metas de evaluación, no resultados garantizados.


# Diseño funcional del proyecto

## 7. Alcance del MVP

Incluye:
- autenticación;
- proyectos;
- requisitos;
- importación básica de texto/CSV;
- generación con IA;
- clasificación de casos;
- edición, aprobación, rechazo y regeneración;
- trazabilidad;
- detección básica de duplicados;
- clasificación de evidencia;
- dashboard;
- registro de tokens y costo;
- exportación;
- historial.

No incluye inicialmente:
- entrenamiento de un LLM propio;
- Selenium/Playwright;
- pruebas móviles;
- pruebas de rendimiento o seguridad;
- integración completa con Jira/GitHub;
- análisis completo de repositorios;
- agentes autónomos;
- RAG empresarial complejo;
- fine-tuning.

## 8. Usuarios

### Tester / QA
Registra requisitos, genera, revisa y aprueba casos.

### Desarrollador
Consulta pruebas asociadas a funcionalidades.

### QA Lead / líder
Consulta cobertura, estados e indicadores.

### Administrador
Gestiona usuarios, proveedores, límites y configuración.

## 9. Flujo principal

```text
Usuario
  |
  v
Crea proyecto
  |
  v
Registra requisito
  |
  v
IA analiza
  |
  v
Genera casos estructurados
  |
  v
Motor de validación
  |-- duplicados
  |-- campos incompletos
  |-- supuestos
  |-- clasificación
  v
QA revisa
  |-- Aprobar
  |-- Editar
  |-- Rechazar
  |-- Regenerar
  v
Trazabilidad
  |
  v
Dashboard / reporte / exportación
```

## 10. Tipos de casos
- **Positivo:** flujo válido.
- **Negativo:** datos o condiciones inválidas.
- **Alternativo:** ruta distinta al flujo principal.
- **Valor límite:** extremos de rangos.
- **Validación:** obligatoriedad, formato, longitud y restricciones.

## 11. Ejemplo

Requisito:

> Como usuario registrado, quiero iniciar sesión utilizando mi correo electrónico y contraseña para acceder a mi cuenta.

| ID | Tipo | Escenario | Resultado esperado | Evidencia |
|---|---|---|---|---|
| CP-001 | Positivo | Credenciales válidas | Acceso permitido | Derivado |
| CP-002 | Negativo | Contraseña incorrecta | Acceso rechazado | Derivado |
| CP-003 | Negativo | Correo no registrado | Acceso rechazado | Sugerido |
| CP-004 | Validación | Correo vacío | Validación del campo | Derivado |
| CP-005 | Validación | Contraseña vacía | Validación del campo | Derivado |
| CP-006 | Límite | Longitud mínima | Aplicar regla definida | Pendiente si la regla no existe |

## 12. Control de alucinaciones

Estados:
- **Derivado:** respaldado explícitamente.
- **Sugerido:** razonable, requiere confirmación.
- **Ambiguo:** falta información.
- **Conflicto:** contradice una regla.
- **Pendiente:** necesita revisión.

Controles:
1. enviar siempre el requisito original;
2. pedir evidencia textual;
3. no aprobar automáticamente;
4. usar JSON estructurado;
5. validar esquema;
6. registrar modelo y versión del prompt;
7. revisión humana;
8. limitar variabilidad cuando proceda;
9. no enviar contexto irrelevante;
10. conservar rechazos para análisis.

## 13. Salida estructurada

```json
{
  "requirement_id": "REQ-001",
  "requirement_quality": {
    "status": "clear",
    "ambiguities": []
  },
  "test_cases": [
    {
      "type": "positive",
      "title": "Inicio de sesión con credenciales válidas",
      "preconditions": ["El usuario está registrado"],
      "steps": [
        "Ingresar correo registrado",
        "Ingresar contraseña válida",
        "Seleccionar iniciar sesión"
      ],
      "expected_result": "El usuario accede a su cuenta",
      "priority": "high",
      "evidence_status": "derived",
      "evidence": "usuario registrado... correo electrónico y contraseña"
    }
  ]
}
```


# Arquitectura y tecnología

## 14. Arquitectura

```text
+------------------+
|     Usuario      |
+--------+---------+
         |
         v
+------------------+
| React / Next.js  |
+--------+---------+
         |
         v
+------------------+
| Backend / API    |
| NestJS           |
+----+---------+---+
     |         |
     v         v
PostgreSQL   AI Provider Adapter
               |
          +----+----+
          |         |
          v         v
      Gemini      OpenAI
          |
          v
    JSON estructurado
          |
          v
 Motor de validación
          |
          v
 Revisión + trazabilidad
```

## 15. Tecnologías sugeridas

Frontend:
- React
- Next.js
- TypeScript
- Material UI o Tailwind

Backend:
- Node.js
- NestJS
- TypeScript

Alternativa backend:
- FastAPI + Python

Base de datos:
- PostgreSQL

Infraestructura:
- Docker
- Docker Compose
- GitHub
- VPS pequeño
- GitHub Actions opcional

## 16. Modelo de datos preliminar

### users
id, name, email, password_hash, role, created_at

### projects
id, name, description, owner_id, created_at, updated_at

### requirements
id, project_id, code, title, description, acceptance_criteria, version, status, created_at, updated_at

### test_cases
id, requirement_id, code, type, title, preconditions, steps, test_data, expected_result, priority, evidence_status, evidence_text, status, created_at, updated_at

### ai_generations
id, requirement_id, provider, model, prompt_version, input_tokens, output_tokens, estimated_cost, response_time_ms, created_at

### test_case_reviews
id, test_case_id, reviewer_id, decision, comments, previous_content, new_content, created_at


# Requisitos

## 17. Requisitos funcionales

- **RF-01:** autenticación.
- **RF-02:** crear, editar, consultar y archivar proyectos.
- **RF-03:** registrar y modificar requisitos.
- **RF-04:** generar casos con IA.
- **RF-05:** clasificar casos.
- **RF-06:** aprobar, editar y rechazar.
- **RF-07:** mantener trazabilidad.
- **RF-08:** regenerar conservando historial.
- **RF-09:** mostrar métricas.
- **RF-10:** registrar tokens, modelo y costo.
- **RF-11:** exportar casos aprobados.
- **RF-12:** conservar historial de revisiones.
- **RF-13:** detectar ambigüedad.
- **RF-14:** advertir duplicados potenciales.

## 18. Requisitos no funcionales

- **RNF-01 Rendimiento:** meta < 15 s por generación normal.
- **RNF-02 Seguridad:** API keys solo en backend.
- **RNF-03 Privacidad:** política clara de datos.
- **RNF-04 Disponibilidad:** manejar fallos del proveedor.
- **RNF-05 Auditabilidad:** registrar modelo, prompt y usuario.
- **RNF-06 Usabilidad:** no exigir prompt engineering al tester.
- **RNF-07 Portabilidad:** despliegue con Docker.
- **RNF-08 Mantenibilidad:** proveedor IA desacoplado.

## 19. Reglas de negocio

1. Ningún caso generado se considera aprobado sin revisión humana.
2. Todo caso aprobado se relaciona con al menos un requisito.
3. Un caso en conflicto requiere justificación para aprobarse.
4. Se conserva el contenido original generado.
5. Cada regeneración crea una nueva ejecución.
6. El costo es una estimación basada en tarifas configuradas.
7. Si cambia un requisito, sus casos pueden marcarse para revisión.
8. La IA no debe convertir supuestos en hechos.
9. Se deben evitar datos sensibles en prompts.
10. El QA mantiene la decisión final.


# IA, tokens y costos

## 20. Modelos recomendados

### Gemini 2.5 Flash-Lite
Precio oficial consultado en agosto de 2026:
- entrada: USD 0.10 / 1M tokens;
- salida: USD 0.40 / 1M tokens.

Fuente:
https://ai.google.dev/gemini-api/docs/pricing

### GPT-5 nano
Precio oficial consultado en agosto de 2026:
- entrada: USD 0.05 / 1M tokens;
- salida: USD 0.40 / 1M tokens.

Fuente:
https://developers.openai.com/api/docs/models/gpt-5-nano

### Recomendación
Implementar un adaptador para comparar al menos ambos modelos. La elección final debe basarse en:
- aprobación;
- alucinaciones;
- cobertura;
- latencia;
- consistencia;
- costo.

## 21. Simulación de costo

Suposición:
- 3,000 tokens de entrada;
- 2,000 tokens de salida.

### Gemini 2.5 Flash-Lite
Entrada: 3,000 / 1,000,000 × 0.10 = USD 0.00030  
Salida: 2,000 / 1,000,000 × 0.40 = USD 0.00080  
**Total: USD 0.00110 por generación**

### GPT-5 nano
Entrada: 3,000 / 1,000,000 × 0.05 = USD 0.00015  
Salida: 2,000 / 1,000,000 × 0.40 = USD 0.00080  
**Total: USD 0.00095 por generación**

| Generaciones | Gemini Flash-Lite | GPT-5 nano |
|---:|---:|---:|
| 100 | USD 0.11 | USD 0.095 |
| 1,000 | USD 1.10 | USD 0.95 |
| 10,000 | USD 11.00 | USD 9.50 |

Son estimaciones; los valores reales dependerán del tamaño de prompts, respuestas, reintentos y cambios de tarifas.

## 22. Estrategia de reducción de tokens

1. Enviar solo el requisito analizado.
2. No reenviar todo el proyecto.
3. Mantener un prompt base compacto.
4. Generar varios casos en una llamada.
5. Generar IDs y estadísticas con código.
6. Limitar número máximo de casos.
7. No usar IA para cálculos deterministas.
8. Evitar explicaciones extensas innecesarias.
9. Registrar tokens.
10. Evitar regeneraciones automáticas infinitas.
11. Configurar límites de consumo.

## 23. Prompt base

```text
Actúa como analista de pruebas funcionales.
Analiza únicamente la información disponible en el requisito.
Genera casos positivos, negativos, alternativos y de límite cuando sean justificables.
No conviertas supuestos en reglas confirmadas.
Cuando una condición no esté explícitamente definida, márcala como "sugerida".
Devuelve exclusivamente la estructura JSON solicitada.
```

El prompt debe versionarse para poder comparar resultados.


# Evaluación científica

## 24. Métricas

**Tasa de aprobación**
```text
casos aprobados / casos generados × 100
```

**Tasa de modificación**
```text
casos modificados / casos generados × 100
```

**Tasa de rechazo**
```text
casos rechazados / casos generados × 100
```

**Cobertura**
```text
requisitos con al menos un caso aprobado / total de requisitos × 100
```

**Tasa de casos sin respaldo**
```text
casos con supuestos no respaldados / casos generados × 100
```

**Duplicidad**
```text
casos duplicados / casos generados × 100
```

**Reducción de tiempo**
```text
(tiempo manual - tiempo con TestGenAI) / tiempo manual × 100
```

**Costo por requisito**
```text
costo total IA / requisitos procesados
```

## 25. Metodología experimental

Muestra recomendada: **30 a 50 requisitos funcionales**.

### Fase A — Línea base manual
Registrar tiempo, cantidad de casos, tipos y cobertura.

### Fase B — TestGenAI
Procesar los mismos requisitos y registrar generación, revisión, tokens y costo.

### Fase C — Revisión independiente
Clasificar cada caso como:
- válido;
- válido con cambio menor;
- válido con cambio mayor;
- inválido;
- duplicado;
- no respaldado.

### Fase D — Comparación
Comparar tiempo, cobertura, calidad, costo y casos útiles adicionales.

## 26. Instrumento sugerido

| Criterio | Escala |
|---|---|
| Relevancia | 1–5 |
| Correspondencia con requisito | 1–5 |
| Claridad | 1–5 |
| Ejecutabilidad | 1–5 |
| Resultado esperado correcto | 1–5 |
| Duplicidad | Sí/No |
| Introduce supuesto | Sí/No |
| Decisión | Aprobar/Modificar/Rechazar |

## 27. Hipótesis opcional

**H1:** El uso de TestGenAI reducirá el tiempo promedio de elaboración de casos de prueba funcionales respecto al proceso manual, manteniendo un nivel aceptable de validez y trazabilidad.

**H0:** TestGenAI no producirá una reducción significativa del tiempo o generará una calidad insuficiente para justificar su uso.


# Factibilidad y riesgos

## 28. Factibilidad técnica
**Alta.** Puede desarrollarse con tecnologías web comunes y APIs existentes. No necesita GPU, entrenamiento propio ni arquitectura distribuida.

## 29. Factibilidad económica
**Alta.** El costo de IA es bajo para un MVP y puede controlarse mediante límites de tokens y proveedor intercambiable.

## 30. Factibilidad operativa
**Alta.** El flujo de uso es simple: requisito → generar → revisar → aprobar → exportar.

## 31. Factibilidad académica
**Muy alta.** Permite demostrar requisitos, arquitectura, desarrollo, testing, IA y evaluación cuantitativa.

## 32. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| IA inventa reglas | Alta | Alta | evidencia + revisión humana |
| Casos redundantes | Media | Media | detector de duplicados |
| Cambio de precios | Media | Baja | proveedor intercambiable |
| Caída de API | Media | Media | errores y reintentos limitados |
| JSON inválido | Media | Media | salida estructurada + validación |
| Requisitos ambiguos | Alta | Media | advertencia y aclaración |
| API key expuesta | Baja | Alta | backend y secretos |
| Datos confidenciales | Media | Alta | anonimización/política |
| Alcance excesivo | Alta | Alta | limitar MVP |
| Modelo barato de baja calidad | Media | Media | benchmark |

## 33. Diferenciación

TestGenAI no debe presentarse como "un chatbot que hace casos". Debe presentarse como una plataforma con:
1. trazabilidad;
2. control de evidencia;
3. revisión humana;
4. historial;
5. comparación de modelos;
6. métricas;
7. tokens/costo;
8. detección de ambigüedad;
9. versionado del prompt;
10. evaluación experimental.


# Desarrollo y entregables

## 34. Plan de trabajo de 8 semanas

**Semana 1:** problema, bibliografía, alcance, objetivos.  
**Semana 2:** requisitos, prototipos, BD y arquitectura.  
**Semana 3:** autenticación, proyectos y requisitos.  
**Semana 4:** IA, prompt, salida estructurada.  
**Semana 5:** revisión, trazabilidad, duplicados.  
**Semana 6:** dashboard, métricas, costo y exportación.  
**Semana 7:** pruebas y experimento.  
**Semana 8:** resultados, correcciones y presentación.

## 35. Backlog

### Crítico
- autenticación;
- proyectos;
- requisitos;
- IA;
- casos;
- revisión;
- trazabilidad.

### Alto
- métricas;
- tokens/costo;
- historial;
- exportación.

### Medio
- duplicados semánticos;
- comparación de modelos;
- importación CSV.

### Futuro
- Jira;
- GitHub;
- Playwright;
- Selenium;
- RAG;
- CI/CD.

## 36. Pantallas sugeridas
1. Login.
2. Dashboard.
3. Proyectos.
4. Detalle de proyecto.
5. Requisitos.
6. Editor.
7. Generación.
8. Comparación requisito/casos.
9. Revisión.
10. Matriz de trazabilidad.
11. Métricas.
12. Historial IA.
13. Configuración.
14. Exportación.

## 37. Seguridad y privacidad
- API keys solo en servidor.
- contraseñas hasheadas.
- roles y sesiones.
- anonimización de requisitos sensibles.
- evitar secretos y credenciales en prompts.
- informar que la IA puede equivocarse.
- no aprobar automáticamente.

## 38. Estrategia de testing del propio sistema
- pruebas unitarias de validadores y métricas;
- integración con PostgreSQL;
- integración con proveedor IA;
- pruebas funcionales del flujo principal;
- errores de API key, timeout, JSON inválido y requisito vacío.

## 39. Criterios de aceptación básicos
- dado un requisito válido, generar salida estructurada o informar error;
- cada caso contiene tipo, título, pasos y resultado esperado;
- cada caso conserva requisito origen;
- el usuario puede aprobar, modificar o rechazar;
- cada llamada registra modelo, tokens y costo.

## 40. Entregables
1. Propuesta.
2. Informe de factibilidad.
3. Visión.
4. Requisitos.
5. Arquitectura.
6. Código.
7. Base de datos.
8. MVP.
9. Documentación API.
10. Dataset de evaluación.
11. Resultados.
12. Informe de tokens/costo.
13. Manual de usuario.
14. Presentación.
15. Repositorio Git.


# Defensa del proyecto

## 41. Preguntas difíciles y respuestas

### ¿La IA reemplaza al tester?
No. Genera una primera propuesta; el tester decide.

### ¿Qué pasa si inventa información?
Se clasifica la evidencia, se conserva el requisito original y se exige revisión.

### ¿Por qué no usar directamente ChatGPT o Gemini?
Porque un chatbot por sí solo no administra trazabilidad, historial, métricas, costos, cobertura, aprobaciones ni proyectos.

### ¿Por qué usar IA y no reglas?
Las reglas funcionan para tareas deterministas; comprender requisitos en lenguaje natural requiere interpretación semántica. El sistema usa ambos enfoques.

### ¿Es caro?
Para un MVP, no. El costo puede mantenerse muy bajo usando modelos económicos y control de tokens.

### ¿Hay que entrenar un modelo?
No.

### ¿Cómo se demuestra que funciona?
Comparando contra un proceso manual y midiendo tiempo, validez, cobertura, duplicidad, falta de respaldo y costo.

## 42. Limitaciones
1. Depende de la calidad del requisito.
2. Puede haber variabilidad entre ejecuciones.
3. Dominios especializados requieren más contexto.
4. No conoce reglas empresariales no suministradas.
5. Precios y disponibilidad dependen de terceros.
6. La evaluación humana tiene componente subjetivo.
7. Más casos no significa automáticamente más calidad.
8. Cobertura de requisitos no equivale a cobertura de código.

## 43. Evolución futura

```text
Requisito
   |
   v
Caso generado
   |
   v
Caso aprobado
   |
   v
Script Playwright/Cypress/API
   |
   v
Ejecución
   |
   v
PASS / FAIL
   |
   v
Evidencia
```

Posibles integraciones futuras:
- Jira;
- GitHub;
- Azure DevOps;
- TestRail;
- RAG con documentación;
- análisis de cambios de requisitos;
- automatización E2E.

## 44. Resumen para exposición

**TestGenAI es una aplicación web que utiliza inteligencia artificial generativa para convertir requisitos de software en propuestas estructuradas de casos de prueba. A diferencia de utilizar un chatbot directamente, el sistema mantiene trazabilidad, identifica supuestos, registra métricas y obliga a que un profesional QA revise las pruebas antes de aprobarlas. El proyecto busca determinar si este enfoque permite reducir el tiempo de diseño sin perder calidad y midiendo de forma objetiva validez, cobertura, costo y errores de la IA.**

## 45. Pitch de 30 segundos

**Convertir requisitos en casos de prueba requiere análisis manual y puede dejar escenarios sin considerar. TestGenAI utiliza IA como asistente del QA: recibe un requisito, genera escenarios positivos, negativos, alternativos y de límite, y los relaciona con su requisito de origen. El tester revisa los resultados y el sistema mide cobertura, rechazos, supuestos, tokens y costo. Así se puede evaluar objetivamente si la IA mejora el proceso de testing.**


# Fuentes y antecedentes

## 46. Fuentes técnicas y académicas

1. ISTQB — Certified Tester Foundation Level v4.0  
   https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/

2. ISTQB — CTFL Syllabus v4.0.1  
   https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf

3. Arora, C., Herda, T. y Homm, V. (2024). *Generating Test Scenarios from NL Requirements using Retrieval-Augmented LLMs: An Industrial Study*.  
   https://arxiv.org/abs/2404.12772

4. Bhatia, S., Gandhi, T., Kumar, D. y Jalote, P. (2024). *System Test Case Design from Requirements Specifications: Insights and Challenges of Using ChatGPT*.  
   https://arxiv.org/abs/2412.03693

5. Sami, A. M. et al. (2024). *A Tool for Test Case Scenarios Generation Using Large Language Models*.  
   https://arxiv.org/abs/2406.07021

6. Alagarsamy, S. et al. (2024). *Enhancing Large Language Models for Text-to-Testcase Generation*.  
   https://arxiv.org/abs/2402.11910

7. Google AI — Gemini API Pricing  
   https://ai.google.dev/gemini-api/docs/pricing

8. OpenAI Developers — GPT-5 nano  
   https://developers.openai.com/api/docs/models/gpt-5-nano

## 47. Fuentes sugeridas por el curso

9. UPT-FAING-EPIS  
   https://github.com/UPT-FAING-EPIS/

10. Repositorio de formatos UPT-FAING-EPIS localizado durante la revisión  
    https://github.com/UPT-FAING-EPIS/si885_2025-i-proyecto_si885_2025-i-u2-proyecto-formatos-01

11. GitHub Ranking — Top 100 Stars  
    https://github.com/EvanLi/Github-Ranking/blob/master/Top100/Top-100-stars.md

12. ProblemHunt  
    https://problemhunt.pro/

13. RENATI  
    https://renati.sunedu.gob.pe/

14. Radio Uno Tacna  
    https://radiouno.pe/

## 48. Fuentes adicionales para antecedentes

15. GitHub Topics — Software Testing  
    https://github.com/topics/software-testing

16. GitHub Topics — Quality Engineering  
    https://github.com/topics/quality-engineering

## 49. Uso recomendado de las fuentes sugeridas

- **UPT-FAING-EPIS:** revisar formatos y estructura documental de proyectos.
- **GitHub Ranking:** explorar tendencias y proyectos open source; no usar como evidencia científica principal.
- **ProblemHunt:** explorar problemas de producto.
- **RENATI:** localizar tesis peruanas relacionadas.
- **Radio Uno:** usar solo si se encuentra evidencia local de Tacna directamente vinculada al problema.

## 50. Conclusión de factibilidad

TestGenAI es un proyecto **técnicamente posible, económicamente viable y académicamente defendible**. No requiere entrenar un modelo propio ni utilizar GPU. La mayor dificultad está en controlar la calidad de las respuestas, impedir que los supuestos de la IA se conviertan en reglas falsas y diseñar una evaluación objetiva.

El MVP recomendado debe concentrarse en:

**requisito → generación → validación → revisión humana → trazabilidad → métricas → exportación**

El valor del proyecto no está simplemente en "usar IA", sino en **integrarla de forma controlada, auditable y medible dentro de un proceso real de aseguramiento de calidad de software**.

---

# 51. Qué presentar exactamente en la Parte 1

Según la estructura indicada para el curso, pueden extraerse directamente:

- **Título:** sección 1.
- **Problema detallado con fuentes:** sección 3.
- **Objetivos de investigación y solución medibles:** secciones 5 y 6.

El resto del documento queda como sustento técnico para factibilidad, visión, requerimientos, arquitectura, implementación y defensa ante preguntas del docente.
