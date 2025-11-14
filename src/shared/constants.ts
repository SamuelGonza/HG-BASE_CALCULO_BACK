import dotenv from 'dotenv';
dotenv.config();

export const ALLOWED_ORIGINS = [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "http://localhost:5174"
];

export const ALLOWES_METHODS = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
];

export const GLOBAL_ENV = {
    MONGODB_URI: process.env.MONGODB_URI as string,

    PORT: process.env.PORT as string,
    JWT_SECRET: process.env.JWT_SECRET as string,

    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: process.env.REDIS_PORT as string,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,

    CLOUD_NAME: process.env.CLOUD_NAME as string,
    API_KEY_CLOUDINARY: process.env.API_KEY_CLOUDINARY as string,
    API_SECRET_CLOUDINARY: process.env.API_SECRET_CLOUDINARY as string,

    FRONT_DOMAIN: process.env.FRONT_DOMAIN as string,
    ROUTER_SUBFIJE: process.env.ROUTER_SUBFIJE as string,
};