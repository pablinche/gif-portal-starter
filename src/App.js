import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { Buffer } from "buffer";
import kp from './keypair.json'
window.Buffer = Buffer;


// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Use keypair.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// This is the address of your solana program, if you forgot, just run solana address -k target/deploy/myepicproject-keypair.json
const programID = new PublicKey('2U1AKR5nCLe4cUdKkrXscXEomWZAWArGTVHv8micZPvk');

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'kyogenclash';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

/*
const TEST_GIFS = [
  'https://media.giphy.com/media/hTDFjlnLtjkDKzATgp/giphy-downsized-large.gif',
  'https://media.giphy.com/media/Zg51pFbwzcTcI/giphy.gif',
  'https://media.giphy.com/media/xThtauMOoaoOSQgpFK/giphy.gif'
]
*/

const App = () => {
  /*
  * checkIfWalletIsConnected function holds the logic for deciding if a Phantom 
  * Wallet is connected or not
  */

  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);


  const checkIfWalletIsConnected = async () => {
  // We're using optimal chaining (question mark) to check if the object is null
    if (window?.solana?.isPhantom) {
      console.log('Phantom wallet found!');
      /*
      * The solana object gives us a function that will allow us to connect
      * directly with the user's wallet
      */
      const response = await window.solana.connect({ onlyIfTrusted: true});
      console.log(
        'Connected with Public Key:',
        response.publicKey.toString()
      );

      /* 
      * Set the user's publicKey in state to be used later!
      */
     setWalletAddress(response.publicKey.toString());
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻');
    }
  };

  /* 
  * Let's define this method so our code doesn't break.
  * We will write the logic for this next!
  */
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider()
      const program = await getProgram(); 
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider (
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();
      
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  /* 
  * We want to render this UI when the user hasn't connected
  * their wallet to our app yet.
  */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
      if (gifList === null) {
        return (
          <div className="connected-container">
            <button className="cta-button submit-gif-button" onClick={createGifAccount}>
              Do One-Time Initialization For GIF Program Account
            </button>
          </div>
        )
      } 
      // Otherwise, we're good! Account exists. User can submit GIFs.
      else {
        return(
          <div className="connected-container">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendGif();
              }}
            >
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <button type="submit" className="cta-button submit-gif-button">
                Submit
              </button>
            </form>
            <div className="gif-grid">
              {/* We use index as the key instead, also, the src is now item.gifLink */}
              {gifList.map((item, index) => (
                <div className="gif-item" key={index}>
                  <img src={item.gifLink} alt='' />
                  <p className="footer-text">User Address: <br></br>{item.userAddress.toString()}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
    }
  /*
  * When our component firt mounts, let's check to see if we have a connected
  * Phantom Wallet
  */  
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  
  const getProgram = async () => {
    // Get metadata about your solana program
    const idl = await Program.fetchIdl(programID, getProvider());
    // Create a program that you can call
    return new Program(idl, programID, getProvider());
  };
  
  const getGifList = async() => {
    try {
      const program = await getProgram(); 
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    } // eslint-disable-next-line
  }, [walletAddress]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
      <div className={walletAddress ? 'authed-container' : 'container'}>
          <div className="header-container">
            <p className="header">🖼 Kyo themed GIFs</p>
            <p className="sub-text">
              View your GIF collection in the metaverse ✨
            </p>
            {/* Add the condition to show this only if we don't have a wallet address */}
            {!walletAddress && renderNotConnectedContainer()}
            {walletAddress && renderConnectedContainer()}
          </div>
          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built on @${TWITTER_HANDLE}`}</a>
          </div>
      </div>
    </div>
  );
};

export default App;
