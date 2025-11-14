import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStability extends Document {
  medicamentoId: Types.ObjectId;
  laboratorioId: Types.ObjectId;
  vehiculoId: Types.ObjectId;
  envaseId: Types.ObjectId;
  horasEstabilidad: number;
  condiciones: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StabilitySchema = new Schema<IStability>({
  medicamentoId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Medicine', 
    required: true 
  },
  laboratorioId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lab', 
    required: true 
  },
  vehiculoId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  envaseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Container', 
    required: true 
  },
  horasEstabilidad: { type: Number, required: true, min: 0 },
  condiciones: { type: String, required: true, trim: true }
}, {
  timestamps: true
});

// Índice único para la combinación de medicamento + laboratorio + vehículo + envase
StabilitySchema.index(
  { medicamentoId: 1, laboratorioId: 1, vehiculoId: 1, envaseId: 1 },
  { unique: true }
);

export const Stability = mongoose.model<IStability>('Stability', StabilitySchema);



