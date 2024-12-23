import {Context, InlineKeyboard} from "grammy";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {Logger} from "@aws-lambda-powertools/logger";
import {MessagingService} from "../services/MessagingService";
import SolanaService from "../services/SolanaService";

const logger = new Logger({ serviceName: 'handleBuy' });

const handleBuy = async (context: Context, assetAddress: string, userId: string, symbol: string, amountInSOL: string) => {
    const solanaKeyService = new SolanaKeyService();
    const messagingService = new MessagingService();
    const solanaService = new SolanaService();
    const solanaKey = await solanaKeyService.getKey(userId);

    await context.answerCallbackQuery({ text: `${context.from?.first_name} is buying ${symbol}...`, cache_time: 1 });

    if (solanaKey) {
        logger.info(`Found wallet ${solanaKey.publicKey} for user ${userId}`);
        const { amountBought } = await solanaService.buySolanaAsset(assetAddress, amountInSOL);
        if (context.chat?.type === 'private') {
            await messagingService.sendMessage(context, `You just bought ${amountBought} SOL!`);
        } else {
            await messagingService.sendMessage(context, `${context.from?.first_name} just bought some ${assetAddress}!`); // we do not want to reveal the purchased amount in a group chat
        }
    } else {
        logger.info(`No solanaKey exists for user ${userId}`);
        const botUsername = context.me.username;
        const keyboard = new InlineKeyboard().url(
            "Set up wallet",
            `https://t.me/${botUsername}`
        );
        await messagingService.sendMessage(
            context,
            `${context.from?.first_name}, you do not have a Gonzalez wallet. DM me to get started`,
            keyboard,
        );
    }

};

export default handleBuy;