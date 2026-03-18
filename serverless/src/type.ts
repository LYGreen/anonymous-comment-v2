import { z } from 'zod';

const amCommentSchema = z.object({
    id: z.number().optional(),
    user_id: z.string(),
    content: z.string(),
    quote_id: z.number().nullable(),
    created_at: z.date().optional(),
    role: z.enum(['user', 'admin']),
});

type AMComment = z.infer<typeof amCommentSchema>;

interface AMEnv extends Env {
    Bindings: {
        DB: D1Database,
        ADMIN_KEY: string,
        DISCORD_WEBHOOK_URL: string
        ALLOW_CORS_ORIGIN: string
    },
    Variables: {
        role: "user" | "admin",
    }
}

interface AMBody {
    data: {
        user_id: string,
        content: string,
        quote_id: number,
    }
}

interface AMResponse {
    status: number,
    message: string,
    data: object,
}

export { AMEnv, AMComment, AMBody, AMResponse };
