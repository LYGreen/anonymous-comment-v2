import { Handler } from "hono";
import { AMComment, AMBody, AMResponse, AMContext } from "../type";
import { DiscordNotification } from "../notification/discord";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const postComments: Handler<AMContext> = async (c) => {
    const req = c.req;
    const contentType = req.header("content-type") || "";
    const remainder = new DiscordNotification(c.env.DISCORD_WEBHOOK_URL);

    if (contentType.startsWith("application/json")) {
        const body = await req.json() as AMBody;
        const role = c.get("role");
        
        const amComment: AMComment = {
            user_id: body.data.user_id,
            content: body.data.content,
            quote_id: body.data.quote_id ?? null,
            role: role,
        };

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
                message: (err as any).message,
                data: {}
            }
        }

        if (response.status === 200 && c.env.ENVIRONMENT === "production") {
            await remainder.remain(amComment);
        }
        
        return c.json<AMResponse>(response);
    } else if (contentType.startsWith('multipart/form-data')) {
        const formData = await req.formData();
        const body = JSON.parse(formData.get("data") as string) as AMBody;
        const role = c.get("role");
        const file = formData.get("file") as File | null;
        const uuid = crypto.randomUUID();
        const imgId = `${new Date().toISOString()}-${uuid}`;
        const imageUrl = `/images/${imgId}`;

        const amComment: AMComment = {
            user_id: body.data.user_id,
            content: body.data.content ?? '',
            quote_id: body.data.quote_id ?? null,
            image_url: imageUrl,
            role: role,
        };

        const s3Client = new S3Client({
            endpoint: c.env.S3_ENDPOINT,
            region: c.env.S3_REGION,
            credentials: {
                accessKeyId: c.env.S3_ACCESS_KEY_ID,
                secretAccessKey: c.env.S3_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true
        });

        const command = new PutObjectCommand({
            Bucket: c.env.S3_BUCKET,
            Key: imgId,
            Body: await file?.bytes(),
            ContentType: file?.type,
        });

        let response: AMResponse | undefined;

        try {
            await s3Client.send(command);

            const inserted =  await c.env.DB.prepare("\
                INSERT INTO comments (user_id, content, image_url, quote_id, role) \
                VALUES (?, ?, ?, ?, ?) \
                RETURNING *"
            ).bind(
                amComment.user_id,
                amComment.content,
                amComment.image_url,
                amComment.quote_id,
                amComment.role,
            ).run();

            response = {
                status: 200,
                message: "Sent successfully",
                data: (inserted.results as any)[0],
            }

            if (response.status === 200 && c.env.ENVIRONMENT === "production") {
                await remainder.remain(amComment);
            }
        } catch (err) {
            console.log("Error:", err);

            response = {
                status: 500,
                message: (err as any).message,
                data: {}
            };
        }

        return c.json<AMResponse>(response);
    }

};
