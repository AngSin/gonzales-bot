import {Pair} from "../types";
import {Context, InlineKeyboard} from "grammy";
import {capitalize} from "../utils/string";
import {Logger} from "@aws-lambda-powertools/logger";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";

export class MessagingService {
    readonly logger: Logger;
    constructor() {
        this.logger = new Logger({ serviceName: "MessagingService"});
    }

    async replyToMessageWithPairInfo (context: Context, pair: Pair) {
        const inlineKeyboard = new InlineKeyboard().text('BUY', `buy:${pair.baseToken.address}`);
        const messageText = (`✍️ ${pair.baseToken.name}\n` +
            `🌐${capitalize(pair.chainId)}\n` +
            `💹$${pair.baseToken.symbol}\n\n` +
            `💰$${pair.priceUsd.toLocaleString()}\n` +
            `💎$${pair.fdv.toLocaleString()} FDV \n` +
            `\`${pair.baseToken.address}\`\n`).replace(/\./g, '\\.'); // Telegram MarkdownV2 text doesn't allow "."

        this.logger.info(`Replying to message with: ${messageText}`);

        await context.reply(
            messageText,
            {
                parse_mode: "MarkdownV2",
                reply_markup: inlineKeyboard,
                reply_to_message_id: context.message?.message_id,
            }
        );
    };
}