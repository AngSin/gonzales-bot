import {Context, InlineKeyboard} from "grammy";
import {Logger} from "@aws-lambda-powertools/logger";
import {SolanaKeyService} from "../services/SolanaKeyService";
import SolanaService, {botUsername} from "../services/SolanaService";
import {MessagingService} from "../services/MessagingService";
import {InlineKeyboardButton} from "grammy/types";
import {Commands} from "./types";
import {Camelized} from "humps";

const logger = new Logger({ serviceName: "handleStart" });

const handleStart = async (context: Camelized<Context>) => {
    const solanaKeyService = new SolanaKeyService();
    const messagingService = new MessagingService();
    logger.info(`Handling start`, { context });
    const userId = (context.message || context.callbackQuery?.message)?.from?.id.toString();
    if (!userId) {
        logger.error(`User id is missing from context`, { context });
        return;
    }
    let solanaKey = await solanaKeyService.getKey(userId);
    const solanaService = new SolanaService();
    let messageText: string;
    const walletManagementButtons: InlineKeyboardButton[] = [];
    if (solanaKey) {
        const balance = await solanaService.getHumanFriendlySOLBalance(solanaKey.publicKey)
        messageText = (
            `Welcome back to Gonzales Bot! You previously created a wallet which currently has ${balance} SOL\n\n` +
            `You may deposit more SOL into your account:\n\n` +
            `\`${solanaKey.publicKey}\` (tap to copy)\n\n` +
            `Click on the "Refresh" button below to see your updated SOL balance after a deposit\n` +
            `To buy or sell a token, type its ticker symbol or CA into the chat`
        );
        walletManagementButtons.push({ text: 'Export', callback_data: Commands.EXPORT });
        walletManagementButtons.push({ text: 'Withdraw', callback_data: Commands.EXPORT });
    } else {
        logger.info(`No Solana key exists for user ${context.callbackQuery?.from?.username} with id: ${userId}`, { context });
        solanaKey = await solanaKeyService.generateNewKey(userId);
        logger.info(`Created solana key ${solanaKey.publicKey} for user ${userId}`);
        messageText = (
            `Welcome to Gonzales Bot! Since this is your first time using Gonzales, we have created a wallet for you\n\n` +
            `Deposit SOL into your account to get started:\n\n` +
            `\`${solanaKey.publicKey}\` (tap to copy)\n\n` +
            `Click on the "Refresh" button below to see your updated SOL balance after a deposit\n\n` +
            `To buy or sell a token, type its ticker symbol or CA into the chat`
        );
    }
    const inlineKeyboard = new InlineKeyboard()
        .text('Refresh', Commands.START)
        .row()
    inlineKeyboard.add(...walletManagementButtons);
    await messagingService.sendMessage(
        context,
        messageText,
        inlineKeyboard
    );
};

export default handleStart;