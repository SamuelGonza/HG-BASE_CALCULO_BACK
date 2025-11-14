import mongoose, { Schema, Document } from 'mongoose';

export interface IContainer extends Document {
  tipo: string;
  volumenMax: number;
  material: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ContainerSchema = new Schema<IContainer>({
  tipo: { type: String, required: true, trim: true, unique: true },
  volumenMax: { type: Number, required: true, min: 0 },
  material: { type: String, required: true, trim: true }
}, {
  timestamps: true
});

// tipo ya tiene índice por unique: true, no duplicar

export const Container = mongoose.model<IContainer>('Container', ContainerSchema);

