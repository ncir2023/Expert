const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    AccountBalanceQuery,
    TransferTransaction, 
    Hbar,
} = require("@hashgraph/sdk");

require("dotenv").config();

// Grab your Hedera testnet account ID and private key from your .env file
const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.MY_PRIVATE_KEY;

// If we weren't able to grab it, we should throw a new error
if (!myAccountId || !myPrivateKey) {
    throw new Error(
        "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
}

// Create your Hedera Testnet client
const client = Client.forTestnet();

// Set your account as the client's operator
client.setOperator(myAccountId, myPrivateKey);

// Set the default maximum transaction fee (in Hbar) pour eviter INSUFFICIENT_TX_FEE error
client.setDefaultMaxTransactionFee(new Hbar(100));

async function createNewAccount(client) {
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    //console.log("The new account private key is: " + newAccountPrivateKey.toString());

    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(100))
        .execute(client);

    // Get the new account ID
    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log("The new account ID is: " + newAccountId);

    // Check the account balance
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log("The new account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");

    return { privateKey: newAccountPrivateKey, accountId: newAccountId };
}


async function checkAccountBalance(client, accountId) {
    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

    console.log("The account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");
}




// Fonction pour transférer des Hbar d'un compte à un autre
async function transferHbar(senderId, receiverId,amount) {
    try {
      // Crée la transaction de transfert
      const sendHbar = await new TransferTransaction()
        .addHbarTransfer(senderId, Hbar.fromTinybars(-amount)) // Compte expéditeur
        .addHbarTransfer(receiverId, Hbar.fromTinybars(amount)) // Compte destinataire
        .execute(client);
  
      // Vérifie si la transaction a atteint le consensus
      const transactionReceipt = await sendHbar.getReceipt(client);
      console.log("The transfer transaction from " + senderId + " to " + receiverId + " was: " + transactionReceipt.status.toString());
    } catch (error) {
      console.error("Error transferring Hbar:", error);
    }
  }


async function main() {
    const { privateKey, accountId } = await createNewAccount(client);
    console.log("Private Key:", privateKey.toString());
    console.log("Account ID:", accountId.toString());
    await checkAccountBalance(client, accountId);
    await transferHbar(myAccountId,accountId,50);
    await checkAccountBalance(client, accountId);


}

main().catch(error => console.error(error));
