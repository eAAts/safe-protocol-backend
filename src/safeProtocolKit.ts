import { ethers } from "ethers";
import Safe, { EthersAdapter, SafeFactory, SafeAccountConfig, } from "@safe-global/protocol-kit";
import dotenv from "dotenv";
import SafeApiKit from "@safe-global/api-kit";
import { SafeTransactionDataPartial, SafeTransaction, SafeMultisigTransactionResponse, TransactionOptions } from "@safe-global/safe-core-sdk-types";

dotenv.config();

// 1. Initialize Signers, Providers, and EthAdapter
const RPC_URL = "https://ethereum-goerli.publicnode.com";
// const RPC_URL = "https://polygon-rpc.com";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
// const web3Provider = new ethers.providers.Web3Provider()

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

// const user = "0xF656b0BEfAa46e15625E3CCeeC91F9919f035b69"; // goerli user
// const user = "0x98f2738Cf1784471554aDf2D850131Eb0f415b53"; // polygon mainnet user
const user = "0x095Fae86235B07CAEa0E98188A85104DcF59F876"; // my goerli Account 9

// 2. Initialize the API Kit
// const txServiceUrl = "https://safe-transaction-goerli.safe.global";
const txServiceUrl = "https://safe-transaction-polygon.safe.global";
const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterOwner1 });

const deploySafeAA = async () => {
    // 3. Initialize the Protocol Kit
    const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner1 });

    // 4. Deploy a Safe
    const safeAccountConfig: SafeAccountConfig = {
        owners: [
            await owner1Signer.getAddress(),
            // await owner2Signer.getAddress(),
            user
        ],
        threshold: 1,
    };
    // const gasLimit = 3000000;
    // const feeData = await provider.getFeeData();
    // const maxFeePerGas = feeData.maxFeePerGas?.mul(2).toString();
    // const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.mul(2).toString();
    // const nonce = await provider.getTransactionCount(owner1Signer.address);

    // const options: TransactionOptions = {
    //     from: owner1Signer.address, // Optional
    //     gasLimit, // Optional
    //     // gasPrice, // Optional
    //     maxFeePerGas, // Optional
    //     maxPriorityFeePerGas, // Optional
    //     nonce // Optional
    // };
    // console.log(`options:`, options);


    /* This Safe is tied to owner 1 because the factory was initialized with an adapter that had owner 1 as the signer. */
    // const safeSdkForOwner1 = await safeFactory.deploySafe({ safeAccountConfig, options });
    const safeSdkForOwner1 = await safeFactory.deploySafe({ safeAccountConfig });

    return safeSdkForOwner1;
}

const getSafeAddr = async (safeSdk: Safe) => {
    const safeAddress = await safeSdk.getAddress(); // Safe AA CA

    console.log('Your Safe has been deployed:');
    console.log(`https://goerli.etherscan.io/address/${safeAddress}`);
    console.log(`https://app.safe.global/gor:${safeAddress}`);

    return safeAddress;
}

const sendEthToSafe = async (safeAAaddr: string) => {
    const safeAmount = ethers.utils.parseUnits("0.0001", "ether").toHexString();

    const transactionParameters = {
        to: safeAAaddr,
        value: safeAmount,
    };

    // Safe AA 컨트랙트로 owner1이 돈 보냄
    const tx = await owner1Signer.sendTransaction(transactionParameters);

    console.log("Safe Fundraising.");
    console.log(`Deposit Transaction: https://goerli.etherscan.io/tx/${tx.hash}`);
}

const createTx = async (destination: string, safeSdk: Safe) => {
    const amount = ethers.utils.parseUnits("0.00001", "ether").toString();

    const safeTransactionData: SafeTransactionDataPartial = {
        to: destination,
        data: "0x",
        value: amount,
    };

    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData });

    return safeTransaction;
}

// propose a transaction to the Safe Transaction Service
const proposeTx = async (safeTransaction: SafeTransaction, safeSdk: Safe, safeAddress: string) => {
    // Deterministic hash based on transaction parameters
    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
    // Sign transaction to verify that the transaction is coming from owner 1
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash);

    await safeService.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: await owner1Signer.getAddress(),
        senderSignature: senderSignature.data,
    });
}

// Confirm the transaction: second confirmation
const confirmTx = async (pendingTransactions: SafeMultisigTransactionResponse[], safeAddress: string) => {
    const funcName = "confirmTx";
    // When owner 2 is connected to the application, the Protocol Kit should be initialized again with the existing Safe address the address of the owner 2 instead of the owner 1.
    const transaction = pendingTransactions[0];
    const safeTxHash = transaction.safeTxHash;

    const safeSdkOwner2 = await Safe.create({
        ethAdapter: ethAdapterOwner2,
        safeAddress
    });

    const signature = await safeSdkOwner2.signTransactionHash(safeTxHash);
    const response = await safeService.confirmTransaction(safeTxHash, signature.data);
    console.log(`[${funcName}] response:`, response);
}

const executeTx = async (safeTxHash: string, safeSdk: Safe) => {
    const funcName = "executeTx";
    // Anyone can execute the Safe transaction once it has the required number of signatures. In this example, owner 1 will execute the transaction and pay for the gas fees.
    const safeTransaction = await safeService.getTransaction(safeTxHash);
    const executeTxResponse = await safeSdk.executeTransaction(safeTransaction);
    const receipt = await executeTxResponse.transactionResponse?.wait();

    console.log(`[${funcName}] Transaction executed:`);
    console.log(`[${funcName}] https://goerli.etherscan.io/tx/${receipt?.transactionHash}`);
}

const main = async () => {
    const safeSdkForOwner1 = await deploySafeAA();
    const safeAAaddr = await getSafeAddr(safeSdkForOwner1);
    console.log(`safeAAaddr: ${safeAAaddr}`);
    // await sendEthToSafe(safeAAaddr);
    // const safeTransaction = await createTx(await owner1Signer.getAddress(), safeSdkForOwner1);
    // await proposeTx(safeTransaction, safeSdkForOwner1, safeAAaddr);
    // // get pending transactions
    // const pendingTransactions = (await safeService.getPendingTransactions(safeAAaddr)).results;
    // await confirmTx(pendingTransactions, safeAAaddr);

    // const safeTxHash = await safeSdkForOwner1.getTransactionHash(safeTransaction);
    // await executeTx(safeTxHash, safeSdkForOwner1);

    // // Confirm that the transaction was executed
    // // You know that the transaction was executed if the balance in your Safe changes.
    // const afterBalanceAtSafeSdkForOwner1 = await safeSdkForOwner1.getBalance();
    // console.log(`The final balance of the Safe: ${ethers.utils.formatUnits(afterBalanceAtSafeSdkForOwner1, 'ether')} ETH`);
}
main();
