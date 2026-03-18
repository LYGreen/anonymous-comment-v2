import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getComments } from "./api/get-comments";
import { postComments } from "./api/post-comments";
import { tokenVerification } from "./api/token-verification";
import { AMEnv } from "./type";
import { authorization } from "./api/authorization";

const app = new Hono<{ Bindings: AMEnv }>();

app.use("*", async (c, next) => {
	const origins = c.env.ALLOW_CORS_ORIGIN;
	const handler = cors({ origin: origins});
	return handler(c, next);
});
app.use("*", authorization);
app.get('/api/comments', getComments);
app.post('/api/comments', postComments);
app.post('/api/token', tokenVerification);

export default app;
