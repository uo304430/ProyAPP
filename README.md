# ⚡ B2L — Plataforma de Entrenamiento en Powerlifting

> **Aplicación web full-stack para gestión del entrenamiento de fuerza.**  
> Diseña bloques de periodización, registra cada serie, visualiza la progresión de e1RM, controla el bienestar semanal y registra resultados de competición — todo en un mismo sistema de fondo oscuro.

**Autor:** Izan Sánchez

---

## ¿Qué es B2L?

B2L reemplaza las hojas de cálculo y las apps genéricas de fitness para atletas de fuerza serios. Está construida sobre el modelo de **periodización por bloques**: un entrenador (o el propio atleta) diseña un ciclo de entrenamiento de varias semanas con objetivos precisos por serie — peso, repeticiones y RPE. El atleta ejecuta cada sesión dentro de la app, registrando los datos reales. Todo fluye automáticamente hacia los análisis.

Soporta tanto **atletas autodidactas** (crean sus propios bloques) como el **flujo entrenador → atleta** (el coach diseña, el atleta ejecuta, el coach monitoriza el cumplimiento y la progresión).

---

## Capturas de pantalla

> *(próximamente — interfaz oscura, editor de bloques en 3 paneles, gráficas SVG de progresión)*

---

## Funcionalidades

### Gestión de Bloques de Entrenamiento
- **Asistente de 3 pasos** para crear un bloque: configurar nombre / semanas / días → construir ejercicios por día → elegir estrategia de progresión
- **Selector de días de entrenamiento**: elige días concretos de la semana (Lun, Mar, Mié…) en lugar de un simple número; los días se nombran automáticamente en todo el bloque
- **Editor en 3 paneles** (lista de días | tarjetas de ejercicios con filas por serie | panel de historial del ejercicio)
- Estrategias de progresión: **Igual todas las semanas**, **Ola de RPE** (peaking de intensidad), **Ola de Volumen** (acumulación)
- **Sistema de publicación semanal**: el coach revisa y publica cada semana individualmente; el atleta solo ve las semanas publicadas (aplica solo en bloques entrenador→atleta; los bloques autodidactas se publican automáticamente)
- Copia de ejercicios desde un bloque anterior con un clic
- Eliminación en cascada completa (bloque → semanas → días → entrenamientos planificados → series)
- Lista de bloques con fecha de inicio, número de semanas, etiqueta de objetivo y acceso rápido a editar/eliminar

### Ejecución de Sesiones
- El atleta ve el entrenamiento del día con peso × repeticiones @ RPE planificados
- Registra peso real, repeticiones y RPE por serie
- **e1RM calculado automáticamente** al guardar (fórmula Brzycki + RPE)
- Notas de cap de peso visibles por serie (techo definido por el coach)
- **Nota por serie** para que el atleta anote cualquier observación
- Timestamp (`logged_at`) guardado en cada serie completada para analíticas por fecha
- El botón de añadir series está reservado exclusivamente al entrenador

### Dashboard de Analíticas (3 pestañas)
- **Tab "Histórico"** — gráfica continua a lo largo de todos los bloques en orden cronológico:
  - Barras agrupadas de S.I (SQ/BP/DL) semana a semana, con separadores visuales entre bloques
  - Líneas de e1RM (SQ/BP/DL) a lo largo del tiempo
  - Leyenda de bloques con número y fecha de inicio
- **Tab "Resumen"** — métricas por semana del bloque seleccionado:
  - Gráficas de S.I y e1RM del bloque actual
  - Tabla por levantamiento: S.I · Tonelaje · e1RM · %RM · RPE · NS · NL
  - Fórmula S.I: `Σ reps × (%RM)⁴ / 3` por serie; `%RM = peso / mejor_e1rm_del_bloque`
- **Tab "Detalle"** — lista de todos los bloques (más recientes primero); al seleccionar uno:
  - Selector de semana con estado de publicación (Publicada ✓ / Borrador)
  - Botón publicar/despublicar por semana
  - **Edición inline por serie**: cada fila tiene sus propios inputs de peso / reps / RPE, se guardan automáticamente al perder el foco o pulsar Enter
  - **+ / ×**: añadir o eliminar series individuales por ejercicio
  - **+ Añadir ejercicio**: búsqueda en la biblioteca y adición a cualquier día
  - **🗑**: eliminar un ejercicio completo del día
