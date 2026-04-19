import { Handler } from "hono";
import { AMComment, AMContext, AMResponse } from "../type";

export const getComments: Handler<AMContext> = async (c) => {
    const bt = c.req.query("bt");
    try {
        interface AMVComment extends AMComment { 
            quoted_user_id?: string; 
            quoted_content?: string;
            quoted_image_url?: string;
            quoted_created_at?: string;
            quoted_quoted_id?: number;
            quoted_role?: 'user' | 'admin'
        }

        const sql = `
            SELECT * FROM v_mixed_comments
            ${bt ? `WHERE id < ?` : ""}
            ORDER BY id DESC
            LIMIT 10
        `
        
        const stmt = bt ? c.env.DB.prepare(sql).bind(bt) : c.env.DB.prepare(sql);

        const { results }: { results: AMVComment[] } = await stmt.all<AMVComment>();

        return c.json<AMResponse>({
            status: 200,
            message: "OK",
            data: results.reverse()
        });
    } catch (err) {
        return c.json<AMResponse>({
            status: 500,
            message: "Internal Server Error",
            data: {}
        })
    }
};
