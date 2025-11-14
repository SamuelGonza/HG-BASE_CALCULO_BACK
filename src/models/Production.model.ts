import mongoose, { Schema, Document, Types } from 'mongoose';

export type ProductionState = 
  | 'CREADO' 
  | 'VALIDADO' 
  | 'CALCULADO' 
  | 'PROGRAMADO' 
  | 'PRODUCIDO' 
  | 'QC' 
  | 'ETIQUETADO' 
  | 'FINALIZADO';

export interface IPaciente {
  nombre: string;
  documento: string;
  edad: number;
  peso?: number;
}

export interface IResultadosCalculo {
  volumenExtraer: number;
  volumenFinal: number;
  unidadesInsumo: number;
  lote: string;
  fechaVencimiento: Date;
}

export interface ITimestamps {
  creado: Date;
  validado?: Date;
  calculado?: Date;
  programado?: Date;
  producido?: Date;
  qc?: Date;
  etiquetado?: Date;
  finalizado?: Date;
}

export interface IProduction extends Document {
  codigo: string;
  paciente: IPaciente;
  medicamentoId: Types.ObjectId;
  laboratorioId?: Types.ObjectId;
  vehiculoId?: Types.ObjectId;
  envaseId?: Types.ObjectId;
  dosisPrescrita: number;
  unidadDosis: string;
  resultadosCalculo?: IResultadosCalculo;
  estado: ProductionState;
  versionMotorCalculo?: string;
  timestamps: ITimestamps;
  creadoPor: Types.ObjectId;
  validadoPor?: Types.ObjectId;
  calculadoPor?: Types.ObjectId;
  programadoPor?: Types.ObjectId;
  producidoPor?: Types.ObjectId;
  qcPor?: Types.ObjectId;
  etiquetadoPor?: Types.ObjectId;
  finalizadoPor?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const PacienteSchema = new Schema<IPaciente>({
  nombre: { type: String, required: true, trim: true },
  documento: { type: String, required: true, trim: true },
  edad: { type: Number, required: true, min: 0 },
  peso: { type: Number, min: 0 }
}, { _id: false });

const ResultadosCalculoSchema = new Schema<IResultadosCalculo>({
  volumenExtraer: { type: Number, required: true, min: 0 },
  volumenFinal: { type: Number, required: true, min: 0 },
  unidadesInsumo: { type: Number, required: true, min: 0 },
  lote: { type: String, required: true, trim: true },
  fechaVencimiento: { type: Date, required: true }
}, { _id: false });

const TimestampsSchema = new Schema<ITimestamps>({
  creado: { type: Date, required: true, default: Date.now },
  validado: { type: Date },
  calculado: { type: Date },
  programado: { type: Date },
  producido: { type: Date },
  qc: { type: Date },
  etiquetado: { type: Date },
  finalizado: { type: Date }
}, { _id: false });

const ProductionSchema = new Schema<IProduction>({
  codigo: { type: String, required: true, unique: true, trim: true },
  paciente: { type: PacienteSchema, required: true },
  medicamentoId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Medicine', 
    required: true 
  },
  laboratorioId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lab' 
  },
  vehiculoId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  },
  envaseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Container' 
  },
  dosisPrescrita: { type: Number, required: true, min: 0 },
  unidadDosis: { type: String, required: true, trim: true },
  resultadosCalculo: { type: ResultadosCalculoSchema },
  estado: { 
    type: String, 
    required: true, 
    enum: ['CREADO', 'VALIDADO', 'CALCULADO', 'PROGRAMADO', 'PRODUCIDO', 'QC', 'ETIQUETADO', 'FINALIZADO'],
    default: 'CREADO'
  },
  versionMotorCalculo: { type: String, trim: true },
  timestamps: { type: TimestampsSchema, required: true, default: () => ({ creado: new Date() }) },
  creadoPor: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  validadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  calculadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  programadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  producidoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  qcPor: { type: Schema.Types.ObjectId, ref: 'User' },
  etiquetadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  finalizadoPor: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// codigo ya tiene índice por unique: true, no duplicar
ProductionSchema.index({ estado: 1 });
ProductionSchema.index({ 'paciente.documento': 1 });
ProductionSchema.index({ medicamentoId: 1 });
ProductionSchema.index({ createdAt: -1 });

export const Production = mongoose.model<IProduction>('Production', ProductionSchema);

