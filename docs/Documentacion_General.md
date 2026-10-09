1. Tecnologías

   | Área               | Tecnología                                               |
   | ------------------ | -------------------------------------------------------- |
   | Framework          | NestJS 12 · TypeScript                                   |
   | Base de datos      | PostgreSQL 17                                            |
   | ORM                | Prisma 7 (con @prisma/adapter-pg)                        |
   | Autenticación      | JWT (@nestjs/jwt, passport-jwt) · contraseñas con bcrypt |
   | Validación         | class-validator / class-transformer                      |
   | Tiempo real        | WebSocket con Socket.io (@nestjs/websockets)             |
   | Documentación      | Swagger (@nestjs/swagger)                                |
   | Contenedores       | Docker · Docker Compose                                  |
   | Gestor de paquetes | pnpm 10.33.2                                             |
   | Pruebas            | Jest · Supertest                                         |

2. Arquitectura

   | Módulo         | Responsabilidad                                                             |
   | -------------- | --------------------------------------------------------------------------- |
   | auth           | Registro, login y estrategia JWT. Guards de autenticación y de roles        |
   | usuarios       | Perfil, listado filtrable por rol, creación de usuarios internos            |
   | categorias     | Catálogo de categorías (consultar, crear, editar, eliminar)                 |
   | tareas         | Tickets: crear, listar, consultar, cambiar estado, asignar agente, métricas |
   | comentarios    | Historial de conversación de cada ticket                                    |
   | notificaciones | Gateway de Socket.io y servicio reutilizable de envío                       |
   | prisma         | Conexión a la base de datos (módulo global)                                 |
   | common         | Filtro global de excepciones y DTOs de error                                |

   src/
   ├── auth/ login, registro, JwtStrategy, guards (JwtAuthGuard, RolesGuard), @Roles
   ├── usuarios/
   ├── categorias/
   ├── tareas/
   ├── comentarios/
   ├── notificaciones/ gateway + service + tipos de evento
   ├── common/ filters/http-exception.filter.ts, decorators, dto/error-response.dto.ts
   ├── prisma/
   ├── generated/ cliente de Prisma (se genera, no se sube a Git)
   └── main.ts
   prisma/ schema.prisma, migraciones y seed.ts
   scripts/ escuchar-notificaciones.ts (cliente de prueba de Socket.io)
   docs/ documentación por historia de usuario

3. Instalación
   Requisitos
   - Node.js 24.9 o superior (Node 22 no sirve: las pruebas fallan por ES Modules)
   - pnpm 10.33.2 → corepack enable && corepack prepare pnpm@10.33.2 --activate
   - Git
   - Una base PostgreSQL (local, Neon o la que levanta Docker)

Variables de entorno
Copia .env.example como .env y completa:
DATABASE_URL="postgresql://usuario:password@host:5432/nombre_base?schema=public"
JWT_SECRET="una-cadena-larga-y-aleatoria"
JWT_EXPIRES_IN=8h

Para generar un secreto: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

Hay dos maneras de levantar el proyecto:
Opción A: instalación local

git clone https://github.com/gimontania/helpDeskNest.git
cd helpDeskNest
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm start:dev

API: http://localhost:3000 · Swagger: http://localhost:3000/docs

Opción B: Docker
Requiere Docker Desktop abierto (en Windows, con WSL 2) y JWT_SECRET en tu .env.
docker compose up --build

En otra terminal, carga los datos de la demo:
docker compose exec api pnpm prisma db seed

| Comando                     | Para qué                                     |
| --------------------------- | -------------------------------------------- |
| `docker compose down`       | Apagar. Los datos se conservan en el volumen |
| `docker compose down -v`    | Apagar y borrar la base                      |
| `docker compose up --build` | Reconstruir tras cambiar el código           |

| Comando               | Descripción                                              |
| --------------------- | -------------------------------------------------------- |
| `pnpm start:dev`      | Servidor con recarga automática                          |
| `pnpm build`          | Compilar a `dist/`                                       |
| `pnpm test`           | Pruebas unitarias                                        |
| `pnpm test:e2e`       | Pruebas e2e                                              |
| `pnpm prisma db seed` | Cargar datos de demo (puede repetirse: reinicia la demo) |
| `npx tsc --noEmit`    | Comprobar tipos                                          |

4. Usuarios de prueba (seed)
   Contraseña de todos: Password123

   | Correo                  | Rol      |
   | ----------------------- | -------- |
   | admin@helpdesk.test     | ADMIN    |
   | agente@helpdesk.test    | AGENTE   |
   | agente2@helpdesk.test   | AGENTE   |
   | empleado@helpdesk.test  | EMPLEADO |
   | empleado2@helpdesk.test | EMPLEADO |

