import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  nombre: string;
  compatibleConLinea: ('ONCO' | 'ESTERIL')[];
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  nombre: { type: String, required: true, trim: true, unique: true },
  compatibleConLinea: { 
    type: [String], 
    required: true, 
    enum: ['ONCO', 'ESTERIL'] 
  }
}, {
  timestamps: true
});

// nombre ya tiene índice por unique: true, no duplicar

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);

