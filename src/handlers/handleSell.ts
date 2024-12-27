import SolanaService from "../services/SolanaService";
import {Logger} from "@aws-lambda-powertools/logger";
import {SolanaKeyService} from "../services/SolanaKeyService";

const logger = new Logger({ serviceName: 'handleSell' });

const handleSell = async (tokenMintAddress: string, userId: string, username: string, ticker: string, divider: bigint) => {
    const solanaService = new SolanaService();
    const solanaKeyService = new SolanaKeyService();
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
    const amountToSell = (tokenAccount.amount/divider).toString();
    await solanaService.tradeSolanaAsset(tokenMintAddress, amountToSell, userKey, true);
};

export default handleSell;