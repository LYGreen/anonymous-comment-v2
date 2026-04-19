import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getImage } from "./api/get-image";
import { getComments } from "./api/get-comments";
import { postComments } from "./api/post-comments";
import { tokenVerification } from "./api/token-verification";
import { authorization } from "./api/authorization";
import { AMContext } from "./type";

const app = new Hono<AMContext>();

app.use("*", async (c, next) => {
	const origins = c.env.ALLOW_CORS_ORIGIN;
	const handler = cors({ origin: origins});
	return handler(c, next);
});
app.use("*", authorization);
app.get('/api/images/:imageId', getImage);
app.get('/api/comments', getComments);
app.post('/api/comments', postComments);
app.post('/api/token', tokenVerification);

export default app;
