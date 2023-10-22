import { ethers } from "ethers";
import Safe, { EthersAdapter, SafeFactory, SafeAccountConfig, } from "@safe-global/protocol-kit";
import dotenv from "dotenv";
import SafeApiKit from "@safe-global/api-kit";
import { SafeTransactionDataPartial, SafeTransaction, SafeMultisigTransactionResponse, TransactionOptions } from "@safe-global/safe-core-sdk-types";
import express, { Express, Request, Response } from "express";

dotenv.config();

const RPC_URL = "https://ethereum-goerli.publicnode.com";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const owner1Signer = new ethers.Wallet(process.env.OWNER_1_PRIVATE_KEY!, provider);
const owner2Signer = new ethers.Wallet(process.env.OWNER_2_PRIVATE_KEY!, provider);

const ethAdapterOwner1 = new EthersAdapter({
    ethers,
    signerOrProvider: owner1Signer,
});
const ethAdapterOwner2 = new EthersAdapter({
    ethers,
    signerOrProvider: owner2Signer,
});

const txServiceUrl = "https://safe-transaction-goerli.safe.global";
// const txServiceUrl = "https://safe-transaction-polygon.safe.global";
const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterOwner1 });


class SafeController {

    async deploySafeAA(req: Request, res: Response) {
        const funcName = "deploySafeAA";

        const body: any = req.body;
        console.log(`body:`, body);

        try {
            // 3. Initialize the Protocol Kit
            const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner1 });

            // 4. Deploy a Safe
            const safeAccountConfig: SafeAccountConfig = {
                owners: [
                    await owner1Signer.getAddress(),
                    // await owner2Signer.getAddress(),
                    body.user
                ],
                threshold: 1,
            };

            const feeData = await provider.getFeeData();
            // console.log(`feeData:`, feeData);
            const gasLimit = feeData.maxFeePerGas?.div(400).toString();
            // const maxFeePerGas = feeData.maxFeePerGas?.toString();
            // const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toString();
            // const nonce = await provider.getTransactionCount(owner1Signer.address);

            const options: TransactionOptions = {
                from: owner1Signer.address, // Optional
                gasLimit, // Optional
                // gasPrice, // Optional
                // maxFeePerGas, // Optional
                // maxPriorityFeePerGas, // Optional
                // nonce // Optional
            };
            console.log(`options:`, options);

            /* This Safe is tied to owner 1 because the factory was initialized with an adapter that had owner 1 as the signer. */
            // const safeSdkForOwner1 = await safeFactory.deploySafe({ safeAccountConfig });
            const safeSdkForOwner1 = await safeFactory.deploySafe({ safeAccountConfig, options });

            // return safeSdkForOwner1;
            const safeAddress = await safeSdkForOwner1.getAddress(); // Safe AA CA

            console.log('Your Safe has been deployed:');
            console.log(`https://goerli.etherscan.io/address/${safeAddress}`);
            console.log(`https://app.safe.global/gor:${safeAddress}`);

            // return safeAddress;
            return res.status(200).json({
                data: safeAddress,
            });
        } catch (err) {
            console.error(`[${funcName}] err:`, err);
            return res.status(500).json({
                data: err,
            });
        }
    }

    async confirmTx(req: Request, res: Response) {
        const funcName = "confirmTx";
        const body: any = req.body;

        const safeTxHash = body.tx_hash;
        const safeAddress = body.safe_address;

        try {
            const safeSdkForOwner1 = await Safe.create({
                ethAdapter: ethAdapterOwner1,
                safeAddress
            });
    
            const signature = await safeSdkForOwner1.signTransactionHash(safeTxHash);
            const response = await safeService.confirmTransaction(safeTxHash, signature.data);
            console.log(`[${funcName}] response:`, response);
    
            return res.status(200).json({
                data: response
            });
        } catch (err) {
            console.error(`[${funcName}] err:`, err);
            return res.status(500).json({
                data: err,
            });
        }
    }
}

const safeController = new SafeController();
export { safeController };
