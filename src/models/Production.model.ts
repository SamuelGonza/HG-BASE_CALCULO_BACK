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

export type LineaProduccion = 'ONCO' | 'ESTERIL';

export interface IPaciente {
  nombre: string;
  documento: string;
  aseguradora: string; // EPS o aseguradora del paciente
  diagnostico: string; // Diagnóstico del paciente
}

export interface IMedicamentoMezcla {
  id: Types.ObjectId;
  nombre: string;
  concentracion: string;
  viaAdministracion: string;
  dosisPrescrita: number;
  unidadDosis: string;
}

export interface IEnvaseMezcla {
  id: Types.ObjectId;
  tipo: string;
  nombre?: string;
}

export interface IVehiculoMezcla {
  id: Types.ObjectId;
  nombre: string;
  volumenVehiculo: number; // Volumen del vehículo en mL
}

export interface ICalculosMezcla {
  volumenExtraer: number; // Volumen a extraer del medicamento
  volumenMezcla: number; // Volumen de la mezcla (medicamento)
  volumenVehiculo: number; // Volumen del vehículo
  volumenTotal: number; // Volumen total final (mezcla + vehículo)
  unidadesInsumo: number; // Unidades de insumo necesarias
}

export interface IMezcla {
  paciente: IPaciente;
  medicamento: IMedicamentoMezcla;
  envase: IEnvaseMezcla;
  vehiculo: IVehiculoMezcla;
  calculos: ICalculosMezcla;
  loteMezcla: string; // Lote específico de esta mezcla
  fechaVencimiento: Date; // Fecha de vencimiento de esta mezcla
  cantidadMezclas: number; // Cantidad de mezclas para este paciente/medicamento
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
  codigo: string; // Número de orden de producción
  fechaProduccion?: Date; // Fecha y hora de producción
  qfInterpretacion?: string; // Nombre del QF de interpretación
  qfProduccion?: string; // Nombre del QF de producción
  qfCalidad?: string; // Nombre del QF de calidad
  lineaProduccion: LineaProduccion; // Línea de producción (ONCO o ESTERIL)
  cantidadMezclas: number; // Cantidad total de mezclas en la orden
  mezclas: IMezcla[]; // Array de mezclas (cada una es un medicamento para un paciente)
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
  aseguradora: { type: String, required: true, trim: true },
  diagnostico: { type: String, required: true, trim: true }
}, { _id: false });

const MedicamentoMezclaSchema = new Schema<IMedicamentoMezcla>({
  id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  nombre: { type: String, required: true, trim: true },
  concentracion: { type: String, required: true, trim: true },
  viaAdministracion: { type: String, required: true, trim: true },
  dosisPrescrita: { type: Number, required: true, min: 0 },
  unidadDosis: { type: String, required: true, trim: true }
}, { _id: false });

const EnvaseMezclaSchema = new Schema<IEnvaseMezcla>({
  id: { type: Schema.Types.ObjectId, ref: 'Container', required: true },
  tipo: { type: String, required: true, trim: true },
  nombre: { type: String, trim: true }
}, { _id: false });

const VehiculoMezclaSchema = new Schema<IVehiculoMezcla>({
  id: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  nombre: { type: String, required: true, trim: true },
  volumenVehiculo: { type: Number, required: true, min: 0 }
}, { _id: false });

const CalculosMezclaSchema = new Schema<ICalculosMezcla>({
  volumenExtraer: { type: Number, required: true, min: 0 },
  volumenMezcla: { type: Number, required: true, min: 0 },
  volumenVehiculo: { type: Number, required: true, min: 0 },
  volumenTotal: { type: Number, required: true, min: 0 },
  unidadesInsumo: { type: Number, required: true, min: 0 }
}, { _id: false });

const MezclaSchema = new Schema<IMezcla>({
  paciente: { type: PacienteSchema, required: true },
  medicamento: { type: MedicamentoMezclaSchema, required: true },
  envase: { type: EnvaseMezclaSchema, required: true },
  vehiculo: { type: VehiculoMezclaSchema, required: true },
  calculos: { type: CalculosMezclaSchema, required: true },
  loteMezcla: { type: String, required: true, trim: true },
  fechaVencimiento: { type: Date, required: true },
  cantidadMezclas: { type: Number, required: true, min: 1, default: 1 }
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
  fechaProduccion: { type: Date },
  qfInterpretacion: { type: String, trim: true },
  qfProduccion: { type: String, trim: true },
  qfCalidad: { type: String, trim: true },
  lineaProduccion: { 
    type: String, 
    required: true, 
    enum: ['ONCO', 'ESTERIL'],
    default: 'ESTERIL'
  },
  cantidadMezclas: { type: Number, required: true, min: 1, default: 1 },
  mezclas: { type: [MezclaSchema], required: true, default: [] },
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

// Índices
ProductionSchema.index({ estado: 1 });
ProductionSchema.index({ lineaProduccion: 1 });
ProductionSchema.index({ fechaProduccion: -1 });
ProductionSchema.index({ createdAt: -1 });
ProductionSchema.index({ 'mezclas.paciente.documento': 1 });
ProductionSchema.index({ 'mezclas.medicamento.id': 1 });

export const Production = mongoose.model<IProduction>('Production', ProductionSchema);
