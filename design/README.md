# QualiReq — Diseño final

Exportado el 14-oct-2026 desde el lienzo de diseño de QualiReq.

## Contenido

| Carpeta / archivo | Qué es |
|---|---|
| `pantallas/Login.dc.html` | 1 · Inicio de sesión (correo y contraseña) |
| `pantallas/Inicio.dc.html` | 2 · Inicio y módulos (proyectos) |
| `pantallas/Main.dc.html` | 3 · Espacio de trabajo: Revisar y corregir · Generar casos · Exportar (incluye el motor de reglas de referencia en JavaScript) |
| `pantallas/Versiones.dc.html` | 4 · Versiones y comparación |
| `pantallas/Reglas.dc.html` | 5 · Reglas y diccionario de dominio |
| `pantallas/canvas.json` | Disposición de las pantallas en el lienzo |
| `sistema-de-diseno/tokens.json` | Tokens del sistema de diseño QualiReq (colores, espaciado, radios) |
| `docs/SPEC.md` | Especificación de producto y arquitectura (v2) para programar con Claude Code |

## Cómo usarlos

- Los archivos `.dc.html` son el código fuente de las pantallas del lienzo. Necesitan el
  runtime del editor de diseño (`support.js`), así que **no se abren solos en el navegador**:
  sirven como referencia exacta de estructura, estilos (CSS en `<helmet><style>`) y lógica
  (bloque `<script type="text/x-dc">`).
- Para la implementación real, sigue `docs/SPEC.md`. Si el diseño y la especificación
  difieren, manda la especificación.
- La tipografía final es Bricolage Grotesque + Plus Jakarta Sans + JetBrains Mono, y los colores
  definitivos son los de la sección 5 de la especificación. `tokens.json` aún indica Geist y
  algunos colores de la versión anterior.
