# OpenGap

After-hours opening-gap prediction market interface for Robinhood Chain.

## Pages

- index.html - project landing page
- app.html - interactive market terminal

## Local development

This is a static frontend with no build step. Run:

    python -m http.server 4188

Then open:

- http://127.0.0.1:4188/
- http://127.0.0.1:4188/app.html

## Wallet network

The app connects through an injected EIP-1193 browser wallet and requests Robinhood Chain mainnet when needed.

- Chain ID: 4663
- Currency: ETH
- RPC: https://rpc.mainnet.chain.robinhood.com/
- Explorer: https://robinhoodchain.blockscout.com/

## Social

- X: https://x.com/opengapdotfun

## Status

Frontend prototype. Market pricing and order submission are currently interface simulations; production trading requires deployed market contracts and backend/indexing infrastructure.