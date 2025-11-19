import { Types } from 'mongoose';
import dayjs from 'dayjs';
import { Production, IProduction, IMezcla, LineaProduccion } from '@/models/Production.model';
import { domainValidationService } from '@/services/validation/domainValidation.service';
import { calculationEngineService } from '@/services/calculation/calculationEngine.service';
import { productionWorkflowService } from '@/services/workflow/productionWorkflow.service';
import { auditService } from '@/services/workflow/audit.service';
import { ResponseError } from '@/utils/erros';
import { Medicine, IMedicine } from '@/models/Medicine.model';
import { Vehicle, IVehicle } from '@/models/Vehicle.model';
import { Container, IContainer } from '@/models/Container.model';
import { Stability } from '@/models/Stability.model';
import { User, IUser } from '@/models/User.model';

export interface CreateMezclaDTO {
  paciente: {
    nombre: string;
    documento: string;
    aseguradora: string;
    diagnostico: string;
  };
  medicamentoId: string;
  vehiculoId: string;
  envaseId: string;
  dosisPrescrita: number;
  unidadDosis: string;
  cantidadMezclas?: number; // Cantidad de mezclas para este paciente/medicamento
}

export interface CreateProductionDTO {
  lineaProduccion: LineaProduccion;
  fechaProduccion?: Date;
  qfInterpretacion?: string;
  qfProduccion?: string;
  qfCalidad?: string;
  mezclas: CreateMezclaDTO[]; // Array de mezclas a crear
}

/**
 * Servicio principal de Producciones
 * Orquesta la creación, validación, cálculo y gestión de órdenes de producción
 */
