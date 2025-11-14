import mongoose, { Schema, Document } from 'mongoose';

export interface IPresentation {
  volumen: number;
  unidad: string;
  cantidad: number;
  tipoEnvase: string;
}

export interface IMedicine extends Document {
  nombre: string;
  principioActivo: string;
  concentracion: string;
  presentaciones: IPresentation[];
  viaAdministracion: string;
  lineaProductiva: 'ONCO' | 'ESTERIL';
  habilitado: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PresentationSchema = new Schema<IPresentation>({
  volumen: { type: Number, required: true },
  unidad: { type: String, required: true },
  cantidad: { type: Number, required: true },
  tipoEnvase: { type: String, required: true }
}, { _id: false });

const MedicineSchema = new Schema<IMedicine>({
  nombre: { type: String, required: true, trim: true },
  principioActivo: { type: String, required: true, trim: true },
  concentracion: { type: String, required: true, trim: true },
  presentaciones: { type: [PresentationSchema], required: true },
  viaAdministracion: { type: String, required: true, trim: true },
  lineaProductiva: { 
    type: String, 
    required: true, 
    enum: ['ONCO', 'ESTERIL'] 
  },
  habilitado: { type: Boolean, default: true }
}, {
  timestamps: true
});

MedicineSchema.index({ nombre: 1 });
MedicineSchema.index({ habilitado: 1, lineaProductiva: 1 });

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);


