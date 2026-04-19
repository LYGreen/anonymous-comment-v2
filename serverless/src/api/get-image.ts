import { Handler } from "hono";
import { AMContext, AMResponse } from "../type";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const getImage: Handler<AMContext> = async (c) => {
    const imageId = c.req.param("imageId");

    const s3Client = new S3Client({
        endpoint: c.env.S3_ENDPOINT,
        region: c.env.S3_REGION,
        credentials: {
            accessKeyId: c.env.S3_ACCESS_KEY_ID,
            secretAccessKey: c.env.S3_SECRET_ACCESS_KEY
        },
        forcePathStyle: true,
    });

    const command = new GetObjectCommand({
        Bucket: c.env.S3_BUCKET,
        Key: imageId
    });

    try {
        const data = await s3Client.send(command);

        return new Response(data.Body, {
            status: 200,
            headers: {
                "Content-Type": data.ContentType || "application/octet-stream",
                "Cache-Control": "public, max-age=31536000"
            }
        });
    } catch (err) {
        console.error("Error fetching image:", err);

        return c.json<AMResponse>({
            status: 500,
            message: "Failed to fetch image",
            data: {}
        });
    }
};
