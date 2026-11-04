# Auditoría interna — 2026-11-04 21:20

**Hallazgos:** 3 · altos: 2 · medios: 1 · bajos: 0

| Severidad | Área | Qué falla | Prueba | Dueño |
|---|---|---|---|---|
| alta | Disponibilidad | 1/15 URLs de la muestra no responden | https://valorcarta.github.io/en/card/30th-G-mew/ → 404 | Soporte |
| alta | Datos | 2 movimientos por encima del 1000 % (dato sucio) | neo1-13: 0.02→23.67 · sv05-195: 0.02→3.00 | Datos |
| media | Datos | Tráfico propio sin filtrar: las métricas no distinguen visitante de automatización | total 16 visitas | Datos |

## Reparto (cada uno sabe qué le toca)
- **Soporte**: 1 hallazgos
- **Datos**: 2 hallazgos