- Clasificación automática de ejercicios en SQ/BP/DL por nombre o campo `subcategory`

### Cuestionario de Bienestar Semanal
- Accesible desde la vista de días de cada semana del bloque (botón "Cuestionario semanal" con acento azul)
- 5 métricas puntuadas de 1 a 10: **fatiga, agujetas, sueño, motivación, estrés**
- Upsert por semana (se puede rellenar a lo largo de la semana, gana el último guardado)
- Historial de las últimas semanas en cuadrícula compacta
- Campo de notas libre opcional
- **El coach puede ver el cuestionario de su atleta en modo solo lectura** (sin botón guardar, campos no editables)

### Competiciones
- Registro de resultados de competición: nombre, fecha, federación, categoría de peso
- Mejores intentos de sentadilla / press de banca / peso muerto y total
- **Gráfica de progresión de total** — barras SVG por competición
- Crear / editar / eliminar inline con confirmación

### Panel del Entrenador
- El coach ve todos los atletas vinculados en una cuadrícula de tarjetas
- El nombre completo del atleta aparece en grande, con el **@usuario** debajo para diferenciar atletas con el mismo nombre
- **Contador de semanas pendientes de revisión**: badge global y por atleta — máximo 1 por bloque (solo la siguiente semana secuencial sin publicar)
- Botón de publicación/despublicación de semana directamente desde el editor de bloque
- Acceso directo a los bloques, al calendario o al cuestionario de bienestar de cualquier atleta
- Los bloques de los atletas son totalmente editables por el coach (mismo editor, mismo acceso al historial)
- Vista de cumplimiento: cada serie registrada marcada en verde / amarillo / rojo según cómo el RPE real compara con el objetivo

### Conexiones
- Los atletas envían solicitudes de conexión a entrenadores por **correo electrónico o @usuario**
- El coach acepta o rechaza solicitudes
- Una vez conectado, el coach puede ver y editar los datos del atleta

### Vista de Calendario
- Vista mensual de los días de entrenamiento planificados
- El coach ve en su propio calendario todos los bloques de sus atletas (con nombre del atleta etiquetado)
- El atleta ve solo su propio bloque activo
- Clic en un día muestra el detalle de ejercicios planificados para esa sesión
- Los días se muestran con su nombre real (Lunes, Miércoles…) si fue configurado al crear el bloque

### Perfil
- Nombre visible y avatar (subida en base64)
- Campos de records personales en sentadilla / banca / peso muerto

### Registro de usuarios
- Campos obligatorios: nombre, apellidos, **@usuario** (único y buscable), email y contraseña
- El @usuario permite encontrar a otro usuario para conectar sin necesitar su email

### Biblioteca de Ejercicios
- Búsqueda de ejercicios al añadir a un día
- **Crear ejercicio nuevo** directamente desde el buscador cuando no existe en la biblioteca: nombre, categoría y variante opcional

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM |
| **Base de datos** | SQLite (fichero único, sin configuración) |
| **Frontend** | React 19, Vite, estilos 100% inline (sin ficheros CSS) |
| **Gráficas** | SVG puro — sin librerías de charting |
| **Cliente HTTP** | Axios |
| **Autenticación** | Hash de contraseñas con bcrypt, sesión vía localStorage |
| **Despliegue** | Proceso único — FastAPI sirve el SPA de React compilado |

---

## Modelo de Datos

