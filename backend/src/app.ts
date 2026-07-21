import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import routes from "./routes";

const app: Express = express();

/* ==========================================================
   GLOBAL MIDDLEWARE
========================================================== */

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    morgan("dev")
);

/* ==========================================================
   API ROUTES
========================================================== */

app.use("/api", routes);

/* ==========================================================
   HEALTH CHECK
========================================================== */

app.get("/health", (_, res) => {

    return res.status(200).json({
        success: true,
        message: "CareLink Backend Running"
    });

});

/* ==========================================================
   ROOT
========================================================== */

app.get("/", (_, res) => {

    return res.status(200).json({
        success: true,
        project: "CareLink Ledger",
        version: "1.0.0",
        status: "Running"
    });

});

/* ==========================================================
   404 HANDLER
========================================================== */

app.use((req, res) => {

    return res.status(404).json({
        success: false,
        message: `Route '${req.method} ${req.originalUrl}' not found`
    });

});

/* ==========================================================
   GLOBAL ERROR HANDLER
========================================================== */

app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {

        console.error(err);

        return res.status(err.status || 500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });

    }
);

export default app;