export class ProductionService {
  /**
   * Genera un código único para la orden de producción
   */
  private generateProductionCode(): string {
    const now = dayjs();
    const year = now.format('YYYY');
    const month = now.format('MM');
    const day = now.format('DD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `PROD-${year}${month}${day}-${random}`;
  }

  /**
   * Genera un lote de mezcla único
   */
  private generateLoteMezcla(lineaProduccion: LineaProduccion, fechaProduccion: Date): string {
    const now = fechaProduccion ? dayjs(fechaProduccion) : dayjs();
    const year = now.format('YY');
    const month = now.format('MM');
    const day = now.format('DD');
    const hour = now.format('HH');
    const minute = now.format('mm');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    const lineaCode = lineaProduccion === 'ONCO' ? 'ON' : 'ET';
    return `HG${year}${month}${day}-${lineaCode}-${random}`;
  }

  /**
   * Crea una nueva orden de producción con múltiples mezclas
   */
  async createProduction(
    data: CreateProductionDTO,
    userId: Types.ObjectId
  ): Promise<IProduction> {
    if (!data.mezclas || data.mezclas.length === 0) {
      throw new ResponseError(400, 'Debe incluir al menos una mezcla');
    }

    const mezclas: IMezcla[] = [];
    const fechaProduccion = data.fechaProduccion ? dayjs(data.fechaProduccion).toDate() : dayjs().toDate();

    // Procesar cada mezcla
    for (const mezclaData of data.mezclas) {
      // Obtener medicamento
      const medicamento = await Medicine.findById(mezclaData.medicamentoId);
      if (!medicamento) {
        throw new ResponseError(404, `Medicamento ${mezclaData.medicamentoId} no encontrado`);
      }

      // Obtener vehículo
      const vehiculo = await Vehicle.findById(mezclaData.vehiculoId);
      if (!vehiculo) {
        throw new ResponseError(404, `Vehículo ${mezclaData.vehiculoId} no encontrado`);
      }

      // Obtener envase
      const envase = await Container.findById(mezclaData.envaseId);
      if (!envase) {
        throw new ResponseError(404, `Envase ${mezclaData.envaseId} no encontrado`);
      }

      // Buscar estabilidad para obtener laboratorioId
      const estabilidad = await Stability.findOne({
        medicamentoId: new Types.ObjectId(mezclaData.medicamentoId),
        vehiculoId: new Types.ObjectId(mezclaData.vehiculoId),
        envaseId: new Types.ObjectId(mezclaData.envaseId)
      });

      if (!estabilidad) {
        throw new ResponseError(404, 'No se encontró estabilidad para esta combinación de medicamento, vehículo y envase');
      }

      // Validar dominio farmacéutico
      await domainValidationService.validateCompleteDomain({
        medicamentoId: new Types.ObjectId(mezclaData.medicamentoId),
        laboratorioId: estabilidad.laboratorioId,
        vehiculoId: new Types.ObjectId(mezclaData.vehiculoId),
        envaseId: new Types.ObjectId(mezclaData.envaseId),
        lineaProductiva: data.lineaProduccion
      });

      // Calcular resultados para esta mezcla
      const resultados = await calculationEngineService.calculateFromDatabase(
        new Types.ObjectId(mezclaData.medicamentoId),
        estabilidad.laboratorioId,
        new Types.ObjectId(mezclaData.vehiculoId),
        new Types.ObjectId(mezclaData.envaseId),
        mezclaData.dosisPrescrita,
        mezclaData.unidadDosis
      );

      // Calcular volúmenes detallados
      const volumenVehiculo = resultados.volumenFinal - resultados.volumenExtraer;
      const volumenMezcla = resultados.volumenExtraer;
      const volumenTotal = resultados.volumenFinal;

      // Generar lote de mezcla
      const loteMezcla = this.generateLoteMezcla(data.lineaProduccion, fechaProduccion);

      // Calcular fecha de vencimiento (por defecto 24 horas después de producción)
      const fechaVencimiento = dayjs(fechaProduccion).add(24, 'hours').toDate();

      // Crear objeto mezcla
      const mezcla: IMezcla = {
        paciente: mezclaData.paciente,
        medicamento: {
          id: medicamento._id as Types.ObjectId,
          nombre: medicamento.nombre,
          concentracion: medicamento.concentracion,
          viaAdministracion: medicamento.viaAdministracion,
          dosisPrescrita: mezclaData.dosisPrescrita,
          unidadDosis: mezclaData.unidadDosis
        },
        envase: {
          id: envase._id as Types.ObjectId,
          tipo: envase.tipo,
          nombre: envase.tipo // El nombre es el mismo que el tipo
        },
        vehiculo: {
          id: vehiculo._id as Types.ObjectId,
          nombre: vehiculo.nombre,
          volumenVehiculo: volumenVehiculo
        },
        calculos: {
          volumenExtraer: resultados.volumenExtraer,
          volumenMezcla: volumenMezcla,
          volumenVehiculo: volumenVehiculo,
          volumenTotal: volumenTotal,
          unidadesInsumo: resultados.unidadesInsumo
        },
        loteMezcla: loteMezcla,
        fechaVencimiento: fechaVencimiento,
        cantidadMezclas: mezclaData.cantidadMezclas || 1
      };

      mezclas.push(mezcla);
    }

    // Asignar QF automáticamente si no se proporcionaron
    let qfInterpretacion = data.qfInterpretacion;
    let qfProduccion = data.qfProduccion;
    let qfCalidad = data.qfCalidad;

    if (!qfInterpretacion || !qfProduccion || !qfCalidad) {
      // Buscar usuarios con funciones farmacéuticas
      const qfInterp = await User.findOne({ esInterpretacion: true, activo: true });
      const qfProd = await User.findOne({ esProduccion: true, activo: true });
      const qfQual = await User.findOne({ esCalidad: true, activo: true });

      if (!qfInterpretacion && qfInterp) {
        qfInterpretacion = qfInterp.nombre;
      }
      if (!qfProduccion && qfProd) {
        qfProduccion = qfProd.nombre;
      }
      if (!qfCalidad && qfQual) {
        qfCalidad = qfQual.nombre;
      }
    }

    // Generar código único
    const codigo = this.generateProductionCode();

    // Crear orden de producción
    const production = await Production.create({
      codigo,
      fechaProduccion: fechaProduccion,
      qfInterpretacion: qfInterpretacion,
      qfProduccion: qfProduccion,
      qfCalidad: qfCalidad,
      lineaProduccion: data.lineaProduccion,
      cantidadMezclas: mezclas.length,
      mezclas: mezclas,
      estado: 'CREADO',
      versionMotorCalculo: calculationEngineService.getVersion(),
      timestamps: {
        creado: dayjs().toDate()
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
        cantidadMezclas: mezclas.length,
        lineaProduccion: data.lineaProduccion
      },
      userId
    );

    const populatedProduction = await Production.findById(production._id)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo identificacion tarjetaProfesional rolSistema');
    
    if (!populatedProduction) {
      throw new ResponseError(500, 'Error al obtener la producción creada');
    }

    return populatedProduction;
  }

  /**
   * Valida y calcula una orden de producción
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

    // Validar todas las mezclas
    for (const mezcla of production.mezclas) {
      const medicamento = await Medicine.findById(mezcla.medicamento.id);
      if (!medicamento) {
        throw new ResponseError(404, `Medicamento ${mezcla.medicamento.id} no encontrado`);
      }

      // Buscar estabilidad para obtener laboratorioId
      const estabilidad = await Stability.findOne({
        medicamentoId: mezcla.medicamento.id,
        vehiculoId: mezcla.vehiculo.id,
        envaseId: mezcla.envase.id
      });

      if (!estabilidad) {
        throw new ResponseError(404, 'No se encontró estabilidad para esta combinación de medicamento, vehículo y envase');
      }

      await domainValidationService.validateCompleteDomain({
        medicamentoId: mezcla.medicamento.id,
        laboratorioId: estabilidad.laboratorioId,
        vehiculoId: mezcla.vehiculo.id,
        envaseId: mezcla.envase.id,
        lineaProductiva: production.lineaProduccion
      });
    }

    // Transicionar a VALIDADO si está en CREADO
    if (production.estado === 'CREADO') {
      await productionWorkflowService.validateProduction(
        productionId,
        userId,
        userRole as any
      );
    }

    // Transicionar a CALCULADO
    await productionWorkflowService.calculateProduction(
      productionId,
      userId,
      userRole as any
    );

    const finalProduction = await Production.findById(productionId)
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo identificacion tarjetaProfesional rolSistema');
    
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
      .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'username nombre tipoUsuario cargo identificacion tarjetaProfesional rolSistema');
  }

  /**
   * Obtiene todas las producciones con filtros opcionales
   */
  async getProductions(filters: {
    estado?: string;
    lineaProduccion?: LineaProduccion;
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
    skip?: number;
  } = {}) {
    const query: any = {};

    if (filters.estado) {
      query.estado = filters.estado;
    }

    if (filters.lineaProduccion) {
      query.lineaProduccion = filters.lineaProduccion;
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
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('creadoPor validadoPor calculadoPor programadoPor producidoPor qcPor etiquetadoPor finalizadoPor', 'nombre email rol'),
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
