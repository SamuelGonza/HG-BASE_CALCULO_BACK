import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export type DocumentType = 
  | 'SOLICITUD' 
  | 'ORDEN' 
  | 'INSUMOS' 
  | 'QC' 
  | 'ETIQUETAS' 
  | 'ACTA';

export interface IDocument extends MongooseDocument {
  productionId: Types.ObjectId;
  tipo: DocumentType;
  fileUrl: string; // URL del documento en Cloudinary
  filePublicId: string; // Public ID del documento en Cloudinary
  versionPlantilla: string;
  generadoPor: Types.ObjectId;
  generadoEn: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const DocumentSchema = new Schema<IDocument>({
  productionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Production', 
    required: true 
  },
  tipo: { 
    type: String, 
    required: true, 
    enum: ['SOLICITUD', 'ORDEN', 'INSUMOS', 'QC', 'ETIQUETAS', 'ACTA'] 
  },
  fileUrl: { type: String, required: true, trim: true }, // URL del documento en Cloudinary
  filePublicId: { type: String, required: true, trim: true }, // Public ID del documento en Cloudinary
  versionPlantilla: { type: String, required: true, trim: true },
  generadoPor: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  generadoEn: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true
});

DocumentSchema.index({ productionId: 1, tipo: 1 });
DocumentSchema.index({ generadoEn: -1 });

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);

