import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey, SystemProgram, TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import bs58 from 'bs58';
import {getMandatoryEnvVariable} from "../utils/getMandatoryEnvVariable";
import axios, {AxiosInstance} from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import {Account, getAccount, getAssociatedTokenAddressSync, getMint, NATIVE_MINT} from "@solana/spl-token";
import {Key} from "../types";

type SolanaBuyInput = {
    assetAddress: string;
    amountInSmallestUnits: number;
    userKey: Key;
};

type SolanaSellInput = {
    assetAddress: string;
    amountInSmallestUnits: number;
    userKey: Key;
    tokenAccount: Account;
};

type SolanaTradeInput = SolanaBuyInput | SolanaSellInput;

const isSellInput = (input: SolanaTradeInput): input is SolanaSellInput =>
    (input as SolanaSellInput).tokenAccount !== undefined;

type SwapMode = "ExactIn" | "ExactOut";

type JupiterQuotesResponse = {
    inputMint: string; // Address of the input mint
    inAmount: string; // Amount in lamports (string to handle large numbers)
    outputMint: string; // Address of the output mint
    outAmount: string; // Output amount in lamports (string to handle large numbers)
    otherAmountThreshold: string; // Threshold amount in lamports (string to handle large numbers)
    swapMode: SwapMode; // Swap mode, constrained to specific string values
    slippageBps: number; // Basis points for slippage
    priceImpactPct: string; // Percentage of price impact (string for precision)
    contextSlot: number; // Slot number for context
};

type JupiterSwapResponse = {
    swapTransaction: string;
}

export enum TradeErrorMessage {
    INSUFFICIENT_BALANCE
}

type BuyResponse = BuyError | BuySuccess;

type BuyError = {
    success: false;
    error: TradeErrorMessage;
}

type BuySuccess = {
    success: true;
    amountBought: string;
}

export const botUsername = 'gonzales_ticker_bot';

export default class SolanaService {
    private readonly feeBasisPoints = 100n;
    private readonly treasuryAccount: PublicKey = new PublicKey('ABMHApyZu8DfuaGoKoLk4yRHFsvzHwsEsGZXKsJ19FBX');
    readonly connection: Connection = new Connection(getMandatoryEnvVariable("SOLANA_RPC_URL"));
    readonly jupiterAxios: AxiosInstance = axios.create({
        baseURL: "https://quote-api.jup.ag/v6/",
    });
    readonly logger: Logger = new Logger({ serviceName: 'SolanaService' });

    async getSOLBalance(pubkey: string): Promise<number> {
        const balanceInLamports = await this.connection.getBalance(new PublicKey(pubkey));
        this.logger.info(`Found balance for user ${pubkey}: ${balanceInLamports} lamports`);
        return balanceInLamports
    };

