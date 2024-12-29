import {Camelized} from "humps";
import {Context} from "grammy";
import {Commands} from "./types";
import {Logger} from "@aws-lambda-powertools/logger";
import handleBuy from "./handleBuy";
import handleSell from "./handleSell";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";

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
    const [direction, tokenAddress, ticker, num] = tradeData;

    if (tradeData.length < 4) {
        logger.error(`Missing trade data!`, { tradeData });
        return;
    }

    if (direction === 'buy') {
        const amountInLamports = Number(num) * LAMPORTS_PER_SOL; // renamed for code legibility
        return await handleBuy(context, tokenAddress, userId, ticker, amountInLamports);
    } else {
        const divider = BigInt(num);
        return await handleSell(tokenAddress, userId, username, ticker, divider, context);
    }
};

export default handleTrade;