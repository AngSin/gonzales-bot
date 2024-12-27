import {Pair} from "../types";
import {Context, InlineKeyboard} from "grammy";
import {capitalize, displayHumanFriendlyNumber} from "../utils/string";
import {Logger} from "@aws-lambda-powertools/logger";
import {Account} from "@solana/spl-token";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import axios, { AxiosInstance } from "axios";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";

export class MessagingService {
    private axios: AxiosInstance = axios.create({
        baseURL: `https://api.telegram.org/bot${getMandatoryEnvVariable('TELEGRAM_BOT_TOKEN')}/`
    });
    readonly logger: Logger;
    constructor() {
        this.logger = new Logger({ serviceName: "MessagingService"});
    };

    private escapeTelegramMarkup(text: string): string {
        const specialCharacters = ['_', '*', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '!'];

        return text.replace(
            new RegExp(`[${specialCharacters.map((c) => `\\${c}`).join('')}]`, 'g'),
            (match) => `\\${match}`
        );
    };

    async replyWithPairInfo (context: Context, pair: Pair, tokenAccount?: Account) {
        const amounts = ['.1', '.5', '1'];
        const inlineKeyboard = new InlineKeyboard();

        inlineKeyboard.add(...amounts.map(amount => ({
            text: `BUY ${amount} SOL`,
            callback_data: `buy:${pair.baseToken.address}:${pair.baseToken.symbol}:${Number(amount) * LAMPORTS_PER_SOL}`,
        })));

        if (tokenAccount && tokenAccount.amount > 0n) {
            inlineKeyboard.add(
                { text: 'SELL 50%', callback_data: `sell:${pair.baseToken.address}:${pair.baseToken.symbol}:${tokenAccount.amount/2n}` },
                { text: 'SELL 100%', callback_data: `sell:${pair.baseToken.address}:${pair.baseToken.symbol}:${tokenAccount.amount}` }
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

    async sendMessage(context: Context, messageText: string, inlineKeyboard?: InlineKeyboard, isReply?: boolean) {
        await this.axios.post('sendMessage', {
            chat_id: context.message?.chat.id,
            // text: this.escapeTelegramMarkup(messageText),
            text: messageText,
            reply_markup: inlineKeyboard,
            parse_mode: "MarkdownV2",
            reply_to: isReply ? context.message?.message_id : undefined,
        })
    };
}