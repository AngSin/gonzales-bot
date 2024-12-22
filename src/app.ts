import {Bot, Context} from "grammy";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvVariable";
import {getAddressFromMessage, getTickerFromMessage} from "./utils/string";
import {searchAndRetrievePair} from "./utils/api";
import {MessagingService} from "./services/MessagingService";
import {SolanaKeyService} from "./services/SolanaKeyService";
import {Logger} from "@aws-lambda-powertools/logger";
import handleStart from "./handlers/handleStart";

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");

const logger = new Logger({ serviceName: "App" });
const bot = new Bot(botToken);
const messagingService = new MessagingService();
const solanaKeyService = new SolanaKeyService();

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

    await messagingService.replyWithPairInfo(context, pair);
});

bot.on("callback_query:data", async (context) => {
    const callbackData = context.callbackQuery?.data;
    const userId = context.from?.id.toString();
    console.log(`Received callback query: ${callbackData} from user ${context.from.username} with user id ${userId}`);

    const [direction, tokenAddress, ticker] = callbackData.split(':');

    if (!direction || !callbackData.startsWith('buy:')) return;

    const solanaKey = await solanaKeyService.getKey(userId);

    await context.answerCallbackQuery({ text: `${context.from.first_name} is buying ${ticker}` });

    if (!solanaKey) {
        logger.info(`No solanaKey exists for user ${userId}`);
        // TODO: tell user to create wallet with Gonzalez
    }
});

bot.command("start", handleStart);

bot.start();