```
User (atleta | entrenador)
 └─ Profile (nombre, apellidos, avatar, records personales)
 └─ CoachAthlete (relación M:N con estado pending/accepted)
 └─ Block (ciclo de entrenamiento)
      └─ Week (1..N semanas)
           └─ Day (1..M días por semana)
                └─ PlannedWorkout (un slot de ejercicio planificado)
                     ├─ target_weight, target_reps, target_rpe, modifier, weight_cap
                     └─ Set (una fila planificada)
                          ├─ planificado: weight / reps / rpe
                          ├─ real: weight / reps / rpe / estimated_1rm
                          ├─ weight_cap (techo de peso del coach)
                          ├─ note (nota del atleta por serie)
                          └─ logged_at (timestamp ISO, se registra al completar datos reales)
 └─ WeeklyCheckin (fatiga/agujetas/sueño/motivación/estrés 1-10, por semana ISO)
 └─ Competition (nombre, fecha, federación, categoría, mejores intentos SBD, total)

Exercise (biblioteca global)
 └─ name, category, variant, subcategory
```

---

## Endpoints de la API

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/register/` | Registrar nuevo usuario (nombre, apellidos, @usuario, email, contraseña) |
| POST | `/login/` | Login, devuelve id y rol |

### Bloques
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/blocks/full/` | Crear bloque con todas las semanas y días |
| GET | `/atleta/{id}/blocks/` | Listar bloques del atleta |
| GET | `/blocks/{id}/full/` | Estructura completa del bloque (semanas → días → ejercicios → series) |
| DELETE | `/blocks/{id}/` | Eliminar bloque (cascada completa) |
| POST | `/blocks/{id}/copy-from/{src}/` | Copiar ejercicios de otro bloque |
| POST | `/blocks/{id}/replicate-template/` | Aplicar progresión y rellenar semanas 2–N |

### Entrenamientos y Series
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/days/{id}/workouts/` | Obtener entrenamientos planificados de un día |
| POST | `/days/{id}/workouts/` | Añadir ejercicio a un día |
| DELETE | `/workouts/{id}/` | Eliminar ejercicio de un día |
| GET | `/planned_workouts/{id}/series/` | Obtener series de un entrenamiento planificado |
| POST | `/planned_workouts/{id}/series/add/` | Añadir serie en blanco a un ejercicio |
| PUT | `/series/{id}/` | Registrar datos reales (peso/reps/RPE/nota) |
| PUT | `/series/{id}/plan/` | Actualizar datos planificados (peso/reps/RPE target) |
| DELETE | `/series/{id}/` | Eliminar serie no ejecutada |

### Analíticas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/atleta/{id}/ejercicios-con-datos/` | Ejercicios con series registradas, ordenados por frecuencia |
| GET | `/atleta/{id}/ejercicio/{eid}/progreso/` | Historial de e1RM + mejor e1RM |
| GET | `/atleta/{id}/tonelaje-semanal/` | Tonelaje semanal (kg × reps por semana ISO) |
| GET | `/atleta/{id}/ejercicio/{eid}/historial-sesiones/` | Historial agrupado para el panel lateral |
| GET | `/atleta/{id}/cumplimiento/` | Cumplimiento de RPE por serie (verde/amarillo/rojo) |

### Bienestar y Competiciones
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/atleta/{id}/checkin/` | Enviar check-in semanal (upsert por semana) |
| GET | `/atleta/{id}/checkins/` | Historial de check-ins |
| GET/POST | `/atleta/{id}/competitions/` | Listar / crear competiciones |
| PUT/DELETE | `/competitions/{id}/` | Actualizar / eliminar competición |

### Conexiones, Perfiles y Ejercicios
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/connections/request/` | Enviar solicitud de conexión por email o @usuario |
| GET | `/connections/coach/{id}/athletes/` | Lista de atletas del coach (con nombre completo y @usuario) |
| GET | `/connections/coach/{id}/pending-reviews/` | Semanas pendientes de revisión por atleta |
| GET/PUT | `/profiles/{id}/` | Obtener / actualizar perfil |
| GET | `/ejercicios/` | Listar toda la biblioteca de ejercicios |
| POST | `/ejercicios/` | Crear nuevo ejercicio en la biblioteca |

---

## Instalación y Desarrollo Local

### Requisitos previos
- Python 3.12+
- Node.js 20+

### Backend

