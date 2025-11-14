import { Router } from 'express';
import { documentController } from '@/controllers/document.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { cacheMiddleware, invalidateCache } from '@/middlewares/cache.middleware';
import { UserRole } from '@/models/User.model';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @swagger
 * /documents/{productionId}:
 *   get:
 *     summary: Obtiene todos los documentos generados para una producción
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la producción
 *     responses:
 *       200:
 *         description: Lista de documentos
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
 *                     $ref: '#/components/schemas/Document'
 *       400:
 *         description: ID de producción inválido
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
// Caché: 15 minutos - Documentos de producción
router.get('/:productionId', cacheMiddleware(900, 'documents'), documentController.getByProduction.bind(documentController));

/**
 * @swagger
 * /documents/{productionId}/{tipo}:
 *   post:
 *     summary: Genera un documento específico para una producción
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la producción
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SOLICITUD, ORDEN, INSUMOS, QC, ETIQUETAS, ACTA]
 *         description: Tipo de documento a generar
 *     responses:
 *       200:
 *         description: Documento generado exitosamente
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
 *                   example: "Documento SOLICITUD generado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileUrl:
 *                       type: string
 *                       example: "/documents/solicitud-507f1f77bcf86cd799439011.pdf"
 *                     tipo:
 *                       type: string
 *                       example: "SOLICITUD"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               idInvalido:
 *                 value:
 *                   ok: false
 *                   error: "ID de producción inválido"
 *               tipoInvalido:
 *                 value:
 *                   ok: false
 *                   error: "Tipo de documento inválido"
 *               estadoInvalido:
 *                 value:
 *                   ok: false
 *                   error: "La producción debe estar calculada para generar la orden"
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos (requiere rol AUXILIAR, QUIMICO o COORDINADOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Invalidar caché al generar documento
router.post(
  '/:productionId/:tipo',
  authorize('AUXILIAR', 'QUIMICO', 'COORDINADOR'),
  invalidateCache('documents', (req) => req.params.productionId),
  documentController.generate.bind(documentController)
);

/**
 * @swagger
 * /documents/{productionId}/generate-all:
 *   post:
 *     summary: Genera todos los documentos disponibles según el estado de la producción
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la producción
 *     responses:
 *       200:
 *         description: Documentos generados
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
 *                   example: "Documentos generados"
 *                 data:
 *                   type: object
 *                   properties:
 *                     SOLICITUD:
 *                       type: string
 *                       nullable: true
 *                       example: "/documents/solicitud-507f1f77bcf86cd799439011.pdf"
 *                     ORDEN:
 *                       type: string
 *                       nullable: true
 *                       example: "/documents/orden-507f1f77bcf86cd799439011.pdf"
 *                     INSUMOS:
 *                       type: string
 *                       nullable: true
 *                       example: "/documents/insumos-507f1f77bcf86cd799439011.pdf"
 *                     QC:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     ETIQUETAS:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     ACTA:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: ID de producción inválido
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
 *         description: Sin permisos (requiere rol AUXILIAR, QUIMICO o COORDINADOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Invalidar caché al generar todos los documentos
router.post(
  '/:productionId/generate-all',
  authorize('AUXILIAR', 'QUIMICO', 'COORDINADOR'),
  invalidateCache('documents', (req) => req.params.productionId),
  documentController.generateAll.bind(documentController)
);

export default router;
