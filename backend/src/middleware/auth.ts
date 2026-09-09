import {
    NextFunction,
    Request,
    Response
} from "express";

import {
    AuthTokenPayload,
    verifyToken
} from "../utils/jwt";

declare global {
    namespace Express {
        interface Request {
            auth?: AuthTokenPayload;
        }
    }
}

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authorization =
        req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const [scheme, token] =
        authorization.split(" ");

    if (
        scheme !== "Bearer" ||
        !token
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization header"
        });
    }

    try {
        const payload = verifyToken(token);

        req.auth = payload;

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}
