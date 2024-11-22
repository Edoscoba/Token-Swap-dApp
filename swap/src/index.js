import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { configureChains, createConfig } from 'wagmi'
import { WagmiProvider, WagmiConfig, createClient } from "wagmi";
import { mainnet, sepolia } from 'wagmi/chains'
import { publicProvider } from "wagmi/providers/public";


const { provider, web3SocketProvider } = configureChains(
  [mainnet, sepolia],
  [publicProvider()]
);

const client = createClient({
  autoConnect: true,
  provider,
  web3SocketProvider,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WagmiConfig>
  </React.StrictMode>
);
