
#     Token Swap dApp
 A decentralized application (dApp) that enables users to swap tokens on ethereum blockchain. The dApp integrates the 1inch API for swapping functionality, Moralis API for token price data, and

## Features
- #### Token Swapping: 
Allows users to exchange tokens using the 1inch aggregation protocol.
Allowance Management: Enables users to check and approve token allowances.
- #### Price Display:
 Fetches and displays token prices with real-time data.
- #### Responsive Design:
 User-friendly interface for desktop and mobile users.
#### Technologies Used
Frontend
- React.js 
- WAGMI library for Web3 wallet integration

- Axios for API requests
- CSS for styling
Backend
- Node.js with Express.js
- 1inch API for token swapping
- Moralis API for token prices
- dotenv for environment configuration
-Cors for cross-origin resource sharing
### Blockchain
 #### Ethereum
### Setup and Installation
#### Prerequisites
- Node.js (version 16 or later)
- npm or yarn
- MetaMask or another Web3 wallet
### Clone the Repository
```bash
git clone https://github.com/Edoscoba/Token-Swap-dApp.git
```
```bash
cd token-swap-dapp
```

### Backend Setup
#### Navigate to the backend directory:
```bash
cd swapBack
```
#### Install dependencies:
```bash
npm install
```
-Create a .env file in the backend directory with the following variables:
### env

- MORALIS_KEY=your_moralis_api_key
- ONE_INCH_API_KEY=your_1inch_api_key
- PORT=3001
### Start the backend server:
```bash
node index.js
```
- The backend will start on http://localhost:3001.

### Navigate to the frontend directory:

- cd frontend
#### Install dependencies:
```bash

npm install
npm run dev
```
- The frontend will start on http://localhost:3000.
## Usage
- Open the dApp in your browser: http://localhost:3000
- Connect your Web3 wallet using the Connect Wallet button.
Choose the tokens you want to swap
- Review the token allowance. Approve the transaction if required.
- Confirm the swap transaction in your wallet.
Available Scripts
### Backend
```bash
npm start: Starts the backend server.
```
### Frontend
```bash
npm run dev: Starts the frontend development server.
npm run build: Builds the frontend for production.
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

Contact
For support or inquiries, please reach out to [obisimon86@gmail.com].
"