5. Roles y permisos

   | Endpoint                                   | ADMIN   | AGENTE  | EMPLEADO            |
   | ------------------------------------------ | ------- | ------- | ------------------- |
   | `POST /auth/register` · `POST /auth/login` | público | público | público             |
   | `GET /usuarios/perfil`                     | ✅      | ✅      | ✅                  |
   | `GET /usuarios?rol=`                       | ✅      | ✅      | ❌                  |
   | `POST /usuarios`                           | ✅      | ❌      | ❌                  |
   | `GET /categorias` · `GET /categorias/:id`  | ✅      | ✅      | ✅                  |
   | `POST/PATCH/DELETE /categorias`            | ✅      | ✅      | ❌                  |
   | `POST /tareas`                             | ✅      | ✅      | ✅                  |
   | `GET /tareas` · `GET /tareas/:id`          | todas   | todas   | solo las suyas      |
   | `GET /tareas/metricas`                     | ✅      | ✅      | ❌                  |
   | `PATCH /tareas/:id/estado`                 | ✅      | ✅      | ❌                  |
   | `PATCH /tareas/:id/agente`                 | ✅      | ❌      | ❌                  |
   | `GET/POST /tareas/:id/comentarios`         | todas   | todas   | solo en sus tickets |

6. Reglas de negocio

   - Registro público: siempre crea usuarios con rol EMPLEADO. Si se envía rol, se ignora.
   - Usuarios internos: solo un ADMIN crea usuarios ADMIN o AGENTE, con POST /usuarios. El primer admin sale del seed.
   - Creación de tickets: el creador se toma del token, nunca del cuerpo. El estado siempre nace en ABIERTO.
   - Transiciones de estado: solo hacia adelante y de una en una.

   | Estado actual | Estado permitido |
   | ------------- | ---------------- |
   | ABIERTO       | EN_PROCESO       |
   | EN_PROCESO    | RESUELTO         |
   | RESUELTO      | CERRADO          |
   | CERRADO       | ninguno          |

7. Formato de errores

   | Código | Cuándo                                                                                               |
   | ------ | ---------------------------------------------------------------------------------------------------- |
   | 400    | Datos inválidos o ID con formato incorrecto                                                          |
   | 401    | Sin token o token inválido                                                                           |
   | 403    | El rol no tiene permiso                                                                              |
   | 404    | El recurso no existe, o un empleado pide un ticket ajeno                                             |
   | 409    | Duplicado o transición de estado no permitida                                                        |
   | 500    | Error inesperado: siempre "Error interno del servidor". El detalle solo queda en el log del servidor |

8. Métricas
   GET /tareas/metricas · solo ADMIN y AGENTE. La agrupación la hace la base de datos (groupBy y _count de Prisma), y los estados y categorías sin tickets aparecen con 0.
   Ejemplo:
   {
   "total": 7,
   "porEstado": [
   { "estado": "ABIERTO", "cantidad": 3 },
   { "estado": "EN_PROCESO", "cantidad": 2 },
   { "estado": "RESUELTO", "cantidad": 2 },
   { "estado": "CERRADO", "cantidad": 0 }
   ],
   "porCategoria": [
   { "categoriaId": "3f1c…", "nombre": "Accesos", "cantidad": 0 },
   { "categoriaId": "8a2d…", "nombre": "Hardware", "cantidad": 5 }
   ]
   }

9. Notificaciones en tiempo real

   Por qué WebSockets con Socket.io
   - Tiempo real: el creador y el agente ven el cambio al instante, sin recargar ni consultar la API cada cierto tiempo.
   - Integración nativa con NestJS: el Gateway usa inyección de dependencias, igual que el resto de módulos.
   - Destinatarios precisos: cada usuario se une a una sala privada (usuario:<id>), así la notificación llega solo a quien le importa.
   - Sin servidor de correo: no necesita credenciales externas. Si más adelante se agrega correo, se hace dentro de NotificacionesService sin tocar los demás módulos.

   Cómo funciona:
   1. El cliente se conecta a http://localhost:3000/notificaciones enviando su JWT en auth.token.
   2. El Gateway valida el token y mete la conexión en la sala usuario:<id>. Sin token válido, cierra la conexión.
   3. Cualquier módulo inyecta NotificacionesService y llama a enviar(destinatarios, notificacion, excluirUsuarioId).
   4. enviar nunca lanza errores: si falla o el usuario no está conectado, solo deja un log y la operación principal se completa igual.

   | Evento                  | Quién la recibe                                       |
   | ----------------------- | ----------------------------------------------------- |
   | `tarea.estado_cambiado` | Creador y agente asignado, menos quien hizo el cambio |
   | `comentario.nuevo`      | Creador y agente asignado, menos el autor             |

   {
   "tipo": "tarea.estado_cambiado",
   "mensaje": "Tu ticket \"La impresora no imprime\" cambió de ABIERTO a EN_PROCESO",
   "tareaId": "8a2d…",
   "datos": { "estadoAnterior": "ABIERTO", "estadoNuevo": "EN_PROCESO" },
   "fecha": "2026-10-08T14:30:00.000Z"
   }

   Importante: hay que estar conectado cuando ocurre el evento; las notificaciones no se guardan ni se reenvían. Un cliente de WebSocket "puro" no sirve: hay que usar socket.io-client.