    async getHumanFriendlySOLBalance(pubkey: string): Promise<string> {
        const balanceInLamports = await this.getSOLBalance(pubkey);
        const balanceInSOL = balanceInLamports/LAMPORTS_PER_SOL;
        return balanceInSOL.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    async getHumanFriendlyTokenBalance(tokenAddress: string, tokenAmount: string): Promise<string> {
        const tokenMintPubkey = new PublicKey(tokenAddress);
        const mintAccount = await getMint(this.connection, tokenMintPubkey);
        this.logger.info(`Found mint address for token ${tokenAddress}`, { decimals: mintAccount.decimals });
        const decimals = mintAccount.decimals;
        return (Number(tokenAmount)/decimals).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    private calculateFees(orderAmountInLamports: bigint): bigint {
        return orderAmountInLamports / this.feeBasisPoints;
    };

    async tradeSolanaAsset(tradeInput: SolanaTradeInput): Promise<BuyResponse> {
        const isSell = isSellInput(tradeInput);
        const { amountInSmallestUnits, assetAddress, userKey } = tradeInput;
        if (isSell) {
            this.logger.info(`Selling ${amountInSmallestUnits} of ${assetAddress} for SOL`);
        } else {
            this.logger.info(`Buying ${amountInSmallestUnits} lamps of ${assetAddress}`);
        }
        const solBalance = await this.getSOLBalance(userKey.publicKey);
        if (isSell) {
            // theoretically this should never happen as the user is clicking on "SELL 50% or SELL 100%" etc buttons
            if (tradeInput.tokenAccount.amount < amountInSmallestUnits) {
                this.logger.info(`User does not have enough of the asset to sell`, { tokenAccount: tradeInput.tokenAccount, amountInSmallestUnits });
                return {
                    success: false,
                    error: TradeErrorMessage.INSUFFICIENT_BALANCE,
                };
            }
        } else if (solBalance <= amountInSmallestUnits) {
            this.logger.info(`User does not have enough balance to buy`, { solBalance, amountInSmallestUnits })
            return {
                success: false,
                error: TradeErrorMessage.INSUFFICIENT_BALANCE,
            }
        }
        const { data: quoteResponse } = await this.jupiterAxios.get<JupiterQuotesResponse>("quote", {
            params: {
                inputMint: isSell ? assetAddress : NATIVE_MINT,
                outputMint: isSell ? NATIVE_MINT : assetAddress,
                amount: amountInSmallestUnits,
                autoSlippage: true,
                maxAutoSlippageBps: 1_000, // 10%
                restrictIntermediateTokens: true, // if your route is routed through random intermediate tokens, it will fail more frequently
            }
        });
        this.logger.info(`Received quotes response: `, { quoteResponse });
        const swapResponse = await this.jupiterAxios.post<JupiterSwapResponse>("swap", {
            quoteResponse,
            userPublicKey: userKey.publicKey,
            dynamicComputeUnitLimit: true,
            dynamicSlippage: {
                maxBps: 1_000 // 10% - crazy high, just to make sure that there are no tx failures
            },
            wrapAndUnwrapSol: true,
            prioritizationFeeLamports: {
                priorityLevelWithMaxLamports: {
                    maxLamports: 5_000_000, // 0.005 SOL
                    global: false,
                    priorityLevel: "veryHigh"
                }
            }
        });
        this.logger.info(`Received Jupiter Swap Response: `, { response: swapResponse.data });
        const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
        const jupiterSwapTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
        const { blockhash } = await this.connection.getLatestBlockhash();
        this.logger.info(`Received latest blockhash ${blockhash}`);
        const trader = new PublicKey(userKey.publicKey);
        const amountInLamports = BigInt(isSell ? quoteResponse.outAmount : amountInSmallestUnits);
        const fees = this.calculateFees(amountInLamports);
        this.logger.info(`Amount in lamports is: ${amountInLamports}, calculated fees is: ${fees}`);
        const transferFeesInstruction = SystemProgram.transfer({
            fromPubkey: trader,
            toPubkey: this.treasuryAccount,
            lamports: fees,
        });
        const transferFeesMessage = new TransactionMessage({
            payerKey: trader,
            recentBlockhash: blockhash,
            instructions: [
                transferFeesInstruction,
            ],
        }).compileToV0Message();
        const transferFeesTransaction = new VersionedTransaction(transferFeesMessage);
        this.logger.info(`Serialised transactions: `, { feesTransaction: transferFeesTransaction.serialize(), jupiterSwapTransaction: jupiterSwapTransaction.serialize() });
        const wallet = Keypair.fromSecretKey(userKey.privateKey);
        jupiterSwapTransaction.sign([wallet]);
        transferFeesTransaction.sign([wallet]);
        this.logger.info(`Signed both swap & transfer fee transaction: `, { assetAddress, amountInSmallestUnits, isSell });
        const signatures = await Promise.all(
            [transferFeesTransaction, jupiterSwapTransaction].map(tx =>
                this.connection.sendTransaction(tx, {
                    skipPreflight: false,
                    maxRetries: 20,
                    preflightCommitment: 'processed',
                }))
        );

        this.logger.info(`Sent both transactions: Fees: ${signatures[0]}, Swap: ${signatures[1]}`);
        return {
            success: true,
            amountBought: quoteResponse.outAmount,
        };
    }

    async getTokenAccount(assetAddress: string, userAddress: string): Promise<Account | undefined> {
        try {
            const tokenAccountAddress = getAssociatedTokenAddressSync(new PublicKey(assetAddress), new PublicKey(userAddress));
            this.logger.info(`Found token address: ${tokenAccountAddress}`);
            const tokenAccount = await getAccount(this.connection, tokenAccountAddress);
            this.logger.info(`Found token account: `, { tokenAccount });
            return tokenAccount;
        } catch (e) {
            this.logger.info(`Couldn't find token account for mint address: ${assetAddress}`);
            return undefined;
        }
    }
}