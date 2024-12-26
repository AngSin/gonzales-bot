import {BotError, Context} from "grammy";
import {Logger} from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: "handleError" });

const handleError = async<C extends Context>(error: BotError<C>) => {
    logger.error(`Received error: `, { error });
};

export default handleError;