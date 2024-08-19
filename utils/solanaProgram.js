const fs = require('fs');
const path = require('path');
const { Keypair, Connection, SystemProgram, PublicKey, clusterApiUrl, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction} = require('@solana/web3.js');
// const anchor = require('@project-serum/anchor');
const {Wallet, Program, AnchorProvider, web3, utils,BN, workspace, setProvider} = require('@coral-xyz/anchor');
const idl = require('../idl/evoting.json'); // Ensure your IDL is updated with the latest program information.

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const interactWithSolanaProgram = async () => {
  const idlObj = idl;
  const programAddress = idlObj.address;
  const programID = new PublicKey(programAddress);

  // Load owner keypair
  const ownerKeypairPath = path.resolve(__dirname, '../idl/owner.json');
  if (!fs.existsSync(ownerKeypairPath)) {
    throw new Error(`Keypair file not found at path: ${ownerKeypairPath}`);
  }
  const ownerSecretKey = JSON.parse(fs.readFileSync(ownerKeypairPath, 'utf-8'));
  const ownerFixedWallet = Keypair.fromSecretKey(new Uint8Array(ownerSecretKey));

  // Create provider for owner
  const ownerProvider = new AnchorProvider(connection, new Wallet(ownerFixedWallet), AnchorProvider.defaultOptions());
  setProvider(ownerProvider);

  // Load sender keypair
  const senderKeypairPath = path.resolve(__dirname, '../idl/sender.json');
  if (!fs.existsSync(senderKeypairPath)) {
    throw new Error(`Keypair file not found at path: ${senderKeypairPath}`);
  }
  const senderSecretKey = JSON.parse(fs.readFileSync(senderKeypairPath, 'utf-8'));
  const senderFixedWallet = Keypair.fromSecretKey(new Uint8Array(senderSecretKey));

  // Create provider for sender
  const senderProvider = new AnchorProvider(connection, new Wallet(senderFixedWallet), AnchorProvider.defaultOptions());

  if (!senderProvider) {
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderFixedWallet.publicKey,
        toPubkey: ownerFixedWallet.publicKey,
        lamports: LAMPORTS_PER_SOL, // Transfer 1 SOL
      })
    );

    // Fetch latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderFixedWallet.publicKey;

    console.log("Sender: "+senderProvider.publicKey.toBase58())
    console.log("Owner: "+ownerProvider.publicKey.toBase58())

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [senderFixedWallet]);

    console.log("Transaction Signature:", signature);
  } else {
    try {
      const program = new Program(idlObj, programID, senderProvider);
      const tx = await program.methods.initialize().rpc()
      console.log(tx)
      //   senderProvider.publicKey
      // }).signers([senderProvider.publicKey]).rpc();
      // if (tx) {
      //   console.log('Initialization successful');
      // }
    } catch (error) {
      console.error('Error initializing:', error);
    }
  }
};


module.exports = { interactWithSolanaProgram };
