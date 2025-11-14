import { Types } from 'mongoose';
import { Medicine } from '@/models/Medicine.model';
import { Stability } from '@/models/Stability.model';
import { CalculationInput, CalculationResult } from '@/contracts/types/production.types';
import { ResponseError } from '@/utils/erros';
import dayjs from 'dayjs';

/**
 * Motor de Cálculo Farmacéutico
 * Replica los cálculos de Excel de forma determinística
 * Debe ser probado con unit tests comparando resultados contra el Excel original
 */
export class CalculationEngineService {
  private readonly VERSION = '1.0.0';

  /**
   * Obtiene la versión del motor de cálculo
   */
  getVersion(): string {
    return this.VERSION;
  }

  /**
   * Convierte dosis prescrita a volumen a extraer según concentración
   * @param dosisPrescrita - Dosis prescrita en la unidad especificada
   * @param unidadDosis - Unidad de la dosis (mg, g, UI, etc.)
   * @param concentracion - Concentración del medicamento (ej: "50mg/ml", "100UI/ml")
   * @returns Volumen a extraer en ml
   */
  calculateVolumenExtraer(
    dosisPrescrita: number,
    unidadDosis: string,
    concentracion: string
  ): number {
    // Parsear concentración (formato esperado: "50mg/ml" o "100UI/ml")
    const concentracionMatch = concentracion.match(/(\d+(?:\.\d+)?)\s*(\w+)\s*\/\s*ml/i);
    
    if (!concentracionMatch) {
      throw new ResponseError(400, `Formato de concentración inválido: ${concentracion}`);
    }
    
    const concentracionValor = parseFloat(concentracionMatch[1]);
    const concentracionUnidad = concentracionMatch[2].toLowerCase();
    
    // Verificar que las unidades coincidan
    const dosisUnidad = unidadDosis.toLowerCase();
    if (dosisUnidad !== concentracionUnidad) {
      throw new ResponseError(
        400, 
        `Unidades no coinciden: dosis en ${unidadDosis}, concentración en ${concentracionUnidad}`
      );
    }
    
    // Calcular volumen: dosis / concentración
    const volumen = dosisPrescrita / concentracionValor;
    
    // Redondeo clínico seguro: redondear a 2 decimales
    return Math.round(volumen * 100) / 100;
  }

  /**
   * Calcula las unidades de insumo necesarias
   * @param volumenExtraer - Volumen a extraer en ml
   * @param volumenPresentacion - Volumen de la presentación en ml
   * @param unidadesPresentacion - Cantidad de unidades en la presentación
   * @returns Número de unidades de insumo necesarias
   */
  calculateUnidadesInsumo(
    volumenExtraer: number,
    volumenPresentacion: number,
    unidadesPresentacion: number
  ): number {
    if (volumenPresentacion <= 0) {
      throw new ResponseError(400, 'Volumen de presentación debe ser mayor a 0');
    }
    
    // Calcular cuántas unidades se necesitan
    const unidadesNecesarias = (volumenExtraer / volumenPresentacion) * unidadesPresentacion;
    
    // Redondear hacia arriba (siempre se necesita al menos una unidad completa)
    return Math.ceil(unidadesNecesarias);
  }

  /**
   * Calcula el volumen final de la mezcla
   * @param volumenExtraer - Volumen a extraer del medicamento
   * @param volumenVehiculo - Volumen del vehículo (si aplica)
   * @returns Volumen final en ml
   */
  calculateVolumenFinal(volumenExtraer: number, volumenVehiculo: number = 0): number {
    const volumenFinal = volumenExtraer + volumenVehiculo;
    
    // Redondeo clínico seguro: redondear a 2 decimales
    return Math.round(volumenFinal * 100) / 100;
  }

  /**
   * Genera un número de lote único
   * Formato: LOTE-YYYYMMDD-HHMMSS-XXX
   */
  generateLote(): string {
    const now = dayjs();
    const fecha = now.format('YYYYMMDD');
    const hora = now.format('HHmmss');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `LOTE-${fecha}-${hora}-${random}`;
  }

