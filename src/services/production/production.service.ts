import { Types } from 'mongoose';
import { Production, IProduction } from '@/models/Production.model';
import { domainValidationService } from '@/services/validation/domainValidation.service';
import { calculationEngineService } from '@/services/calculation/calculationEngine.service';
import { productionWorkflowService } from '@/services/workflow/productionWorkflow.service';
import { auditService } from '@/services/workflow/audit.service';
import { ResponseError } from '@/utils/erros';
import { Medicine } from '@/models/Medicine.model';

export interface CreateProductionDTO {
  paciente: {
    nombre: string;
    documento: string;
    edad: number;
    peso?: number;
  };
  medicamentoId: string;
  laboratorioId: string;
  vehiculoId: string;
  envaseId: string;
  dosisPrescrita: number;
  unidadDosis: string;
}

/**
 * Servicio principal de Producciones
 * Orquesta la creación, validación, cálculo y gestión de producciones
 */
export class ProductionService {
  /**
   * Genera un código único para la producción
   */
  private generateProductionCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `PROD-${year}${month}${day}-${random}`;
  }

  /**
   * Crea una nueva producción
   */
  async createProduction(
    data: CreateProductionDTO,
    userId: Types.ObjectId
  ): Promise<IProduction> {
    // Obtener medicamento para validar línea productiva
    const medicamento = await Medicine.findById(data.medicamentoId);
    if (!medicamento) {
      throw new ResponseError(404, 'Medicamento no encontrado');
    }

    // Validar dominio farmacéutico completo
    await domainValidationService.validateCompleteDomain({
      medicamentoId: new Types.ObjectId(data.medicamentoId),
      laboratorioId: new Types.ObjectId(data.laboratorioId),
      vehiculoId: new Types.ObjectId(data.vehiculoId),
      envaseId: new Types.ObjectId(data.envaseId),
      lineaProductiva: medicamento.lineaProductiva
    });

    // Generar código único
    const codigo = this.generateProductionCode();

    // Crear producción
    const production = await Production.create({
      codigo,
      paciente: data.paciente,
      medicamentoId: new Types.ObjectId(data.medicamentoId),
      laboratorioId: new Types.ObjectId(data.laboratorioId),
      vehiculoId: new Types.ObjectId(data.vehiculoId),
      envaseId: new Types.ObjectId(data.envaseId),
      dosisPrescrita: data.dosisPrescrita,
      unidadDosis: data.unidadDosis,
      estado: 'CREADO',
      versionMotorCalculo: calculationEngineService.getVersion(),
      timestamps: {
        creado: new Date()
      },
      creadoPor: userId
    });

    // Registrar en auditoría
    await auditService.logAction(
      'Production',
      production._id as Types.ObjectId,
      'CREATE',
      {
        codigo: production.codigo,
        medicamentoId: data.medicamentoId,
        paciente: data.paciente.nombre
      },
      userId
    );

    const populatedProduction = await Production.findById(production._id)
      .populate('medicamentoId laboratorioId vehiculoId envaseId creadoPor');
    
    if (!populatedProduction) {
      throw new ResponseError(500, 'Error al obtener la producción creada');
    }

    return populatedProduction;
  }

  /**
   * Valida y calcula una producción
   */
  async validateAndCalculate(
    productionId: Types.ObjectId,
    userId: Types.ObjectId,
    userRole: string
  ): Promise<IProduction> {
    const production = await Production.findById(productionId);
    if (!production) {
      throw new ResponseError(404, 'Producción no encontrada');
    }

    // Validar dominio si aún no está validado
    if (production.estado === 'CREADO') {
      const medicamento = await Medicine.findById(production.medicamentoId);
      if (!medicamento) {
        throw new ResponseError(404, 'Medicamento no encontrado');
      }

      await domainValidationService.validateCompleteDomain({
        medicamentoId: production.medicamentoId,
        laboratorioId: production.laboratorioId!,
        vehiculoId: production.vehiculoId!,
        envaseId: production.envaseId!,
        lineaProductiva: medicamento.lineaProductiva
      });

      // Transicionar a VALIDADO
      await productionWorkflowService.validateProduction(
        productionId,
        userId,
        userRole as any
      );
    }

    // Calcular resultados
    const resultados = await calculationEngineService.calculateFromDatabase(
      production.medicamentoId,
      production.laboratorioId!,
      production.vehiculoId!,
      production.envaseId!,
      production.dosisPrescrita,
      production.unidadDosis
    );

    // Actualizar producción con resultados y transicionar a CALCULADO
    const updatedProduction = await Production.findByIdAndUpdate(
      productionId,
      {
        $set: {
          resultadosCalculo: resultados,
          versionMotorCalculo: calculationEngineService.getVersion()
        }
      },
      { new: true }
    );

    if (!updatedProduction) {
      throw new ResponseError(500, 'Error al actualizar la producción');
    }

    // Transicionar a CALCULADO
    await productionWorkflowService.calculateProduction(
      productionId,
      userId,
      userRole as any
    );

    const finalProduction = await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId creadoPor');
    
    if (!finalProduction) {
      throw new ResponseError(500, 'Error al obtener la producción actualizada');
    }

    return finalProduction;
  }

  /**
   * Obtiene una producción por ID
   */
  async getProductionById(productionId: Types.ObjectId): Promise<IProduction | null> {
    return await Production.findById(productionId)
      .populate('medicamentoId laboratorioId vehiculoId envaseId')
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'nombre email rol');
  }

  /**
   * Obtiene todas las producciones con filtros opcionales
   */
  async getProductions(filters: {
    estado?: string;
    medicamentoId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
    skip?: number;
  } = {}) {
    const query: any = {};

    if (filters.estado) {
      query.estado = filters.estado;
    }

    if (filters.medicamentoId) {
      query.medicamentoId = new Types.ObjectId(filters.medicamentoId);
    }

    if (filters.fechaDesde || filters.fechaHasta) {
      query.createdAt = {};
      if (filters.fechaDesde) {
        query.createdAt.$gte = filters.fechaDesde;
      }
      if (filters.fechaHasta) {
        query.createdAt.$lte = filters.fechaHasta;
      }
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [productions, total] = await Promise.all([
      Production.find(query)
        .populate('medicamentoId laboratorioId vehiculoId envaseId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Production.countDocuments(query)
    ]);

    return {
      productions,
      total,
      limit,
      skip
    };
  }
}

export const productionService = new ProductionService();

