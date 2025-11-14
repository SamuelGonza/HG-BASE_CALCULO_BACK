import mongoose, { Schema, Document } from 'mongoose';

export interface ILab extends Document {
  nombre: string;
  pais: string;
  habilitado: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const LabSchema = new Schema<ILab>({
  nombre: { type: String, required: true, trim: true, unique: true },
  pais: { type: String, required: true, trim: true },
  habilitado: { type: Boolean, default: true }
}, {
  timestamps: true
});

// nombre ya tiene índice por unique: true, no duplicar
LabSchema.index({ habilitado: 1 });

export const Lab = mongoose.model<ILab>('Lab', LabSchema);

