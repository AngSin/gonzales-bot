import {Context} from "grammy";
import SolanaService from "../services/SolanaService";
import {MessagingService} from "../services/MessagingService";
import {Logger} from "@aws-lambda-powertools/logger";

const assetMintAddress = "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9";


const handleDecimals = async (context: Context) => {
    const logger = new Logger({ serviceName: "handleDecimals" });
    logger.info(`Handling decimal ${JSON.stringify(context, null, 2)}`);
    const solanaService = new SolanaService();
    const messagingService = new MessagingService();
    const humanFriendlyBalance = await solanaService.getHumanFriendlyTokenBalance(assetMintAddress, "123456789");
    await messagingService.sendMessage(context, `Human Friendly Balance: ${humanFriendlyBalance}`);
};

export default handleDecimals;