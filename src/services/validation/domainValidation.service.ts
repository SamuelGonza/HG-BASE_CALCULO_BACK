import { Types } from 'mongoose';
import { Medicine } from '@/models/Medicine.model';
import { Lab } from '@/models/Lab.model';
import { Vehicle } from '@/models/Vehicle.model';
import { Container } from '@/models/Container.model';
import { Stability } from '@/models/Stability.model';
import { ValidationResult, ProductionValidationData } from '@/contracts/types/production.types';
import { ResponseError } from '@/utils/erros';

/**
 * Servicio de validación del dominio farmacéutico
 * Valida que todas las combinaciones sean permitidas antes de proceder con la producción
 */
export class DomainValidationService {
  /**
   * Valida que el medicamento esté habilitado para producción
   */
  async validateMedicine(medicamentoId: Types.ObjectId): Promise<ValidationResult> {
    const errors: string[] = [];
    
    const medicamento = await Medicine.findById(medicamentoId);
    
    if (!medicamento) {
      errors.push('Medicamento no encontrado');
      return { isValid: false, errors };
    }
    
    if (!medicamento.habilitado) {
      errors.push('Medicamento no habilitado para producción');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que el laboratorio esté habilitado
   */
  async validateLab(laboratorioId: Types.ObjectId): Promise<ValidationResult> {
    const errors: string[] = [];
    
    const laboratorio = await Lab.findById(laboratorioId);
    
    if (!laboratorio) {
      errors.push('Laboratorio no encontrado');
      return { isValid: false, errors };
    }
    
    if (!laboratorio.habilitado) {
      errors.push('Laboratorio no habilitado');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que el vehículo sea compatible con la línea productiva
   */
  async validateVehicle(
    vehiculoId: Types.ObjectId, 
    lineaProductiva: 'ONCO' | 'ESTERIL'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    
    const vehiculo = await Vehicle.findById(vehiculoId);
    
    if (!vehiculo) {
      errors.push('Vehículo no encontrado');
      return { isValid: false, errors };
    }
    
    if (!vehiculo.compatibleConLinea.includes(lineaProductiva)) {
      errors.push(`Vehículo no compatible con línea ${lineaProductiva}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que el envase sea compatible
   */
  async validateContainer(envaseId: Types.ObjectId): Promise<ValidationResult> {
    const errors: string[] = [];
    
    const envase = await Container.findById(envaseId);
    
    if (!envase) {
      errors.push('Envase no encontrado');
      return { isValid: false, errors };
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que exista estabilidad para la combinación medicamento + laboratorio + vehículo + envase
   */
  async validateStability(data: ProductionValidationData): Promise<ValidationResult> {
    const errors: string[] = [];
    
    const estabilidad = await Stability.findOne({
      medicamentoId: data.medicamentoId,
      laboratorioId: data.laboratorioId,
      vehiculoId: data.vehiculoId,
      envaseId: data.envaseId
    });
    
    if (!estabilidad) {
      errors.push('No existe estabilidad registrada para esta combinación de medicamento, laboratorio, vehículo y envase');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida todo el dominio farmacéutico completo
   * Si falla cualquier validación → bloquea el proceso
   */
  async validateCompleteDomain(data: ProductionValidationData): Promise<ValidationResult> {
    const allErrors: string[] = [];
    
    // Validar medicamento
    const medicamentoValidation = await this.validateMedicine(data.medicamentoId);
    if (!medicamentoValidation.isValid) {
      allErrors.push(...medicamentoValidation.errors);
    }
    
    // Validar laboratorio
    const laboratorioValidation = await this.validateLab(data.laboratorioId);
    if (!laboratorioValidation.isValid) {
      allErrors.push(...laboratorioValidation.errors);
    }
    
    // Validar vehículo
    const vehiculoValidation = await this.validateVehicle(data.vehiculoId, data.lineaProductiva);
    if (!vehiculoValidation.isValid) {
      allErrors.push(...vehiculoValidation.errors);
    }
    
    // Validar envase
    const envaseValidation = await this.validateContainer(data.envaseId);
    if (!envaseValidation.isValid) {
      allErrors.push(...envaseValidation.errors);
    }
    
    // Validar estabilidad
    const estabilidadValidation = await this.validateStability(data);
    if (!estabilidadValidation.isValid) {
      allErrors.push(...estabilidadValidation.errors);
    }
    
    if (allErrors.length > 0) {
      throw new ResponseError(400, `Validación fallida: ${allErrors.join('; ')}`);
    }
    
    return {
      isValid: true,
      errors: []
    };
  }
}

export const domainValidationService = new DomainValidationService();



