import {Context, InlineKeyboard} from "grammy";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {Logger} from "@aws-lambda-powertools/logger";
import {MessagingService} from "../services/MessagingService";
import SolanaService, {botUsername, BuyErrorMessage} from "../services/SolanaService";
import {Camelized} from "humps";

const logger = new Logger({ serviceName: 'handleBuy' });
const messagingService = new MessagingService();

const handlePurchaseError = async (buyErrorMessage: BuyErrorMessage, context: Camelized<Context>) => {
    switch (buyErrorMessage) {
        case BuyErrorMessage.INSUFFICIENT_BALANCE:
            if (context.callbackQuery?.message?.chat?.type === 'private') {
                await messagingService.sendMessage(context, "You do not have enough SOL balance for the purchase!");
            } else {
                const keyboard = new InlineKeyboard().url(
                    "Fund wallet",
                    `https://t.me/${botUsername}?start`
                );
                await messagingService.sendMessage(
                    context,
                    `${context.callbackQuery?.from?.firstName}, your purchase failed (insufficient balance). Message me to fund your wallet.`,
                    keyboard,
                );
            }
    }
}

const handleBuy = async (context: Camelized<Context>, assetAddress: string, userId: string, symbol: string, amountInLamports: number) => {
    const solanaKeyService = new SolanaKeyService();
    const solanaService = new SolanaService();

    const solanaKey = await solanaKeyService.getKey(userId);

    if (solanaKey) {
        logger.info(`Found wallet ${solanaKey.publicKey} for user ${userId}`);
        const purchase = await solanaService.tradeSolanaAsset(assetAddress, amountInLamports, solanaKey);
        if (purchase.success) {
            logger.debug(`amount bought: ${purchase.amountBought} ${symbol}, chat is of type: ${context.callbackQuery?.message?.chat?.type}`);
            await messagingService.sendMessage(context, `${context.callbackQuery?.from?.firstName} just bought some ${symbol}!`); // we do not want to reveal the purchased amount in a group chat
        } else {
            await handlePurchaseError(purchase.error, context);
        }
    } else {
        logger.info(`No solanaKey exists for user ${userId}`);
        const keyboard = new InlineKeyboard().url(
            "Set up wallet",
            `https://t.me/${botUsername}?start`
        );
        await messagingService.sendMessage(
            context,
            `${context.callbackQuery?.from?.firstName}, you do not have a Gonzales wallet. DM me to get started`,
            keyboard,
        );
    }
};

export default handleBuy;