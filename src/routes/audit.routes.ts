import { Router } from 'express';
import { auditController } from '@/controllers/audit.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { UserRole } from '@/models/User.model';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Solo AUDITOR y COORDINADOR pueden ver auditoría
router.use(authorize('AUDITOR', 'COORDINADOR'));

/**
 * @swagger
 * /audit/{entidad}/{entidadId}:
 *   get:
 *     summary: Obtiene el historial de auditoría de una entidad específica
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entidad
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la entidad. Ejemplos Production, Medicine, Document
 *         example: Production
 *       - in: path
 *         name: entidadId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la entidad
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Historial de auditoría
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
 *                     $ref: '#/components/schemas/AuditLog'
 *       400:
 *         description: ID de entidad inválido
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
 *         description: Sin permisos (requiere rol AUDITOR o COORDINADOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:entidad/:entidadId', auditController.getHistory.bind(auditController));

/**
 * @swagger
 * /audit/user/{userId}:
 *   get:
 *     summary: Obtiene todas las acciones realizadas por un usuario
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Acciones del usuario
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
 *                     $ref: '#/components/schemas/AuditLog'
 *       400:
 *         description: ID de usuario inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol AUDITOR o COORDINADOR)
 */
router.get('/user/:userId', auditController.getUserActions.bind(auditController));

/**
 * @swagger
 * /audit/entity/{entidad}:
 *   get:
 *     summary: Obtiene todas las acciones de un tipo de entidad
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entidad
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la entidad. Ejemplos Production, Medicine, Document
 *         example: Production
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Acciones por tipo de entidad
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
 *                     $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol AUDITOR o COORDINADOR)
 */
router.get('/entity/:entidad', auditController.getActionsByEntity.bind(auditController));

export default router;
