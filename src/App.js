import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

// Constants
const TWITTER_HANDLE = 'kyogenclash';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  'https://media.giphy.com/media/hTDFjlnLtjkDKzATgp/giphy-downsized-large.gif',
  'https://media.giphy.com/media/Zg51pFbwzcTcI/giphy.gif',
  'https://media.giphy.com/media/xThtauMOoaoOSQgpFK/giphy.gif'
]


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
    if (inputValue.length > 0) {
      console.log('Gif link: ', inputValue);
      setGifList([...gifList, inputValue]);
      setInputValue('');
    } else {
      console.log('Empty Input. Try again.');
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

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

  const renderConnectedContainer = () => (
    <div className="connected-container">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendGif();
        }}
      >
        <input 
          type="text" 
          placeholder="Enter GIF link!" 
          value={inputValue}
          onChange={onInputChange}
        />
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      <div className="gif-grid">
        {gifList.map(gif => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif}/>
          </div>
        ))
        }
      </div>
    </div>
  );
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
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching Gif list...');

      // call solana program here

      // set state
      setGifList(TEST_GIFS);
    }
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
