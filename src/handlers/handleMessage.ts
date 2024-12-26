import {Context} from "grammy";
import {MessagingService} from "../services/MessagingService";
import DexscreenerService from "../services/DexscreenerService";
import {getAddressFromMessage, getTickerFromMessage} from "../utils/string";
import SolanaService from "../services/SolanaService";
import {Logger} from "@aws-lambda-powertools/logger";
import {SolanaKeyService} from "../services/SolanaKeyService";
import {Account} from "@solana/spl-token";

const logger = new Logger({ serviceName: 'handleMessage' });

const handleMessage = async (context: Context) => {
    const messagingService = new MessagingService();
    const dexscreenerService = new DexscreenerService();
    const solanaService = new SolanaService();
    const solanaKeyService = new SolanaKeyService();
    const {message} = context;
    logger.info(`Received message: ${JSON.stringify(message)}\n`);
    if (!message) return; // nothing to do here
    const ticker = getTickerFromMessage(message);
    const address = getAddressFromMessage(message);
    const addressOrTicker = address || ticker;
    if (!addressOrTicker) return;

    const userId = context.from?.id.toString();

    // message verification complete
    logger.info(`Found address or ticker: ${addressOrTicker}`);
    const [pair, userKey] = await Promise.all([
        dexscreenerService.searchAndRetrievePair(addressOrTicker),
        userId ? solanaKeyService.getKey(userId) : undefined,
    ]);
    logger.info(`Found token pair: ${JSON.stringify(pair)}\n`);

    let tokenAccount: Account | undefined;
    if (userKey) {
        tokenAccount = await solanaService.getTokenAccount(pair.baseToken.address, userKey.publicKey);
    }

    await messagingService.replyWithPairInfo(context, pair, tokenAccount);
}

export default handleMessage;