export const TipoNotificacion = {
  ESTADO_CAMBIADO: 'tarea.estado_cambiado',
  TAREA_ASIGNADA: 'tarea.asignada',
  COMENTARIO_NUEVO: 'comentario.nuevo',
  PRUEBA: 'prueba',
} as const;

export type TipoNotificacion =
  (typeof TipoNotificacion)[keyof typeof TipoNotificacion];

export interface Notificacion {
  tipo: TipoNotificacion;
  mensaje: string;
  tareaId?: string;
  datos?: Record<string, unknown>;
}

export const EVENTO_NOTIFICACION = 'notificacion';

export const salaDeUsuario = (usuarioId: string) => `usuario:${usuarioId}`;
