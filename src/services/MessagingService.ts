import {Pair} from "../types";
import {Context, InlineKeyboard} from "grammy";
import {capitalize, displayHumanFriendlyNumber} from "../utils/string";
import {Logger} from "@aws-lambda-powertools/logger";
import {Account} from "@solana/spl-token";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import axios, { AxiosInstance } from "axios";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";
import {Camelized, decamelizeKeys} from "humps";

export class MessagingService {
    private axios: AxiosInstance = axios.create({
        baseURL: `https://api.telegram.org/bot${getMandatoryEnvVariable('TELEGRAM_BOT_TOKEN')}/`
    });
    readonly logger: Logger;
    constructor() {
        this.logger = new Logger({ serviceName: "MessagingService"});
    };

    private escapeTelegramMarkup(text: string): string {
        const specialCharacters = ['_', '*', '[', ']', '~', '>', '#', '+', '-', '=', '|', '{', '}'];

        return text.replace(
            new RegExp(`[${specialCharacters.map((c) => `\\${c}`).join('')}]`, 'g'),
            (match) => `\\${match}`
        );
    };

    async replyWithPairInfo (context: Camelized<Context>, pair: Pair, tokenAccount?: Account) {
        const amounts = ['.1', '.5', '1'];
        const inlineKeyboard = new InlineKeyboard();

        inlineKeyboard.add(...amounts.map(amount => ({
            text: `BUY ${amount} SOL`,
            callback_data: `buy:${pair.baseToken.address}:${pair.baseToken.symbol}:${Number(amount) * LAMPORTS_PER_SOL}`,
        })));

        if (tokenAccount && tokenAccount.amount > 0n) {
            inlineKeyboard.add(
                { text: 'SELL 50%', callback_data: `sell:${pair.baseToken.address}:${pair.baseToken.symbol}:2` },
                { text: 'SELL 100%', callback_data: `sell:${pair.baseToken.address}:${pair.baseToken.symbol}:1` }
            );
        }
        const messageText = (`✍️ ${pair.baseToken.name}\n` +
            `🌐 ${capitalize(pair.chainId)}\n` +
            `💹 $${pair.baseToken.symbol}\n\n` +
            `💰 $${pair.priceUsd.toLocaleString()}\n` +
            `💎 FDV: ${displayHumanFriendlyNumber(pair.fdv)}\n\n` +
            `   \`${pair.baseToken.address}\` (tap to copy)\n`);

        this.logger.info(`Replying to message with: ${messageText}`);

        await this.sendMessage(context, messageText, pair.chainId === 'solana' ? inlineKeyboard : undefined, true);
    };

    async sendMessage(context: Camelized<Context>, messageText: string, inlineKeyboard?: InlineKeyboard, isReply?: boolean) {
        await this.axios.post('sendMessage', decamelizeKeys({
            chatId: context.message?.chat.id,
            text: this.escapeTelegramMarkup(messageText),
            replyMarkup: inlineKeyboard,
            parseMode: "Markdown",
            replyTo: isReply ? context.message?.messageId : undefined,
        }));
    };
}