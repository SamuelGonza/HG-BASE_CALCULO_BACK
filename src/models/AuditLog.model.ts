import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  entidad: string;
  entidadId: Types.ObjectId;
  accion: string;
  cambios: Record<string, any>;
  usuarioId: Types.ObjectId;
  timestamp: Date;
  createdAt?: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  entidad: { type: String, required: true, trim: true },
  entidadId: { type: Schema.Types.ObjectId, required: true },
  accion: { type: String, required: true, trim: true },
  cambios: { type: Schema.Types.Mixed, required: true },
  usuarioId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  timestamp: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true
});

AuditLogSchema.index({ entidad: 1, entidadId: 1 });
AuditLogSchema.index({ usuarioId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);



