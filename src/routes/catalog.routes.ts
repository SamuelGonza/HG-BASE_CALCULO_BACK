import { Router } from 'express';
import { catalogController } from '@/controllers/catalog.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { cacheMiddleware, invalidateCache } from '@/middlewares/cache.middleware';
import { UserRole } from '@/models/User.model';

const router: Router = Router();

/**
 * @swagger
 * /catalog/medicines:
 *   get:
 *     summary: Obtiene todos los medicamentos
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: habilitado
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado habilitado
 *       - in: query
 *         name: lineaProductiva
 *         schema:
 *           type: string
 *           enum: [ONCO, ESTERIL]
 *         description: Filtrar por línea productiva
 *     responses:
 *       200:
 *         description: Lista de medicamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Caché: 1 hora (3600 segundos) - Catálogo de medicamentos es crítico y cambia poco
router.get('/medicines', authenticate, cacheMiddleware(3600, 'medicines'), catalogController.getMedicines.bind(catalogController));

/**
 * @swagger
 * /catalog/medicines:
 *   post:
 *     summary: Crea un nuevo medicamento
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMedicineRequest'
 *     responses:
 *       201:
 *         description: Medicamento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Medicamento creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Invalidar caché al crear medicamento
router.post(
  '/medicines',
  authenticate,
  authorize('COORDINADOR'),
  invalidateCache('medicines'),
  catalogController.createMedicine.bind(catalogController)
);

/**
 * @swagger
 * /catalog/labs:
 *   get:
 *     summary: Obtiene todos los laboratorios
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: habilitado
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado habilitado
 *     responses:
 *       200:
 *         description: Lista de laboratorios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lab'
 *       401:
 *         description: No autenticado
 */
// Caché: 1 hora - Catálogo de laboratorios es crítico y cambia poco
router.get('/labs', authenticate, cacheMiddleware(3600, 'labs'), catalogController.getLabs.bind(catalogController));

/**
 * @swagger
 * /catalog/labs:
 *   post:
 *     summary: Crea un nuevo laboratorio
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLabRequest'
 *     responses:
 *       201:
 *         description: Laboratorio creado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 */
// Invalidar caché al crear laboratorio
router.post(
  '/labs',
  authenticate,
  authorize('COORDINADOR'),
  invalidateCache('labs'),
  catalogController.createLab.bind(catalogController)
);

/**
 * @swagger
 * /catalog/vehicles:
 *   get:
 *     summary: Obtiene todos los vehículos
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 */
// Caché: 1 hora - Catálogo de vehículos es crítico y cambia poco
router.get('/vehicles', authenticate, cacheMiddleware(3600, 'vehicles'), catalogController.getVehicles.bind(catalogController));

/**
 * @swagger
 * /catalog/vehicles:
 *   post:
 *     summary: Crea un nuevo vehículo
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVehicleRequest'
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 */
// Invalidar caché al crear vehículo
router.post(
  '/vehicles',
  authenticate,
  authorize('COORDINADOR'),
  invalidateCache('vehicles'),
  catalogController.createVehicle.bind(catalogController)
);

/**
 * @swagger
 * /catalog/containers:
 *   get:
 *     summary: Obtiene todos los envases
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de envases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Container'
 */
// Caché: 1 hora - Catálogo de envases es crítico y cambia poco
router.get('/containers', authenticate, cacheMiddleware(3600, 'containers'), catalogController.getContainers.bind(catalogController));

/**
 * @swagger
 * /catalog/containers:
 *   post:
 *     summary: Crea un nuevo envase
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContainerRequest'
 *     responses:
 *       201:
 *         description: Envase creado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 */
// Invalidar caché al crear envase
router.post(
  '/containers',
  authenticate,
  authorize('COORDINADOR'),
  invalidateCache('containers'),
  catalogController.createContainer.bind(catalogController)
);

/**
 * @swagger
 * /catalog/stabilities:
 *   get:
 *     summary: Obtiene estabilidades con filtros opcionales
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: medicamentoId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filtrar por ID de medicamento
 *       - in: query
 *         name: laboratorioId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filtrar por ID de laboratorio
 *       - in: query
 *         name: vehiculoId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filtrar por ID de vehículo
 *       - in: query
 *         name: envaseId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filtrar por ID de envase
 *     responses:
 *       200:
 *         description: Lista de estabilidades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stability'
 */
// Caché: 30 minutos - Estabilidades son críticas pero pueden cambiar más frecuentemente
router.get('/stabilities', authenticate, cacheMiddleware(1800, 'stabilities'), catalogController.getStabilities.bind(catalogController));

/**
 * @swagger
 * /catalog/stabilities:
 *   post:
 *     summary: Crea una nueva estabilidad
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStabilityRequest'
 *     responses:
 *       201:
 *         description: Estabilidad creada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 */
// Invalidar caché al crear estabilidad
router.post(
  '/stabilities',
  authenticate,
  authorize('COORDINADOR'),
  invalidateCache('stabilities'),
  catalogController.createStability.bind(catalogController)
);

export default router;
