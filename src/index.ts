import { InitiConnection } from "./config/main_db.config";
import { redisConnection } from "./config/redis.config";
import { GLOBAL_ENV } from "./shared/constants";
import server_config from "@/server_config";

class Server {
    private port: number;
    private dbConnection: InitiConnection;

    constructor() {
        this.port = parseInt(GLOBAL_ENV.PORT) || 3000;
        this.dbConnection = InitiConnection.getInstance();
        this.startServer()
    }

    private startServer(): void {   
        try {
            server_config.listen(this.port, () => {
                console.log(`🚀 Servidor corriendo en puerto ${this.port}`);
            })
        } catch (error) {
            console.log("❌ Error al iniciar el servidor", error);
            process.exit(1);
        }
    }

    public async shutDown(): Promise<void> {
        try {
            console.log("🔄 Cerrando servidor");
            await this.dbConnection.disconnect();
            await redisConnection.disconnect();
            process.exit(0);
        } catch (error) {
            console.log("❌ Error al cerrar el servidor", error);
            process.exit(1);
        }
    }
}

const server = new Server();

process.on("SIGINT", async () => {
    await server.shutDown();
});

process.on("SIGTERM", async () => {
    await server.shutDown();
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    server.shutDown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    console.error('📍 En la promesa:', promise);
    server.shutDown();
});

export default server;