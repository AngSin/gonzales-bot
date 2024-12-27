import {Logger} from "@aws-lambda-powertools/logger";
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import {Context} from "grammy";
import handleStart from "./handleStart";
import handleDecimals from "./handleDecimals";

const logger = new Logger({ serviceName: 'TelegramHandler' });

export const handler = async (event: APIGatewayProxyEventV2) => {
    logger.info(`Received telegram event`, { event });
    const context = JSON.parse(event.body || '{}') as Context;
    if (!context.message) {
        logger.error(`Error, malformed request`);
        return;
    }
    logger.info(`Received context`, { context });
    const text = context.message?.text;
    switch (text) {
        case '/start':
            await handleStart(context);
            return;
        case '/decimals':
            await handleDecimals(context);
            return;
        default:
            logger.error(`Unhandled message text: ${text}`);
            return;
    }
};