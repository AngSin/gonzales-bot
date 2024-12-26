import SolanaService from "../services/SolanaService";
import {Context} from "grammy";
import {MessagingService} from "../services/MessagingService";

const handleDecimals = async (context: Context) => {
    const solanaService = new SolanaService();
    const messagingService = new MessagingService();
    const humanFriendlyBalance = await solanaService.getHumanFriendlyTokenBalance('21AErpiB8uSb94oQKRcwuHqyHF93njAxBSbdUrpupump', '123456789')
    await messagingService.sendMessage(context, `Human Friendly amount: ${humanFriendlyBalance}`);
};

export default handleDecimals;