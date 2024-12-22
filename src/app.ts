import {Bot, Context} from "grammy";
import {getMandatoryEnvVariable} from "./utils/getMandatoryEnvVariable";
import {getAddressFromMessage, getTickerFromMessage} from "./utils/string";
import {searchAndRetrievePair} from "./utils/api";
import {MessagingService} from "./services/MessagingService";

const botToken = getMandatoryEnvVariable("TELEGRAM_BOT_TOKEN");
const ethTable = getMandatoryEnvVariable("ETH_KEYS_TABLE");
const solTable = getMandatoryEnvVariable("SOL_KEYS_TABLE");

const bot = new Bot(botToken);
const messagingService = new MessagingService();

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

    await messagingService.replyToMessageWithPairInfo(context, pair);
});

bot.on("callback_query:data", async (context) => {
    const callbackData = context.callbackQuery?.data;
    const userId = context.from.id;
    console.log(`Received callback query: ${callbackData} from user ${context.from.username} with user id ${userId}`);

    if (!callbackData || !callbackData.startsWith('buy:')) return;

    const tokenAddress = callbackData.split(':')[1];

    await context.answerCallbackQuery({ text: "Processing your BUY request..." });

    await context.reply(
        `🛒 You have selected to BUY the token with address: \`${tokenAddress}\``,
        { parse_mode: "Markdown" }
    );
});


bot.start();