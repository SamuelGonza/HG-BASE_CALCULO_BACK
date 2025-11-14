import { GLOBAL_ENV } from "@/shared/constants";
import { ResponseError } from "@/utils/erros";
import mongoose from "mongoose";   

export class InitiConnection {
    private static instance: InitiConnection;
    private constructor() {
        this.connect();
    }

    public static getInstance(): InitiConnection {
        if (!InitiConnection.instance) {
            InitiConnection.instance = new InitiConnection();
        }
        return InitiConnection.instance;
    }

    private async connect() {

        if(!GLOBAL_ENV.MONGODB_URI) {
            throw new ResponseError(500, "MONGODB_URI is not defined");
        }

        try {
            const db = await mongoose.connect(
                GLOBAL_ENV.MONGODB_URI,
                {
                    dbName: "base_calculo_db",
                }
            );

            if(db.connection.readyState === 1) {
                console.log("Connected to MongoDB");
            }

        } catch (error) {
            console.log(error);
            if(error instanceof ResponseError) throw error;
            throw new Error(error as string);
        }
    }

    public async disconnect() {
        await mongoose.disconnect();
    }
    
}