import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser, UserRole } from '@/models/User.model';
import { ResponseError } from '@/utils/erros';
import { GLOBAL_ENV } from '@/shared/constants';
import { cloudinaryService } from '@/services/cloudinary/cloudinary.service';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  rolSistema: UserRole;
}

/**
 * Servicio de Autenticación
 * Maneja registro, login, y generación de tokens JWT
 */
export class AuthService {
  private readonly JWT_SECRET = GLOBAL_ENV.JWT_SECRET;
  private readonly JWT_EXPIRES_IN = '24h';

  /**
   * Registra un nuevo usuario
   */
  async register(
    username: string,
    nombre: string,
    tipoUsuario: string,
    cargo: string,
    identificacion: string,
    password: string,
    rolSistema: UserRole,
    tarjetaProfesional?: string,
    firma?: string,
    esInterpretacion?: boolean,
    esProduccion?: boolean,
    esCalidad?: boolean
  ): Promise<IUser> {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username: username.toUpperCase() });
    if (existingUser) {
      throw new ResponseError(400, 'El username ya está registrado');
    }

    // Verificar si la identificación ya existe
    const existingId = await User.findOne({ identificacion });
    if (existingId) {
      throw new ResponseError(400, 'La identificación ya está registrada');
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    // Subir firma a Cloudinary si se proporciona
    let firmaUrl: string | undefined;
    let firmaPublicId: string | undefined;

    if (firma) {
      try {
        // Si la firma viene como base64, subirla a Cloudinary
        const publicId = `firmas/${username.toUpperCase()}_${identificacion.replace(/\./g, '_')}`;
        const uploadResult = await cloudinaryService.uploadSignature(firma, 'firmas', publicId);
        firmaUrl = uploadResult.secure_url;
        firmaPublicId = uploadResult.public_id;
      } catch (error) {
        console.error('Error al subir firma a Cloudinary:', error);
        // Si falla la subida, no bloquear el registro pero registrar el error
        throw new ResponseError(500, 'Error al subir la firma a Cloudinary');
      }
    }

    // Crear usuario
    const user = await User.create({
      username: username.toUpperCase(),
      nombre,
      tipoUsuario,
      cargo,
      identificacion,
      tarjetaProfesional,
      firmaUrl,
      firmaPublicId,
      hashPassword,
      rolSistema,
      activo: true,
      esInterpretacion: esInterpretacion || false,
      esProduccion: esProduccion || false,
      esCalidad: esCalidad || false
    });

    return user;
  }

  /**
   * Autentica un usuario y genera token JWT
   */
  async login(username: string, password: string): Promise<{ user: IUser; token: string }> {
    // Buscar usuario
    const user = await User.findOne({ username: username.toUpperCase() });
    if (!user) {
      throw new ResponseError(401, 'Credenciales inválidas');
    }

    // Verificar si está activo
    if (!user.activo) {
      throw new ResponseError(403, 'Usuario inactivo');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.hashPassword);
    if (!isPasswordValid) {
      throw new ResponseError(401, 'Credenciales inválidas');
    }

    // Generar token JWT
    const payload: AuthTokenPayload = {
      userId: (user._id as Types.ObjectId).toString(),
      username: user.username,
      rolSistema: user.rolSistema
    };

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });

    return { user, token };
  }

  /**
   * Verifica y decodifica un token JWT
   */
  verifyToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthTokenPayload;
      return decoded;
    } catch (error) {
      throw new ResponseError(401, 'Token inválido o expirado');
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(userId: Types.ObjectId): Promise<IUser | null> {
    return await User.findById(userId);
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(
    userId: Types.ObjectId,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ResponseError(404, 'Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.hashPassword);
    if (!isPasswordValid) {
      throw new ResponseError(400, 'Contraseña actual incorrecta');
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    user.hashPassword = hashPassword;
    await user.save();
  }
}

export const authService = new AuthService();

