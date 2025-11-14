import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser, UserRole } from '@/models/User.model';
import { ResponseError } from '@/utils/erros';
import { GLOBAL_ENV } from '@/shared/constants';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  rol: UserRole;
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
    nombre: string,
    email: string,
    password: string,
    rol: UserRole
  ): Promise<IUser> {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ResponseError(400, 'El email ya está registrado');
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await User.create({
      nombre,
      email: email.toLowerCase(),
      hashPassword,
      rol,
      activo: true
    });

    return user;
  }

  /**
   * Autentica un usuario y genera token JWT
   */
  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });
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
      email: user.email,
      rol: user.rol
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

