# Procedencia de ejemplos de reglas

Los ejemplos del catálogo se tomaron de `design/pantallas/Reglas.dc.html`.
Los siguientes conservaron su redacción de diseño y se usan sin cambios:

| Regla | Procedencia |
| --- | --- |
| AMB-01, AMB-02, AMB-03 | Diseño |
| VER-02 | Diseño |
| COM-01, COM-02, COM-03, COM-04 | Diseño |
| VIA-01, PRI-01, CON-01, CON-02, NEC-01 | Diseño |

Dos ejemplos se adaptaron de forma mínima para cumplir la detección exacta de
la especificación y poder ser una prueba que dispara la regla:

| Regla | Ejemplo de diseño | Ejemplo usado | Motivo |
| --- | --- | --- | --- |
| VER-01 | `El sistema debe tener buen rendimiento.` | `RNF-01 El sistema debe tener buen rendimiento.` | La regla solo se evalúa para requisitos RNF. |
| COR-01 | `Generar y exportar el reporte.` | `El sistema debe generar y exportar el reporte.` | La detección exige el patrón `debe verbo-r y verbo-r`. |

CON-02 y NEC-01 mantienen ejemplos de diseño, pero por especificación no se
disparan automáticamente en el MVP.
