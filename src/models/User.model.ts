import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'AUXILIAR' | 'QUIMICO' | 'COORDINADOR' | 'AUDITOR';

export interface IUser extends Document {
  nombre: string;
  email: string;
  hashPassword: string;
  rol: UserRole;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true, lowercase: true },
  hashPassword: { type: String, required: true },
  rol: { 
    type: String, 
    required: true, 
    enum: ['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'] 
  },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true
});

// email ya tiene índice por unique: true, no duplicar
UserSchema.index({ activo: 1, rol: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

