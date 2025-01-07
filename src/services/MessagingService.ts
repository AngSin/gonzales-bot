import {Pair} from "../types";
import {Context, InlineKeyboard} from "grammy";
import {capitalize, displayHumanFriendlyNumber} from "../utils/string";
import {Logger} from "@aws-lambda-powertools/logger";
import {Account} from "@solana/spl-token";
import axios, {AxiosInstance} from "axios";
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";
import {Camelized, decamelizeKeys} from "humps";
import {sellPercentages} from "../utils/percentages";

export class MessagingService {
    private axios: AxiosInstance = axios.create({
        baseURL: `https://api.telegram.org/bot${getMandatoryEnvVariable('TELEGRAM_BOT_TOKEN')}/`
    });
    readonly logger: Logger;
    constructor() {
        this.logger = new Logger({ serviceName: "MessagingService"});
    };

    private wrapMessageInWarningSigns = (str: string, level: 'warning' | 'danger') => {
        const emoji = level === 'danger' ? '‼️' : '⚠️';
        return `${emoji}${emoji}${emoji}️ ${str} ${emoji}${emoji}${emoji}`;
    };

    private getWarnings = (pair: Pair): string => {
        const now = Date.now();
        const twoWeeks = 1_000 * 60 * 60 * 24 * 14;
        const wasPairCreatedWithinTwoWeeks = (now - pair.pairCreatedAt) <= twoWeeks;
        let warnings = '';
        if (wasPairCreatedWithinTwoWeeks) {
            warnings += `${this.wrapMessageInWarningSigns(`This pair is new!`, 'danger')}\n`;
        }

        return warnings;
    };

    async replyWithPairInfo (context: Camelized<Context>, pair: Pair, tokenAccount?: Account) {
        const amounts = ['.1', '.5', '1'];
        const inlineKeyboard = new InlineKeyboard();

        inlineKeyboard.add(...amounts.map(amount => ({
            text: `BUY ${amount} SOL`,
            callback_data: `buy:${pair.baseToken.address}:${pair.baseToken.symbol.trim()}:${amount}`,
        })));

        if (tokenAccount && tokenAccount.amount > 0n) {
            inlineKeyboard.row();
            inlineKeyboard.row(...sellPercentages.map(percentage => ({
                text: `SELL ${percentage}`, callback_data: `sell:${pair.baseToken.address}:${pair.baseToken.symbol}:${percentage}`
            })));
        }

        const messageText = (
            `✍️ ${pair.baseToken.name}\n` +
            `🌐 ${capitalize(pair.chainId)}\n` +
            `💹 $${pair.baseToken.symbol}\n\n` +
            `💰 $${pair.priceUsd.toLocaleString()}\n` +
            `💎 FDV: ${displayHumanFriendlyNumber(pair.fdv)}\n` +
            `⏳ 24hr Vol: ${displayHumanFriendlyNumber(pair.volume.h24)}\n` +
            `📈 <a href="${pair.url}">Chart</a>\n\n` +
            `       <code>${pair.baseToken.address}</code> (tap to copy)\n\n` +
            `${this.getWarnings(pair)}\n`
        );

        this.logger.info(`Replying to message with: ${messageText}`);

        await this.sendMessage(context, messageText, pair.chainId === 'solana' ? inlineKeyboard : undefined, true);
    };

    async sendMessage(context: Camelized<Context>, messageText: string, inlineKeyboard?: InlineKeyboard, isReply?: boolean) {
        const payload = decamelizeKeys({
            chatId: (context.message || context.callbackQuery?.message)?.chat.id,
            text: messageText,
            replyMarkup: inlineKeyboard,
            parseMode: "HTML",
            replyTo: isReply ? (context.message || context.callbackQuery?.message)?.messageId : undefined,
            disableWebPagePreview: true,
        });
        this.logger.info('Sending TG Message', { payload })
        await this.axios.post('sendMessage', payload);
    };
}