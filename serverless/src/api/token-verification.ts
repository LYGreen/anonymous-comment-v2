import { Handler } from "hono";
import { AMEnv, AMResponse } from "../type";

export const tokenVerification: Handler<AMEnv> = async (c) => {
    const role = c.get("role");
    if (role === "admin") {
        return c.json<AMResponse>({
            status: 200,
            message: "OK",
            data: {}
        });
    } else {
        return c.json<AMResponse>({
            status: 401,
            message: "Unauthorized",
            data: {}
        });
    }
}