```bash
cd ProyAPP
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

La base de datos (`sql_app.db`) se crea automáticamente en el primer arranque. Las migraciones de columnas nuevas se ejecutan automáticamente al iniciar.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite hace proxy de `/api` hacia `localhost:8000`. Abrir [http://localhost:5173](http://localhost:5173).

### Build para producción

```bash
cd frontend && npm run build
# FastAPI sirve /dist como ficheros estáticos en "/"
uvicorn app.main:app --port 8000
```

---

## Estructura del Proyecto

```
ProyAPP/
├── app/
│   ├── main.py              # App FastAPI, arranque, migraciones, servicio de estáticos
│   ├── models.py            # Modelos SQLAlchemy
│   ├── schemas.py           # Schemas Pydantic de request/response
│   ├── database.py          # Motor SQLite y sesión
│   ├── dependencies.py      # Dependencia get_db
│   ├── utils.py             # Fórmula e1RM (Brzycki + RPE)
│   └── routers/
│       ├── auth.py
│       ├── blocks.py
│       ├── workouts.py
│       ├── exercises.py
│       ├── analytics.py
│       ├── connections.py
│       ├── profiles.py
│       ├── checkins.py
│       └── competitions.py
├── frontend/
│   └── src/
│       ├── App.jsx              # Raíz: máquina de estados de navegación
│       ├── styles/theme.js      # Tokens de diseño (colores, espaciado)
│       └── components/
│           ├── AppShell.jsx         # Barra B2L fija + menú hamburguesa (escritorio) / barra inferior (móvil)
│           ├── LoginForm.jsx
│           ├── RegistroForm.jsx     # Registro con nombre, apellidos y @usuario
│           ├── BloquesView.jsx      # Lista de bloques
│           ├── CrearBloqueView.jsx  # Asistente de creación en 3 pasos
│           ├── EditarBloqueView.jsx # Editor de bloque en 3 paneles
│           ├── SemanasView.jsx
│           ├── DiasView.jsx         # Lista de días + botón cuestionario semanal
│           ├── EntrenosDiaView.jsx  # Lista de entrenamientos del día
│           ├── EjecucionSerieView.jsx  # Ejecución serie a serie
│           ├── CheckinView.jsx      # Cuestionario de bienestar (modo edición y solo lectura)
│           ├── CompetitionsView.jsx # Registro de competiciones + gráfica
│           ├── CalendarioView.jsx   # Calendario mensual
│           ├── DashboardView.jsx    # Dashboard analítico (3 pestañas)
│           ├── CoachPanelView.jsx   # Cuadrícula de atletas del coach
│           ├── ConexionesView.jsx   # Solicitudes de conexión coach/atleta
│           └── PerfilView.jsx       # Perfil de usuario
├── sql_app.db          # Base de datos SQLite (creada automáticamente)
└── requirements.txt
```

---

## Sistema de Diseño

- **Fondo:** `#0c0c10` (negro casi puro)
- **Acento principal:** `#00ff87` (verde neón)
- **Superficie:** `#13131a` / `#1a1a24`
- **Texto:** `#f0f0f5` / `#9090a0` (atenuado)
- **Peligro:** `#ff4444`
- **Sin ficheros CSS** — todos los estilos son objetos inline de React via un mapa de tokens `theme.js`
- **Sin librerías de componentes UI** — cada componente está hecho a mano
- **Responsive:** barra B2L fija + menú hamburguesa en escritorio (≥680px), barra de navegación inferior en móvil

---

## Fórmula e1RM

Híbrido entre Brzycki y ajuste por RPE:

```
repsEq = reps + (10 - rpe)       # repeticiones efectivas al esfuerzo máximo
e1rm   = peso / (1.0278 - 0.0278 × repsEq)
```

El RPE ajusta el conteo efectivo de repeticiones antes de aplicar la curva Brzycki, dando estimaciones precisas incluso a intensidades sub-máximas.

---

## Roadmap

- [ ] Alertas de fatiga por tendencia de RPE para entrenadores
- [ ] Exportación a PDF de un bloque de entrenamiento
- [ ] Notificaciones push para días de entrenamiento programados
- [ ] Soporte multiidioma (ES / EN)
- [ ] Puntuación Wilks / IPF GL en resultados de competición
- [ ] Adjunto de vídeo por serie (revisión de técnica)

---

## Licencia

Privado / propietario. No abierto a contribuciones externas por el momento.
