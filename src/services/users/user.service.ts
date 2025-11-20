import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { User, IUser } from '@/models/User.model';
import { ResponseError } from '@/utils/erros';
import { cloudinaryService } from '@/services/cloudinary/cloudinary.service';

/**
 * Servicio de Gestión de Usuarios
 * Maneja operaciones CRUD de usuarios
 */
export class UserService {
  /**
   * Obtiene todos los usuarios con filtros opcionales
   */
  async getUsers(filters: {
    activo?: boolean;
    rolSistema?: string;
    limit?: number;
    skip?: number;
  } = {}) {
    const query: any = {};

    if (filters.activo !== undefined) {
      query.activo = filters.activo;
    }

    if (filters.rolSistema) {
      query.rolSistema = filters.rolSistema;
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-hashPassword') // No incluir contraseña
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      User.countDocuments(query)
    ]);

    return {
      users,
      total,
      limit,
      skip
    };
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(userId: Types.ObjectId): Promise<IUser | null> {
    return await User.findById(userId).select('-hashPassword');
  }

  /**
   * Obtiene un usuario por username
   */
  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username: username.toUpperCase() }).select('-hashPassword');
  }

  /**
   * Actualiza un usuario
   */
  async updateUser(
    userId: Types.ObjectId,
    updateData: {
      nombre?: string;
      tipoUsuario?: string;
      cargo?: string;
      identificacion?: string;
      tarjetaProfesional?: string;
      rolSistema?: string;
      activo?: boolean;
      esInterpretacion?: boolean;
      esProduccion?: boolean;
      esCalidad?: boolean;
      firma?: string; // Base64 de la firma
    }
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ResponseError(404, 'Usuario no encontrado');
    }

    // Si se proporciona nueva firma, subirla a Cloudinary
    if (updateData.firma) {
      try {
        // Eliminar firma anterior si existe
        if (user.firmaPublicId) {
          await cloudinaryService.deleteFile(user.firmaPublicId, 'image');
        }

        // Subir nueva firma
        const publicId = `firmas/${user.username}_${user.identificacion.replace(/\./g, '_')}`;
        const uploadResult = await cloudinaryService.uploadSignature(updateData.firma, 'firmas', publicId);
        
        updateData = {
          ...updateData,
          firmaUrl: uploadResult.secure_url,
          firmaPublicId: uploadResult.public_id
        } as any;

        // Eliminar la firma base64 del objeto de actualización
        delete updateData.firma;
      } catch (error) {
        console.error('Error al actualizar firma:', error);
        throw new ResponseError(500, 'Error al actualizar la firma');
      }
    }

    // Validar identificación única si se está actualizando
    if (updateData.identificacion && updateData.identificacion !== user.identificacion) {
      const existingUser = await User.findOne({ identificacion: updateData.identificacion });
      if (existingUser) {
        throw new ResponseError(400, 'Ya existe un usuario con esta identificación');
      }
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-hashPassword');

    if (!updatedUser) {
      throw new ResponseError(500, 'Error al actualizar el usuario');
    }

    return updatedUser;
  }

  /**
   * Cambia la contraseña de un usuario (solo para administrador)
   */
  async changeUserPassword(
    userId: Types.ObjectId,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ResponseError(404, 'Usuario no encontrado');
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.findByIdAndUpdate(userId, { hashPassword });
  }

  /**
   * Desactiva un usuario (soft delete)
   */
  async deactivateUser(userId: Types.ObjectId): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { activo: false },
      { new: true }
    ).select('-hashPassword');

    if (!user) {
      throw new ResponseError(404, 'Usuario no encontrado');
    }

    return user;
  }

  /**
   * Activa un usuario
   */
  async activateUser(userId: Types.ObjectId): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { activo: true },
      { new: true }
    ).select('-hashPassword');

    if (!user) {
      throw new ResponseError(404, 'Usuario no encontrado');
    }

    return user;
  }

  /**
   * Elimina un usuario permanentemente (solo para desarrollo/testing)
   */
  async deleteUser(userId: Types.ObjectId): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ResponseError(404, 'Usuario no encontrado');
    }

    // Eliminar firma de Cloudinary si existe
    if (user.firmaPublicId) {
      try {
        await cloudinaryService.deleteFile(user.firmaPublicId, 'image');
      } catch (error) {
        console.error('Error al eliminar firma de Cloudinary:', error);
      }
    }

    await User.findByIdAndDelete(userId);
  }
}

export const userService = new UserService();

