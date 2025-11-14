import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Medicine } from '@/models/Medicine.model';
import { Lab } from '@/models/Lab.model';
import { Vehicle } from '@/models/Vehicle.model';
import { Container } from '@/models/Container.model';
import { Stability } from '@/models/Stability.model';
import { ResponseError } from '@/utils/erros';

export class CatalogController {
  /**
   * Obtener todos los medicamentos
   * GET /api/catalog/medicines
   */
  async getMedicines(req: Request, res: Response): Promise<void> {
    try {
      const { habilitado, lineaProductiva } = req.query;
      const query: any = {};

      if (habilitado !== undefined) {
        query.habilitado = habilitado === 'true';
      }

      if (lineaProductiva) {
        query.lineaProductiva = lineaProductiva;
      }

      const medicines = await Medicine.find(query).sort({ nombre: 1 });

      res.status(200).json({
        ok: true,
        data: medicines
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener medicamentos'
      });
    }
  }

  /**
   * Crear medicamento
   * POST /api/catalog/medicines
   */
  async createMedicine(req: Request, res: Response): Promise<void> {
    try {
      const medicine = await Medicine.create(req.body);

      res.status(201).json({
        ok: true,
        message: 'Medicamento creado exitosamente',
        data: medicine
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al crear medicamento'
      });
    }
  }

  /**
   * Obtener todos los laboratorios
   * GET /api/catalog/labs
   */
  async getLabs(req: Request, res: Response): Promise<void> {
    try {
      const { habilitado } = req.query;
      const query: any = {};

      if (habilitado !== undefined) {
        query.habilitado = habilitado === 'true';
      }

      const labs = await Lab.find(query).sort({ nombre: 1 });

      res.status(200).json({
        ok: true,
        data: labs
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener laboratorios'
      });
    }
  }

  /**
   * Crear laboratorio
   * POST /api/catalog/labs
   */
  async createLab(req: Request, res: Response): Promise<void> {
    try {
      const lab = await Lab.create(req.body);

      res.status(201).json({
        ok: true,
        message: 'Laboratorio creado exitosamente',
        data: lab
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al crear laboratorio'
      });
    }
  }

  /**
   * Obtener todos los vehículos
   * GET /api/catalog/vehicles
   */
  async getVehicles(req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await Vehicle.find().sort({ nombre: 1 });

      res.status(200).json({
        ok: true,
        data: vehicles
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener vehículos'
      });
    }
  }

  /**
   * Crear vehículo
   * POST /api/catalog/vehicles
   */
  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicle = await Vehicle.create(req.body);

      res.status(201).json({
        ok: true,
        message: 'Vehículo creado exitosamente',
        data: vehicle
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al crear vehículo'
      });
    }
  }

  /**
   * Obtener todos los envases
   * GET /api/catalog/containers
   */
  async getContainers(req: Request, res: Response): Promise<void> {
    try {
      const containers = await Container.find().sort({ tipo: 1 });

      res.status(200).json({
        ok: true,
        data: containers
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener envases'
      });
    }
  }

  /**
   * Crear envase
   * POST /api/catalog/containers
   */
  async createContainer(req: Request, res: Response): Promise<void> {
    try {
      const container = await Container.create(req.body);

      res.status(201).json({
        ok: true,
        message: 'Envase creado exitosamente',
        data: container
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al crear envase'
      });
    }
  }

  /**
   * Obtener estabilidades
   * GET /api/catalog/stabilities
   */
  async getStabilities(req: Request, res: Response): Promise<void> {
    try {
      const { medicamentoId, laboratorioId, vehiculoId, envaseId } = req.query;
      const query: any = {};

      if (medicamentoId) {
        query.medicamentoId = new Types.ObjectId(medicamentoId as string);
      }

      if (laboratorioId) {
        query.laboratorioId = new Types.ObjectId(laboratorioId as string);
      }

      if (vehiculoId) {
        query.vehiculoId = new Types.ObjectId(vehiculoId as string);
      }

      if (envaseId) {
        query.envaseId = new Types.ObjectId(envaseId as string);
      }

      const stabilities = await Stability.find(query)
        .populate('medicamentoId laboratorioId vehiculoId envaseId');

      res.status(200).json({
        ok: true,
        data: stabilities
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener estabilidades'
      });
    }
  }

  /**
   * Crear estabilidad
   * POST /api/catalog/stabilities
   */
  async createStability(req: Request, res: Response): Promise<void> {
    try {
      const stability = await Stability.create(req.body);

      res.status(201).json({
        ok: true,
        message: 'Estabilidad creada exitosamente',
        data: stability
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al crear estabilidad'
      });
    }
  }
}

export const catalogController = new CatalogController();



