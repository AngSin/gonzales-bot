import {Camelized} from "humps";
import {Context} from "grammy";
import {Logger} from "@aws-lambda-powertools/logger";
import handleBuy from "./handleBuy";
import handleSell from "./handleSell";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import {getDividerFromPercentage} from "../utils/percentages";

const logger = new Logger({ serviceName: 'handleTrade' });

const handleTrade = async (context: Camelized<Context>) => {
    if (!context.callbackQuery?.data) {
        logger.error(`No callback query data! ending execution`, { context });
        return;
    }
    const callbackData = context.callbackQuery.data;
    const userId = context.callbackQuery.from.id.toString();
    const username = String(context.callbackQuery.from.username);
    logger.info(`Received trade data: ${callbackData} from user ${username} with user id ${userId}`);

    const tradeData = callbackData.split(':');
    const [direction, tokenAddress, ticker, amount] = tradeData;

    if (tradeData.length < 4) {
        logger.error(`Missing trade data!`, { tradeData });
        return;
    }

    if (direction === 'buy') {
        const amountInLamports = Number(amount) * LAMPORTS_PER_SOL; // renamed for code legibility
        return await handleBuy(context, tokenAddress, userId, ticker, amountInLamports);
    } else {
        const sellPercentage = amount;
        const divider = getDividerFromPercentage(sellPercentage);
        return await handleSell(tokenAddress, userId, username, ticker, divider, sellPercentage, context);
    }
};

export default handleTrade;