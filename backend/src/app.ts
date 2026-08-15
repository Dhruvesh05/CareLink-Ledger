import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { randomUUID } from "crypto";

import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { sendError, sendSuccess } from "./utils/response";

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

app.use((_, res, next) => {
    res.setHeader("x-request-id", randomUUID());
    next();
});

/* ==========================================================
   API ROUTES
========================================================== */

app.use("/api", routes);

/* ==========================================================
   HEALTH CHECK
========================================================== */

app.get("/health", (_, res) => {
    return sendSuccess(res, "CareLink Backend Running", {
        service: "backend"
    });

});

/* ==========================================================
   ROOT
========================================================== */

app.get("/", (_, res) => {
    return sendSuccess(res, "CareLink Backend Running", {
        project: "CareLink Ledger",
        version: "1.0.0",
        status: "Running"
    });

});

/* ==========================================================
   404 HANDLER
========================================================== */

app.use((req, res) => {
    return sendError(
        res,
        `Route '${req.method} ${req.originalUrl}' not found`,
        404
    );

});

/* ==========================================================
   GLOBAL ERROR HANDLER
========================================================== */

app.use(errorHandler);

export default app;