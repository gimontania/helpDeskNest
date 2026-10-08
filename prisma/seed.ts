import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { EstadoTarea, PrioridadTarea } from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const usuarios = [
    {
      nombre: 'Admin Prueba',
      email: 'admin@helpdesk.test',
      rol: 'ADMIN' as const,
    },
    {
      nombre: 'Agente Prueba',
      email: 'agente@helpdesk.test',
      rol: 'AGENTE' as const,
    },
    {
      nombre: 'Empleado Prueba',
      email: 'empleado@helpdesk.test',
      rol: 'EMPLEADO' as const,
    },
  ];

  const usuariosCreados: Record<string, string> = {};
  for (const usuario of usuarios) {
    const creado = await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: { nombre: usuario.nombre, rol: usuario.rol, passwordHash },
      create: { ...usuario, passwordHash },
    });
    usuariosCreados[usuario.rol] = creado.id;
  }

  console.log('Usuarios de prueba creados correctamente.');

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
  ];

  const categoriasCreadas: Record<string, string> = {};
  for (const categoria of categorias) {
    const creada = await prisma.categoria.upsert({
      where: {
        nombre: categoria.nombre,
      },
      update: {
        descripcion: categoria.descripcion,
      },
      create: categoria,
    });
    categoriasCreadas[categoria.nombre] = creada.id;
  }

  console.log('Categorías de prueba creadas correctamente.');

  const tickets = [
    {
      titulo: 'La computadora no enciende',
      categoria: 'Hardware',
      estado: EstadoTarea.ABIERTO,
      prioridad: PrioridadTarea.ALTA,
    },
    {
      titulo: 'No puedo acceder al correo',
      categoria: 'Accesos',
      estado: EstadoTarea.EN_PROCESO,
      prioridad: PrioridadTarea.URGENTE,
    },
    {
      titulo: 'Conexión de red intermitente',
      categoria: 'Redes',
      estado: EstadoTarea.RESUELTO,
      prioridad: PrioridadTarea.MEDIA,
    },
    {
      titulo: 'Configuración de impresora',
      categoria: 'Hardware',
      estado: EstadoTarea.CERRADO,
      prioridad: PrioridadTarea.BAJA,
    },
  ];

  for (const [indice, ticket] of tickets.entries()) {
    const id = `22000000-0000-4000-8000-${String(indice + 1).padStart(12, '0')}`;
    const data = {
      titulo: ticket.titulo,
      descripcion: `Ticket de demostración: ${ticket.titulo}.`,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
      categoriaId: categoriasCreadas[ticket.categoria],
      creadorId: usuariosCreados.EMPLEADO,
      agenteId:
        ticket.estado === EstadoTarea.ABIERTO ? null : usuariosCreados.AGENTE,
    };
    await prisma.tarea.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });

    const comentarios = [
      {
        autorId: usuariosCreados.EMPLEADO,
        contenido: `Solicito ayuda: ${ticket.titulo}.`,
      },
      {
        autorId: usuariosCreados.AGENTE,
        contenido: {
          ABIERTO: 'Recibimos el reporte; está pendiente de asignación.',
          EN_PROCESO: 'Estamos revisando el problema.',
          RESUELTO: 'Se aplicó la solución; pendiente de cierre.',
          CERRADO: 'Atención finalizada y ticket cerrado.',
        }[ticket.estado],
      },
    ];
    for (const [numero, comentario] of comentarios.entries()) {
      const comentarioId = `22000000-0000-4000-9000-${String(indice * 2 + numero + 1).padStart(12, '0')}`;
      const datos = { tareaId: id, ...comentario };
      await prisma.comentario.upsert({
        where: { id: comentarioId },
        update: datos,
        create: { id: comentarioId, ...datos },
      });
    }
  }
  console.log(
    'Demo lista: 3 usuarios, 3 categorías, 4 tickets y 8 comentarios.',
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
