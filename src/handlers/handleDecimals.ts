import SolanaService from "../services/SolanaService";
import {Context} from "grammy";
import {MessagingService} from "../services/MessagingService";
import {Logger} from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: 'handleDecimals' })

const handleDecimals = async (context: Context) => {
    logger.info(`handling decimals call`, { context });
    const solanaService = new SolanaService();
    const messagingService = new MessagingService();
    const slot = await solanaService.connection.getSlot();
    logger.info(`Slot: ${slot}`);
    // const mintAccount = await getMint(solanaService.connection, new PublicKey('63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9'));
    logger.info(`Mint account found`, { mintAccount: undefined });
    // const humanFriendlyBalance = await solanaService.getHumanFriendlyTokenBalance('21AErpiB8uSb94oQKRcwuHqyHF93njAxBSbdUrpupump', '123456789')
    // await messagingService.sendMessage(context, `Human Friendly amount: ${humanFriendlyBalance}`);
};

export default handleDecimals;