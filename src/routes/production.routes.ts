import { Router } from 'express';
import { productionController } from '@/controllers/production.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { cacheMiddleware, invalidateCache } from '@/middlewares/cache.middleware';
import { UserRole } from '@/models/User.model';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @swagger
 * /productions:
 *   get:
 *     summary: Obtiene todas las producciones con filtros opcionales
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [CREADO, VALIDADO, CALCULADO, PROGRAMADO, PRODUCIDO, QC, ETIQUETADO, FINALIZADO]
 *         description: Filtrar por estado
 *       - in: query
 *         name: medicamentoId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: Filtrar por ID de medicamento
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha desde (ISO 8601)
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha hasta (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de resultados a saltar
 *     responses:
 *       200:
 *         description: Lista de producciones
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
 *                     $ref: '#/components/schemas/Production'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     skip:
 *                       type: integer
 *                       example: 0
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Caché: 5 minutos (300 segundos) - Listado de producciones es crítico
router.get('/', cacheMiddleware(300, 'productions'), productionController.getAll.bind(productionController));

/**
 * @swagger
 * /productions/{id}:
 *   get:
 *     summary: Obtiene una producción por ID
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la producción
 *     responses:
 *       200:
 *         description: Producción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Production'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Producción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Caché: 10 minutos (600 segundos) - Detalle de producción es crítico
router.get('/:id', cacheMiddleware(600, 'production'), productionController.getById.bind(productionController));

/**
 * @swagger
 * /productions:
 *   post:
 *     summary: Crea una nueva producción
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductionRequest'
 *           example:
 *             paciente:
 *               nombre: "Pedro García"
 *               documento: "12345678"
 *               edad: 45
 *               peso: 75
 *             medicamentoId: "507f1f77bcf86cd799439011"
 *             laboratorioId: "507f1f77bcf86cd799439012"
 *             vehiculoId: "507f1f77bcf86cd799439013"
 *             envaseId: "507f1f77bcf86cd799439014"
 *             dosisPrescrita: 50
 *             unidadDosis: "mg"
 *     responses:
 *       201:
 *         description: Producción creada exitosamente
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
 *                   example: "Producción creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Production'
 *       400:
 *         description: Error de validación del dominio farmacéutico
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validacionFallida:
 *                 value:
 *                   ok: false
 *                   error: "Validación fallida: Medicamento no habilitado para producción; Vehículo no compatible con línea ONCO"
 *       401:
 *         description: No autenticado
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
// Invalidar caché al crear producción
router.post(
  '/',
  authorize('AUXILIAR', 'QUIMICO', 'COORDINADOR'),
  invalidateCache('productions'),
  productionController.create.bind(productionController)
);

/**
 * @swagger
 * /productions/{id}/validate-calculate:
 *   post:
 *     summary: Valida y calcula una producción
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la producción
 *     responses:
 *       200:
 *         description: Producción validada y calculada exitosamente
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
 *                   example: "Producción validada y calculada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Production'
 *       400:
 *         description: Error de validación o cálculo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Producción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos (requiere rol QUIMICO o COORDINADOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Invalidar caché al validar/calcular (resultado del cálculo se cachea en el GET)
router.post(
  '/:id/validate-calculate',
  authorize('QUIMICO', 'COORDINADOR'),
  invalidateCache('production', (req) => req.params.id),
  productionController.validateAndCalculate.bind(productionController)
);

/**
 * @swagger
 * /productions/{id}/transition:
 *   post:
 *     summary: Transiciona una producción a un nuevo estado
 *     tags: [Productions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la producción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransitionRequest'
 *           example:
 *             estado: "VALIDADO"
 *     responses:
 *       200:
 *         description: Producción transicionada exitosamente
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
 *                   example: "Producción transicionada a VALIDADO"
 *                 data:
 *                   $ref: '#/components/schemas/Production'
 *       400:
 *         description: Error de validación de transición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               transicionInvalida:
 *                 value:
 *                   ok: false
 *                   error: "Transición no permitida: no se puede pasar de CREADO a CALCULADO"
 *               estadoRequerido:
 *                 value:
 *                   ok: false
 *                   error: "Estado requerido"
 *       403:
 *         description: Sin permisos para realizar la transición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               ok: false
 *               error: "El rol AUXILIAR no tiene permisos para realizar acciones en el estado VALIDADO"
 *       404:
 *         description: Producción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Invalidar caché al cambiar estado
router.post(
  '/:id/transition',
  authorize('AUXILIAR', 'QUIMICO', 'COORDINADOR'),
  invalidateCache('production', (req) => req.params.id),
  productionController.transition.bind(productionController)
);

export default router;
