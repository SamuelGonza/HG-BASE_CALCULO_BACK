import { Types } from 'mongoose';

export type ProductionState = 
  | 'CREADO' 
  | 'VALIDADO' 
  | 'CALCULADO' 
  | 'PROGRAMADO' 
  | 'PRODUCIDO' 
  | 'QC' 
  | 'ETIQUETADO' 
  | 'FINALIZADO';

export type UserRole = 'AUXILIAR' | 'QUIMICO' | 'COORDINADOR' | 'AUDITOR';

export type DocumentType = 
  | 'SOLICITUD' 
  | 'ORDEN' 
  | 'INSUMOS' 
  | 'QC' 
  | 'ETIQUETAS' 
  | 'ACTA';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CalculationInput {
  dosisPrescrita: number;
  unidadDosis: string;
  concentracion: string;
  volumenPresentacion: number;
  unidadesPresentacion: number;
  horasEstabilidad: number;
}

export interface CalculationResult {
  volumenExtraer: number;
  volumenFinal: number;
  unidadesInsumo: number;
  lote: string;
  fechaVencimiento: Date;
}

export interface ProductionValidationData {
  medicamentoId: Types.ObjectId;
  laboratorioId: Types.ObjectId;
  vehiculoId: Types.ObjectId;
  envaseId: Types.ObjectId;
  lineaProductiva: 'ONCO' | 'ESTERIL';
}



