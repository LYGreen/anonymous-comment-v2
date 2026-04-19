import { AMComment } from "../type";
import { Notification } from "./notification";

class DiscordNotification extends Notification {
    webHookUrl: string;

    constructor(webHookUrl: string) {
        super();
        this.webHookUrl = webHookUrl;
    }

    async remain(comment: AMComment): Promise<void> {
        if (this.webHookUrl) {
            try {
                await fetch(this.webHookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: "```json\n" +
                            `"user_id": "${comment.user_id}"\n` +
                            `"content": "${comment.content}"\n` +
                            `"image_url": "${comment.image_url}"\n` +
                            `"quote_id": "${comment.quote_id}"\n` +
                            `"role": "${comment.role}"\n` +
                            "```",
                    }),
                });
            } catch (err) {
                console.error(err);
            }
        }
    }
}

export { DiscordNotification };
