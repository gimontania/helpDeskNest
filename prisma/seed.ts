import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  EstadoTarea,
  PrioridadTarea,
  RolUsuario,
} from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const INICIO_DEMO = new Date('2026-10-01T09:00:00Z');
const HORA = 60 * 60 * 1000;
const fechaDemo = (horas: number) =>
  new Date(INICIO_DEMO.getTime() + horas * HORA);

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  // ---------- Usuarios ----------
  const usuarios = [
    {
      nombre: 'Admin Prueba',
      email: 'admin@helpdesk.test',
      rol: RolUsuario.ADMIN,
    },
    {
      nombre: 'Agente Prueba',
      email: 'agente@helpdesk.test',
      rol: RolUsuario.AGENTE,
    },
    {
      nombre: 'Agente Dos',
      email: 'agente2@helpdesk.test',
      rol: RolUsuario.AGENTE,
    },
    {
      nombre: 'Empleado Prueba',
      email: 'empleado@helpdesk.test',
      rol: RolUsuario.EMPLEADO,
    },
    {
      nombre: 'Empleado Dos',
      email: 'empleado2@helpdesk.test',
      rol: RolUsuario.EMPLEADO,
    },
  ];

  const idUsuario: Record<string, string> = {};
  for (const usuario of usuarios) {
    const creado = await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: { nombre: usuario.nombre, rol: usuario.rol, passwordHash },
      create: { ...usuario, passwordHash },
    });
    idUsuario[usuario.email] = creado.id;
  }

  const empleado = idUsuario['empleado@helpdesk.test'];
  const empleado2 = idUsuario['empleado2@helpdesk.test'];
  const agente = idUsuario['agente@helpdesk.test'];

  console.log(`Usuarios de prueba: ${usuarios.length}.`);

  const categorias = [
    {
      nombre: 'Hardware',
      descripcion: 'Problemas relacionados con equipos y dispositivos físicos.',
    },
    {
      nombre: 'Accesos',
      descripcion:
        'Problemas relacionados con cuentas, contraseñas y permisos de acceso.',
    },
    {
      nombre: 'Redes',
      descripcion: 'Problemas relacionados con conexión y servicios de red.',
    },
    {
      nombre: 'Software',
      descripcion: 'Instalación y errores de aplicaciones.',
    },
  ];

  const idCategoria: Record<string, string> = {};
  for (const categoria of categorias) {
    const creada = await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: { descripcion: categoria.descripcion },
      create: categoria,
    });
    idCategoria[categoria.nombre] = creada.id;
  }

  console.log(`Categorías de prueba: ${categorias.length}.`);

  const tickets = [
    {
      titulo: 'La computadora no enciende',
      categoria: 'Hardware',
      estado: EstadoTarea.ABIERTO,
      prioridad: PrioridadTarea.ALTA,
      creadorId: empleado,
      agenteId: null,
    },
    {
      titulo: 'No puedo acceder al correo',
      categoria: 'Accesos',
      estado: EstadoTarea.EN_PROCESO,
      prioridad: PrioridadTarea.URGENTE,
      creadorId: empleado,
      agenteId: agente,
    },
    {
      titulo: 'Conexión de red intermitente',
      categoria: 'Redes',
      estado: EstadoTarea.RESUELTO,
      prioridad: PrioridadTarea.MEDIA,
      creadorId: empleado,
      agenteId: agente,
    },
    {
      titulo: 'Configuración de impresora',
      categoria: 'Hardware',
      estado: EstadoTarea.CERRADO,
      prioridad: PrioridadTarea.BAJA,
      creadorId: empleado,
      agenteId: agente,
    },
    {
      titulo: 'Olvidé la contraseña de la VPN',
      categoria: 'Accesos',
      estado: EstadoTarea.ABIERTO,
      prioridad: PrioridadTarea.MEDIA,
      creadorId: empleado2,
      agenteId: null,
    },
  ];

  const respuestaAgente: Record<EstadoTarea, string> = {
    ABIERTO: 'Recibimos el reporte; está pendiente de asignación.',
    EN_PROCESO: 'Estamos revisando el problema.',
    RESUELTO: 'Se aplicó la solución; pendiente de cierre.',
    CERRADO: 'Atención finalizada y ticket cerrado.',
  };

  let totalComentarios = 0;

  for (const [indice, ticket] of tickets.entries()) {
    const id = `22000000-0000-4000-8000-${String(indice + 1).padStart(12, '0')}`;
    const creadoEn = fechaDemo(indice * 24);

    const data = {
      titulo: ticket.titulo,
      descripcion: `Ticket de demostración: ${ticket.titulo}.`,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
      categoriaId: idCategoria[ticket.categoria],
      creadorId: ticket.creadorId,
      agenteId: ticket.agenteId,
      creadoEn,
    };

    await prisma.tarea.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });

    const comentarios = [
      {
        autorId: ticket.creadorId,
        contenido: `Solicito ayuda: ${ticket.titulo}.`,
      },
      ...(ticket.agenteId
        ? [
            {
              autorId: ticket.agenteId,
              contenido: respuestaAgente[ticket.estado],
            },
          ]
        : []),
    ];

    for (const [numero, comentario] of comentarios.entries()) {
      const comentarioId = `22000000-0000-4000-9000-${String(indice * 2 + numero + 1).padStart(12, '0')}`;
      const datos = {
        tareaId: id,
        ...comentario,
        creadoEn: fechaDemo(indice * 24 + (numero + 1)),
      };

      await prisma.comentario.upsert({
        where: { id: comentarioId },
        update: datos,
        create: { id: comentarioId, ...datos },
      });
      totalComentarios++;
    }
  }

  console.log(
    `Demo lista: ${usuarios.length} usuarios, ${categorias.length} categorías, ` +
      `${tickets.length} tickets y ${totalComentarios} comentarios.`,
  );
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
