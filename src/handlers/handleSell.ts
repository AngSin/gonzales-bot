import SolanaService from "../services/SolanaService";
import {Logger} from "@aws-lambda-powertools/logger";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {MessagingService} from "../services/MessagingService";
import {Camelized} from "humps";
import {Context} from "grammy";

const logger = new Logger({ serviceName: 'handleSell' });

const handleSell = async (tokenMintAddress: string, userId: string, username: string, ticker: string, divider: bigint, sellPercentage: string, context: Camelized<Context>) => {
    logger.info(`Handling sell`, { context });
    const solanaService = new SolanaService();
    const solanaKeyService = new SolanaKeyService();
    const messagingService = new MessagingService();
    const userKey = await solanaKeyService.getKey(userId);
    if (!userKey) {
        logger.error(`User key does not exist for user ${userId} (${username}), ending execution`);
        return;
    }
    const tokenAccount = await solanaService.getTokenAccount(tokenMintAddress, userKey.publicKey);
    if (!tokenAccount) {
        logger.error(`No token account exists for user ${userId} (${username}), ending execution`);
        return;
    }
    const amountToSell = Number(tokenAccount.amount/divider);
    logger.info(`Placing sell order`, {
        amountToSell,
        tokenAccount,
    });
    await solanaService.tradeSolanaAsset({
        tokenAccount,
        assetAddress: tokenMintAddress,
        amountInSmallestUnits: amountToSell,
        userKey,
    });
    const messageText = `You sold ${sellPercentage}% of your ${ticker} holdings!`;
    await messagingService.sendMessage(context, messageText);
};

export default handleSell;