10. Mejoras adicionales
    1. Filtro global de excepciones: formato de error único.
    2. Swagger: documentación interactiva en http://localhost:3000/docs. Haz login en POST /auth/login, copia el access_token y pégalo en Authorize.
    3. Docker: API + PostgreSQL con un solo comando.

11. Flujo de trabajo en Git
    - main es la rama estable. Nadie hace push directo.
    - Cada historia de usuario se trabaja en su propia rama, creada desde main actualizado, y llega a main mediante Pull Request revisado.
    - Commits convecionales (feat:, fix:, etc)
    - Después de cada git pull, correr pnpm install.

    git checkout main && git pull origin main
    pnpm install
    git checkout -b feature/US-XX-nombre

Trabajo realizado por rama (Adrián) osea, yo.
Todas las ramas se integraron a main mediante Pull Request.

| Fecha | Rama | PR | Qué hice
| 05-oct | `InicioDeSesion_Adrian` | #1 | Login con JWT. `POST /auth/login`: credenciales correctas devuelven un token; incorrectas devuelven el mismo error, sin indicar si falló el correo o la contraseña. El secreto vive en variables de entorno. Se agregó `PrismaModule` con el adaptador de PostgreSQL |
| 06-oct | `feature/US-06-roles` | #4 | Acciones limitadas por rol. Decorador `@Roles` y `RolesGuard`, aplicados en un solo lugar. Sin token → 401; rol insuficiente → 403. Se agregó el listado de usuarios filtrable por rol y la creación de usuarios internos solo por ADMIN. Usuarios de prueba en el seed |
| 07-oct | `feature/US-16-historial-comentarios` | #10 | Historial de comentarios. `GET /tareas/:tareaId/comentarios` en orden cronológico, con autor y fecha, sin datos sensibles. Reutiliza la regla de visibilidad de tickets: un empleado no lee comentarios ajenos |
| 07-oct | `feature/US-17-metricas` | #11 | Métricas. `GET /tareas/metricas`: tickets por estado y por categoría, con ceros incluidos, agrupados por la base de datos. Solo ADMIN y AGENTE |
| 07-oct | `feature/US-18-notificaciones` | #12 | Módulo de notificaciones reutilizable. Gateway de Socket.io con autenticación JWT y salas por usuario, `NotificacionesService.enviar()` que nunca lanza errores, y endpoint de prueba |
| 07-oct | `fix/merge-tareas-service` | #16 | Corrección de `main`. Un merge mal resuelto había mezclado `asignarAgente` y `cambiarEstado` en `tareas.service.ts` y el proyecto no compilaba. Se restauraron ambos métodos desde sus commits originales |
| 07-oct | `feature/US-19-notificar-cambio-estado` | #17 | Notificar cambio de estado. `TareasService` inyecta `NotificacionesService` y avisa al creador y al agente. Envuelto en try/catch: si la notificación falla, el cambio queda guardado. Pruebas actualizadas |
| 08-oct | `feature/US-21-pulido` | #20 | Formato de errores uniforme. Filtro global de excepciones: misma estructura en todos los errores, sin trazas ni detalles de la base de datos |
| 08-oct | `feature/US-24-swagger-docker` | #21 | Swagger. Documentación en `/docs` con autenticación por token, DTOs y respuestas de error documentadas |
| 09-oct | `feature/US-25-dockefile` | #22 | Docker. `Dockerfile`, `docker-compose.yml` (API + PostgreSQL) y `.dockerignore`. Pnpm fijado en 10.33.2 y openssl instalado para Prisma |

Demo sugerida

- Empleado (empleado@helpdesk.test): en Swagger, POST /tareas reporta un ticket. Queda en ABIERTO.
- Admin (admin@helpdesk.test): PATCH /tareas/:id/agente lo asigna al agente.
- Agente (agente@helpdesk.test): cambia el estado a EN_PROCESO y comenta.
- Empleado recibe las notificaciones en tiempo real (terminal con escuchar-notificaciones.ts).
- Admin: GET /tareas/metricas refleja el cambio de estado.
- Seguridad: el otro empleado (empleado2@helpdesk.test) pide ese ticket y recibe 404; un empleado pide las métricas y recibe 403.
