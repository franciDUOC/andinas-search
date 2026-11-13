# Andinas Search

Sistema de gestión de mantenimiento asistido por computadora (CMMS) para **Manufacturas Andina S.A.**. Permite reportar fallas de maquinaria, monitorear su estado en tiempo real, asignar órdenes de trabajo a técnicos y consultar el historial de cada máquina desde el celular.

**Aplicación publicada:** https://andinasearch.lovable.app/

## Problema que resuelve

Hoy el mantenimiento se gestiona con bitácoras en papel, planillas Excel y comunicación informal. Esto genera pérdida de historial, demoras en la atención de fallas y poco control del gasto en repuestos. Andinas Search centraliza todo en un registro único por máquina.

## Equipo

| Integrante | Rol |
|---|---|
| Francisco Alarcon | Scrum Master|
| Jorge Cifuentes | Lead Developer |
| Mateo Valenzuela | Product Owner y Analista de requisitos |
| Tomas Canales| QA Lead|

Metodología: **Scrum**. Estimación con Planning Poker (escala de Fibonacci). Gestión del backlog en Jira (claves MNT-X).

## Tecnologías

- **Frontend:** React + TypeScript + Tailwind CSS
- **Base de datos, autenticación y tiempo real:** Supabase (PostgreSQL)
- **Hosting:** Lovable
- **Control de versiones:** GitHub

## Roles de usuario

| Rol | Qué hace |
|---|---|
| Operario | Reporta anomalías (ruido, vibración, fuga) en máximo 3 pasos |
| Técnico | Recibe órdenes, escanea QR de máquinas y consulta historial y manuales |
| Supervisor | Monitorea el panel semafórico y asigna órdenes de trabajo |

## Estado del proyecto

### Sprint 1 (avance)

| Historia | Jira | Estado |
|---|---|---|
| HU-1: Reportar anomalías | MNT-5 | Implementada |
| HU-3A: Panel semáforo de máquinas | MNT-8 | Implementada |
| HU-3B: Asignar y reasignar órdenes | MNT-9 | [En desarrollo / Implementada] |
| HU-2A: QR, historial y manuales | MNT-6 | Pendiente |
