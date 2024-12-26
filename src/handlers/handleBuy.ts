import {Context, InlineKeyboard} from "grammy";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {Logger} from "@aws-lambda-powertools/logger";
import {MessagingService} from "../services/MessagingService";
import SolanaService, {BuyErrorMessage} from "../services/SolanaService";

const logger = new Logger({ serviceName: 'handleBuy' });
const messagingService = new MessagingService();

const handlePurchaseError = async (buyErrorMessage: BuyErrorMessage, context: Context) => {
    switch (buyErrorMessage) {
        case BuyErrorMessage.INSUFFICIENT_BALANCE:
            if (context.chat?.type === 'private') {
                await messagingService.sendMessage(context, "You do not have enough SOL balance for the purchase!");
            } else {
                const botUsername = context.me.username;
                const keyboard = new InlineKeyboard().url(
                    "Fund wallet",
                    `https://t.me/${botUsername}?start=1`
                );
                await messagingService.sendMessage(
                    context,
                    `${context.from?.first_name}, your purchase failed (insufficient balance). Message me to fund your wallet.`,
                    keyboard,
                );
            }
    }
}

const handleBuy = async (context: Context, assetAddress: string, userId: string, symbol: string, amountInLamports: string) => {
    const solanaKeyService = new SolanaKeyService();
    const solanaService = new SolanaService();

    await context.answerCallbackQuery({ text: `${context.from?.first_name} is buying ${symbol}...` });
    const solanaKey = await solanaKeyService.getKey(userId);

    if (solanaKey) {
        logger.info(`Found wallet ${solanaKey.publicKey} for user ${userId}`);
        const purchase = await solanaService.buySolanaAsset(assetAddress, amountInLamports, solanaKey);
        if (purchase.success) {
            logger.debug(`amount bought: ${purchase.amountBought} ${symbol}, chat is of type: ${context.chat?.type}`);
            await messagingService.sendMessage(context, `${context.from?.first_name} just bought some ${symbol}!`); // we do not want to reveal the purchased amount in a group chat
        } else {
            await handlePurchaseError(purchase.error, context);
        }
    } else {
        logger.info(`No solanaKey exists for user ${userId}`);
        const botUsername = context.me.username;
        const keyboard = new InlineKeyboard().url(
            "Set up wallet",
            `https://t.me/${botUsername}?start=1`
        );
        await messagingService.sendMessage(
            context,
            `${context.from?.first_name}, you do not have a Gonzalez wallet. DM me to get started`,
            keyboard,
        );
    }
};

export default handleBuy;