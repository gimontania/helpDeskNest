import { io } from 'socket.io-client';

const token = process.argv[2];
const socket = io('http://localhost:3000/notificaciones', { auth: { token } });

socket.on('connect', () => console.log('Conectado:', socket.id));
socket.on('notificacion', (n) => console.log('Notificación:', n));
socket.on('disconnect', (motivo) => console.log('Desconectado:', motivo));
