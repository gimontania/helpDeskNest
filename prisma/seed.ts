import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

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

  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: {
        nombre: categoria.nombre,
      },
      update: {
        descripcion: categoria.descripcion,
      },
      create: categoria,
    });
  }

  console.log('Categorías de prueba creadas correctamente.');
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });