HELP DESK NEST

API backend desarrollado con NestJs, TypeScrip, PostGreSQL, Prisma, JWT y Socket.io

Con este sistema gestionamos usuarios, categorias, tickets, comentarios y notificaciones en tiempo real

> Documentación del equipo: [US-07 · Listar usuarios por rol](docs/US-07.md)


TECNOLOGÍAS
-NestJs
-TypeSript
-PostgreSQL
-Prisma ORM
-JWT para autenticación
-bcrypt para contraseñas
-class-validator / class-transformers
-socket.io para notificaciones en tiempo real
-pnpm


INSTALACIÓN
* git clone https://github.com/gimontania/helpDeskNest.git 
  cd helpDeskNest
  pnpm install

* copiar .env.example como .env y configurar:
  DATABASE_URL="postgresql://..." 
  JWT_SECRET="una-clave-segura" 
  JWT_EXPIRES_IN=8h

* para desarrollo local, iniciar PostGreSQL con: 
  pnpm prisma dev

* usar DATABASE_URL proporcionada por Prisma Dev enn el .env

* aplicar las migraciones y cargar datos de prueba
  pnpm prisma migrate deploy
  pnpm prisma db seed


* EJECUTAR
  pnpm start:dev
  API disponible en: http://localhost:3000


* USUARIOS DE PRUEBA
  contraseña para todos: Password123
  ROL:           Email:
  ADMIN          admin@helpdesk.test
  AGENTE         agente@helpdesk.test
  EMPLEADO       empleado@helpdesk.test


* FUNCIONALIDADES
  Autenticación y autorización mediante JWT y roles.
  Gestión de usuarios y categorías.
  Creación y gestión de tickets.
  Comentarios en tickets.
  Estados: ABIERTO → EN_PROCESO → RESUELTO → CERRADO.
  Prioridades: BAJA, MEDIA, ALTA, URGENTE.
  Notificaciones en tiempo real mediante WebSocket + Socket.IO.


* COMANDOS ÚTILES
  pnpm start:dev
  pnpm build
  pnpm test
  pnpm test:e2e
  pnpm test:cov





















