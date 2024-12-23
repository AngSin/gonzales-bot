import {Context, InlineKeyboard} from "grammy";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {Logger} from "@aws-lambda-powertools/logger";
import {MessagingService} from "../services/MessagingService";

const logger = new Logger({ serviceName: 'handleBuy' });

const handleBuy = async (context: Context, address: string, userId: string, symbol: string, amountInSOL: string) => {
    const solanaKeyService = new SolanaKeyService();
    const messagingService = new MessagingService();
    const solanaKey = await solanaKeyService.getKey(userId);

    await context.answerCallbackQuery({ text: `${context.from?.first_name} is buying ${symbol}` });

    if (solanaKey) {
        logger.info(`Found wallet ${solanaKey.publicKey} for user ${userId}`);

    } else {
        logger.info(`No solanaKey exists for user ${userId}`);
        const botUsername = context.me.username;
        const keyboard = new InlineKeyboard().url(
            "Set up wallet",
            `https://t.me/${botUsername}`
        );
        await messagingService.replyWithKeyboard(
            context,
            `${context.from?.first_name}, you do not have a Gonzalez wallet. DM me to get started`,
            keyboard,
        );
    }

};

export default handleBuy;