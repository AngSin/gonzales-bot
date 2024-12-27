import SolanaService from "../services/SolanaService";
import {Logger} from "@aws-lambda-powertools/logger";
import {SolanaKeyService} from "../services/SolanaKeyService";

const logger = new Logger({ serviceName: 'handleSell' });

const handleSell = async (tokenMintAddress: string, userId: string, username: string, ticker: string, divider: BigInt) => {
    const solanaService = new SolanaService();
    const solanaKeyService = new SolanaKeyService();
    const userKey = await solanaKeyService.getKey(userId);
};

export default handleSell;