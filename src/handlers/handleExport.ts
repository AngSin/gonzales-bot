import {Context, InlineKeyboard} from "grammy";
import {Logger} from "@aws-lambda-powertools/logger";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {MessagingService} from "../services/MessagingService";
import {botUsername} from "../services/SolanaService";
import {Camelized} from "humps";

const logger = new Logger({ serviceName: 'handleExport' });

const handleExport = async (context: Camelized<Context>) => {
    logger.info(`Handling export, context: `, { context });
    const solanaKeyService = new SolanaKeyService();
    const messagingService = new MessagingService();
    const userId = context.callbackQuery?.from?.id.toString();
    if (!userId) {
        logger.error(`For some reason the user id does not exist in this context`, { context });
        return;
    }
    const key = await solanaKeyService.getKey(userId);
    if (!key) {
        logger.error(`No key exists for user: ${userId}`, { context });
        return;
    }
    const privateKey = Buffer.from(key.privateKey).toString("base64");
    const messageText = (
      `You may export your wallet by using this private key:\n\n` +
      `\`${privateKey}\` (tap to copy)\n\n` +
      `Remember! Do not share this private key with anyone`
    );
    const inlineKeyboard = new InlineKeyboard().url('Refresh', `https://t.me/${botUsername}?start`);
    await messagingService.sendMessage(context, messageText, inlineKeyboard);
};

export default handleExport;