  /**
   * Calcula la fecha y hora de vencimiento según estabilidad
   * @param horasEstabilidad - Horas de estabilidad
   * @returns Fecha y hora de vencimiento
   */
  calculateFechaVencimiento(horasEstabilidad: number): Date {
    if (horasEstabilidad <= 0) {
      throw new ResponseError(400, 'Horas de estabilidad deben ser mayores a 0');
    }
    
    const ahora = dayjs();
    const fechaVencimiento = ahora.add(horasEstabilidad, 'hour');
    
    return fechaVencimiento.toDate();
  }

  /**
   * Ejecuta el cálculo completo farmacéutico
   * @param input - Datos de entrada para el cálculo
   * @returns Resultados del cálculo
   */
  async calculateComplete(input: CalculationInput): Promise<CalculationResult> {
    // Validar entrada
    if (input.dosisPrescrita <= 0) {
      throw new ResponseError(400, 'Dosis prescrita debe ser mayor a 0');
    }
    
    // 1. Calcular volumen a extraer
    const volumenExtraer = this.calculateVolumenExtraer(
      input.dosisPrescrita,
      input.unidadDosis,
      input.concentracion
    );
    
    // 2. Calcular unidades de insumo
    const unidadesInsumo = this.calculateUnidadesInsumo(
      volumenExtraer,
      input.volumenPresentacion,
      input.unidadesPresentacion
    );
    
    // 3. Calcular volumen final (asumiendo que el vehículo se agrega después)
    const volumenFinal = this.calculateVolumenFinal(volumenExtraer);
    
    // 4. Generar lote
    const lote = this.generateLote();
    
    // 5. Calcular fecha de vencimiento
    const fechaVencimiento = this.calculateFechaVencimiento(input.horasEstabilidad);
    
    return {
      volumenExtraer,
      volumenFinal,
      unidadesInsumo,
      lote,
      fechaVencimiento
    };
  }

  /**
   * Calcula usando datos de la base de datos
   * @param medicamentoId - ID del medicamento
   * @param laboratorioId - ID del laboratorio
   * @param vehiculoId - ID del vehículo
   * @param envaseId - ID del envase
   * @param dosisPrescrita - Dosis prescrita
   * @param unidadDosis - Unidad de la dosis
   * @returns Resultados del cálculo
   */
  async calculateFromDatabase(
    medicamentoId: Types.ObjectId,
    laboratorioId: Types.ObjectId,
    vehiculoId: Types.ObjectId,
    envaseId: Types.ObjectId,
    dosisPrescrita: number,
    unidadDosis: string
  ): Promise<CalculationResult> {
    // Obtener medicamento
    const medicamento = await Medicine.findById(medicamentoId);
    if (!medicamento) {
      throw new ResponseError(404, 'Medicamento no encontrado');
    }
    
    // Obtener estabilidad
    const estabilidad = await Stability.findOne({
      medicamentoId,
      laboratorioId,
      vehiculoId,
      envaseId
    });
    
    if (!estabilidad) {
      throw new ResponseError(404, 'Estabilidad no encontrada para esta combinación');
    }
    
    // Obtener primera presentación (se puede mejorar para seleccionar la correcta)
    const presentacion = medicamento.presentaciones[0];
    if (!presentacion) {
      throw new ResponseError(400, 'Medicamento no tiene presentaciones disponibles');
    }
    
    // Preparar input para cálculo
    const input: CalculationInput = {
      dosisPrescrita,
      unidadDosis,
      concentracion: medicamento.concentracion,
      volumenPresentacion: presentacion.volumen,
      unidadesPresentacion: presentacion.cantidad,
      horasEstabilidad: estabilidad.horasEstabilidad
    };
    
    return await this.calculateComplete(input);
  }
}

export const calculationEngineService = new CalculationEngineService();



