import {Logger} from "@aws-lambda-powertools/logger";
import {APIGatewayProxyEventV2} from 'aws-lambda';
import {Context} from "grammy";
import handleStart from "./handleStart";
import {Commands} from "./types";
import handleExport from "./handleExport";

const logger = new Logger({ serviceName: 'TelegramHandler' });

export const handler = async (event: APIGatewayProxyEventV2) => {
    logger.info(`Received telegram event`, { event });
    const context = JSON.parse(event.body || '{}') as Context;
    if (!context.callbackQuery && !context.message) {
        logger.error(`Error, missing message & data`, { context });
        return;
    }
    logger.info(`Received context`, { context });
    const command = context.callbackQuery?.data || context.message?.text;
    switch (command) {
        case Commands.START:
            return await handleStart(context);
        case Commands.EXPORT:
            return await handleExport(context);
        default:
            logger.error(`Unhandled message text: ${command}`);
            return;
    }
};