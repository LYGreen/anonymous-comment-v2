import { Handler } from "hono";
import { AMComment, AMEnv, AMBody, AMResponse } from "../type";
import { DiscordNotification } from "../notification/discord";

const postComments: Handler<AMEnv> = async (c) => {
    const req = c.req;
    const body = await req.json() as AMBody;
    const role = c.get("role");
    
    const amComment: AMComment = {
        user_id: body.data.user_id,
        content: body.data.content,
        quote_id: body.data.quote_id ?? null,
        role: role,
    };

    const remainder = new DiscordNotification(c.env.DISCORD_WEBHOOK_URL);

    let response: AMResponse | undefined;

    try {
        const inserted =  await c.env.DB.prepare("\
            INSERT INTO comments (user_id, content, quote_id, role) \
            VALUES (?, ?, ?, ?) \
            RETURNING *"
        ).bind(
            amComment.user_id,
            amComment.content,
            amComment.quote_id,
            amComment.role,
        ).run();

        response = {
            status: 200,
            message: inserted ? "OK" : "Internal Server Error",
            data: (inserted.results as any)[0],
        }
    } catch (err) {
        response = {
            status: 500,
            message: err as any,
            data: {}
        }
    }

    if (response.status === 200) {
        await remainder.remain(amComment);
    }

    return c.json<AMResponse>(response);
};

export { postComments }
