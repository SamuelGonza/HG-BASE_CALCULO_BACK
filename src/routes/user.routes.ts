import { Router } from 'express';
import { userController } from '@/controllers/user.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { cacheMiddleware, invalidateCache } from '@/middlewares/cache.middleware';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por usuarios activos o inactivos
 *       - in: query
 *         name: rolSistema
 *         schema:
 *           type: string
 *           enum: [AUXILIAR, QUIMICO, COORDINADOR, AUDITOR]
 *         description: Filtrar por rol de sistema
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
 *         description: Lista de usuarios
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
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     skip:
 *                       type: integer
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 */
router.get(
  '/',
  authorize('COORDINADOR'),
  cacheMiddleware(300, 'users'),
  userController.getAll.bind(userController)
);

/**
 * @swagger
 * /users/username/{username}:
 *   get:
 *     summary: Obtiene un usuario por username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/username/:username',
  authorize('COORDINADOR'),
  userController.getByUsername.bind(userController)
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/:id',
  authorize('COORDINADOR'),
  cacheMiddleware(600, 'user'),
  userController.getById.bind(userController)
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualiza un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "ROSA LEONOR BONETT VILA"
 *               tipoUsuario:
 *                 type: string
 *                 enum: [QUÍMICO FARMACÉUTICO, ADMINISTRADOR, INVITADO, TÉCNICO]
 *                 example: "QUÍMICO FARMACÉUTICO"
 *               cargo:
 *                 type: string
 *                 example: "DIRECTORA TÉCNICA"
 *               identificacion:
 *                 type: string
 *                 example: "43.977.097"
 *               tarjetaProfesional:
 *                 type: string
 *                 example: "43.977.097"
 *               rolSistema:
 *                 type: string
 *                 enum: [AUXILIAR, QUIMICO, COORDINADOR, AUDITOR]
 *                 example: "COORDINADOR"
 *               activo:
 *                 type: boolean
 *                 example: true
 *               esInterpretacion:
 *                 type: boolean
 *                 example: true
 *               esProduccion:
 *                 type: boolean
 *                 example: false
 *               esCalidad:
 *                 type: boolean
 *                 example: false
 *               firma:
 *                 type: string
 *                 description: Firma en base64
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
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
 *                   example: "Usuario actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id',
  authorize('COORDINADOR'),
  invalidateCache('user', (req) => req.params.id),
  userController.update.bind(userController)
);

/**
 * @swagger
 * /users/{id}/change-password:
 *   post:
 *     summary: Cambia la contraseña de un usuario (solo coordinador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
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
 *                   example: "Contraseña actualizada exitosamente"
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
  '/:id/change-password',
  authorize('COORDINADOR'),
  userController.changePassword.bind(userController)
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   post:
 *     summary: Desactiva un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
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
 *                   example: "Usuario desactivado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
  '/:id/deactivate',
  authorize('COORDINADOR'),
  invalidateCache('user', (req) => req.params.id),
  userController.deactivate.bind(userController)
);

/**
 * @swagger
 * /users/{id}/activate:
 *   post:
 *     summary: Activa un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario activado exitosamente
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
 *                   example: "Usuario activado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.post(
  '/:id/activate',
  authorize('COORDINADOR'),
  invalidateCache('user', (req) => req.params.id),
  userController.activate.bind(userController)
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina un usuario permanentemente
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
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
 *                   example: "Usuario eliminado permanentemente"
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (requiere rol COORDINADOR)
 *       404:
 *         description: Usuario no encontrado
 */
router.delete(
  '/:id',
  authorize('COORDINADOR'),
  invalidateCache('user', (req) => req.params.id),
  userController.delete.bind(userController)
);

export default router;

