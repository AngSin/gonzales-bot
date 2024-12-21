import {Bot, Context} from "grammy";
import {config} from "dotenv";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvValue";
import {getAddressFromMessage, getTickerFromMessage} from "./utils/string";
import {searchAndRetrievePair} from "./utils/api";
import {replyToMessageWithPairInfo} from "./utils/messaging";

config();

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const bot = new Bot(botToken);

bot.on("message", async (context: Context) => {
    const { message } = context;
    console.log(`Received message: ${JSON.stringify(message)}\n`);
    if (!message) return; // nothing to do here
    const ticker = getTickerFromMessage(message);
    const address = getAddressFromMessage(message);
    const addressOrTicker = address || ticker;
    if (!addressOrTicker) return;

    // message verification complete
    console.log(`Found address or ticker: ${addressOrTicker}`);
    const pair = await searchAndRetrievePair(addressOrTicker);
    console.log(`Found token pair: ${JSON.stringify(pair)}\n`);

    await replyToMessageWithPairInfo(context, pair);
})

bot.start();