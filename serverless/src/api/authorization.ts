import { MiddlewareHandler } from "hono";
import { AMContext, AMResponse } from "../type";

export const authorization: MiddlewareHandler<AMContext> = async (c, next) => {
    const req = c.req;
    const authorization = req.header("Authorization");
    c.set("role", authorization === `Bearer ${c.env.ADMIN_KEY}` ? "admin" : "user");
    
    await next();
}
