import cors, { CorsOptions } from 'cors';
import express, { Application, Request, Response } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { GLOBAL_ENV, ALLOWED_ORIGINS, ALLOWES_METHODS } from '@/shared/constants';
import { swaggerSpec } from '@/docs/swagger.config';


// Importar rutas
import authRoutes from '@/routes/auth.routes';
import userRoutes from '@/routes/user.routes';
import productionRoutes from '@/routes/production.routes';
import documentRoutes from '@/routes/document.routes';
import catalogRoutes from '@/routes/catalog.routes';
import auditRoutes from '@/routes/audit.routes';


const app: Application = express();

// #======= SERVER SECURITY ======# //

const cors_options: CorsOptions = {
    methods: ALLOWES_METHODS,
    origin: ALLOWED_ORIGINS,
    credentials: true,
    optionsSuccessStatus: 204,
}

const rate_limiter = rateLimit({
    windowMs: 5 * 60 * 1000,    // 5 minutos
    max: 200,                   // 200 requests por ventana de tiempo por IP
    message: {
        ok: false,
        error: "Demasiadas peticiones desde esta IP",
        message: "Límite de 200 peticiones por 5 minutos excedido",
        retryAfter: "5 minutos"
    },
    standardHeaders: true,      // Incluir headers `RateLimit-*` en la respuesta
    legacyHeaders: false,       // Deshabilitar headers `X-RateLimit-*`
})

//  #====== MIDDLEWARES ======# //

app.set("trust proxy", false);
app.use(cors(cors_options));
app.use(rate_limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

//*  ---------HERE I LOAD ALL ENDOPOINTS

app.get(`${GLOBAL_ENV.ROUTER_SUBFIJE}/health`, // health check endpoint
    (req: Request, res: Response) => {
    res.status(200).json({
        ok: true,
        message: "IM ALIVE",
        timestamp: new Date().toISOString()
    });
});

// Swagger Documentation
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Base de Cálculo API Documentation'
}));

// Cargar rutas
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/auth`, authRoutes);
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/users`, userRoutes);
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/productions`, productionRoutes);
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/documents`, documentRoutes);
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/catalog`, catalogRoutes);
app.use(`${GLOBAL_ENV.ROUTER_SUBFIJE}/audit`, auditRoutes);

app.use((req: Request, res: Response) => { // 404 error handler
    res.status(404).json({
        ok: false,
        error: "Endpoint not found",
        message: "The endpoint you are looking for does not exist",
        timestamp: new Date().toISOString()
    });
})



export default app;