import { z } from 'zod';

const amCommentSchema = z.object({
    id: z.number().optional(),
    user_id: z.string(),
    content: z.string().optional(),
    image_url: z.string().optional(),
    quote_id: z.number().nullable(),
    created_at: z.date().optional(),
    role: z.enum(['user', 'admin']),
});

type AMComment = z.infer<typeof amCommentSchema>;

interface AMEnv extends Env {
    ADMIN_KEY: string;
    S3_ACCESS_KEY_ID: string;
    S3_SECRET_ACCESS_KEY: string;
}

interface AMContext {
    Bindings: AMEnv,
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

export { AMContext, AMComment, AMBody, AMResponse };
