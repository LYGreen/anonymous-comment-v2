import { MiddlewareHandler } from "hono";
import { AMEnv, AMResponse } from "../type";

const authorization: MiddlewareHandler<AMEnv> = async (c, next) => {
    const req = c.req;
    const authorization = req.header("Authorization");
    c.set("role", authorization === `Bearer ${c.env.ADMIN_KEY}` ? "admin" : "user");
    
    await next();
}

export { authorization }
