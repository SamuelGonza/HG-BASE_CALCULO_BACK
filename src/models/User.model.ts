import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'AUXILIAR' | 'QUIMICO' | 'COORDINADOR' | 'AUDITOR';

export type TipoUsuario = 'QUÍMICO FARMACÉUTICO' | 'ADMINISTRADOR' | 'INVITADO' | 'TÉCNICO';

export interface IUser extends Document {
  username: string; // RBOCNETT, SARBELAEZ, W.CHINDICY, etc.
  nombre: string; // Nombre completo
  tipoUsuario: TipoUsuario; // QUÍMICO FARMACÉUTICO, ADMINISTRADOR, etc.
  cargo: string; // COORDINADOR DE PRODUCCIÓN, DIRECTORA TÉCNICA, etc.
  identificacion: string; // Cédula (ej: 43.977.097)
  tarjetaProfesional?: string; // Número de tarjeta profesional
  firmaUrl?: string; // URL de la firma en Cloudinary
  firmaPublicId?: string; // Public ID de la firma en Cloudinary
  hashPassword: string;
  rolSistema: UserRole; // Rol de permisos en el sistema
  activo: boolean;
  // Funciones farmacéuticas dentro del proceso de producción
  esInterpretacion?: boolean; // Puede ser QF de interpretación
  esProduccion?: boolean; // Puede ser QF de producción
  esCalidad?: boolean; // Puede ser QF de calidad
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    trim: true, 
    unique: true, 
    uppercase: true 
  },
  nombre: { type: String, required: true, trim: true },
  tipoUsuario: { 
    type: String, 
    required: true,
    enum: ['QUÍMICO FARMACÉUTICO', 'ADMINISTRADOR', 'INVITADO', 'TÉCNICO'],
    default: 'QUÍMICO FARMACÉUTICO'
  },
  cargo: { type: String, required: true, trim: true },
  identificacion: { type: String, required: true, trim: true },
  tarjetaProfesional: { type: String, trim: true },
  firmaUrl: { type: String, trim: true }, // URL de la firma en Cloudinary
  firmaPublicId: { type: String, trim: true }, // Public ID de la firma en Cloudinary
  hashPassword: { type: String, required: true },
  rolSistema: { 
    type: String, 
    required: true, 
    enum: ['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'] 
  },
  activo: { type: Boolean, default: true },
  esInterpretacion: { type: Boolean, default: false },
  esProduccion: { type: Boolean, default: false },
  esCalidad: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Índices
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ activo: 1, rolSistema: 1 });
UserSchema.index({ identificacion: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
