import { AMComment } from "../type";

abstract class Notification {
    abstract remain(comment: AMComment): Promise<void>;
};

export { Notification };
