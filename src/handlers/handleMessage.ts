import {Context} from "grammy";
import {MessagingService} from "../services/MessagingService";
import DexscreenerService from "../services/DexscreenerService";
import {getAddressFromMessage, getTickerFromMessage} from "../utils/string";

const handleMessage = async (context: Context) => {
    const messagingService = new MessagingService();
    const dexscreenerService = new DexscreenerService();
    const {message} = context;
    console.log(`Received message: ${JSON.stringify(message)}\n`);
    if (!message) return; // nothing to do here
    const ticker = getTickerFromMessage(message);
    const address = getAddressFromMessage(message);
    const addressOrTicker = address || ticker;
    if (!addressOrTicker) return;

    // message verification complete
    console.log(`Found address or ticker: ${addressOrTicker}`);
    const pair = await dexscreenerService.searchAndRetrievePair(addressOrTicker);
    console.log(`Found token pair: ${JSON.stringify(pair)}\n`);

    await messagingService.replyWithPairInfo(context, pair);
}

export default handleMessage;