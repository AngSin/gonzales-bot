import SolanaService from "../services/SolanaService";
import {Context} from "grammy";
import {MessagingService} from "../services/MessagingService";
import {Logger} from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: 'handleDecimals' })

const handleDecimals = async (context: Context) => {
    logger.info(`handling decimals call`, { context });
    const solanaService = new SolanaService();
    const messagingService = new MessagingService();
    const humanFriendlyBalance = await solanaService.getHumanFriendlyTokenBalance('21AErpiB8uSb94oQKRcwuHqyHF93njAxBSbdUrpupump', '123456789')
    await messagingService.sendMessage(context, `Human Friendly amount: ${humanFriendlyBalance}`);
};

export default handleDecimals;