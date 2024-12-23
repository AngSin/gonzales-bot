import {Pair} from "../types";
import {Context, InlineKeyboard} from "grammy";
import {capitalize} from "../utils/string";
import {Logger} from "@aws-lambda-powertools/logger";

export class MessagingService {
    readonly logger: Logger;
    constructor() {
        this.logger = new Logger({ serviceName: "MessagingService"});
    }

    private escapeTelegramMarkup(text: string): string {
        const specialCharacters = ['_', '*', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

        return text.replace(
            new RegExp(`[${specialCharacters.map((c) => `\\${c}`).join('')}]`, 'g'),
            (match) => `\\${match}`
        );
    }

    async replyWithPairInfo (context: Context, pair: Pair) {
        const inlineKeyboard = new InlineKeyboard().text('BUY', `buy:${pair.baseToken.address}:${pair.baseToken.symbol}`);
        const messageText = (`✍️ ${pair.baseToken.name}\n` +
            `🌐${capitalize(pair.chainId)}\n` +
            `💹$${pair.baseToken.symbol}\n\n` +
            `💰$${pair.priceUsd.toLocaleString()}\n` +
            `💎$${pair.fdv.toLocaleString()} FDV \n` +
            `\`${pair.baseToken.address}\`\n`); // Telegram MarkdownV2 text doesn't allow "."

        this.logger.info(`Replying to message with: ${messageText}`);

        await context.reply(
            this.escapeTelegramMarkup(messageText),
            {
                parse_mode: "MarkdownV2",
                reply_markup: inlineKeyboard,
                reply_to_message_id: context.message?.message_id,
            }
        );
    };

    async replyWithNewSOLWallet(context: Context, pubKey: string) {
        const messageText = (
            `You do not have a Gonzalez Wallet for Solana yet. We created one for you. Send SOL to this address to be able to trade on Gonzalez: \n\n` +
            `\`${pubKey}\n\``
        );
        await context.reply(
            this.escapeTelegramMarkup(messageText),
            {
                parse_mode: "MarkdownV2",
            }
        );
    }

    async replyWithKeyboard(context: Context, messageText: string, inlineKeyboard: InlineKeyboard) {
        await context.reply(
            this.escapeTelegramMarkup(messageText),
            {
                parse_mode: "MarkdownV2",
                reply_markup: inlineKeyboard,
            }
        );
    }
}