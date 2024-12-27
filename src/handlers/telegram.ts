import {Logger} from "@aws-lambda-powertools/logger";
import { APIGatewayProxyEventV2 } from 'aws-lambda';

const logger = new Logger({ serviceName: 'TelegramHandler' });

export const handler = (event: APIGatewayProxyEventV2) => {
    logger.info(`Received telegram event`, { event });
};