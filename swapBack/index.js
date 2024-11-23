const express = require("express");
const axios = require("axios");
const Moralis = require("moralis").default;
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Initialize Express App
const app = express();
const port = process.env.PORT || 3001;

// Validate Environment Variables
if (!process.env.MORALIS_KEY || !process.env.ONE_INCH_API_KEY) {
  console.error("MORALIS_KEY or ONE_INCH_API_KEY is not set in the environment variables.");
  process.exit(1);
}

// Middleware
app.use(cors({ origin: process.env.NODE_ENV === "production" ? "https://tokenswap-utpp.onrender.com" : "*" }));
app.use(express.json());

// Rate Limiter for Security
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(apiLimiter);

// Utility: Retry logic with exponential backoff
async function fetchWithRetry(url, config, retries = 3, method = "get") {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = method === "get"
        ? await axios.get(url, config)
        : await axios.post(url, config.data, config);
      return response.data;
    } catch (error) {
      if (attempt < retries && error.response?.status === 429) {
        console.warn(`Rate limit hit. Retrying in ${attempt * 1000}ms...`);
        await delay(attempt * 1000); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// Routes
// 1inch API: Swap Route
app.get("/api/1inch-swap", async (req, res) => {
  try {
    const response = await fetchWithRetry("https://api.1inch.dev/swap/v6.0/1/swap", {
      params: req.query,
      headers: { Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}` },
    });
    res.json(response);
  } catch (error) {
    console.error("Error fetching swap data:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 1inch API: Approve Transaction
app.get("/api/1inch-approve-transaction", async (req, res) => {
  try {
    const response = await fetchWithRetry(
      "https://api.1inch.dev/swap/v6.0/1/approve/transaction",
      {
        params: req.query,
        headers: { Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}` },
      }
    );
    res.json(response);
  } catch (error) {
    console.error("Error fetching approve transaction:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 1inch API: Allowance
app.get("/api/1inch-allowance", async (req, res) => {
  const { tokenAddress, walletAddress } = req.query;
  if (!tokenAddress || !walletAddress) {
    return res.status(400).json({ error: "tokenAddress and walletAddress are required." });
  }

  try {
    const response = await fetchWithRetry(
      "https://api.1inch.dev/swap/v6.0/1/approve/allowance",
      {
        params: { tokenAddress, walletAddress },
        headers: { Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}` },
      }
    );
    res.json(response);
  } catch (error) {
    console.error("Error fetching allowance data:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Moralis: Token Prices Route
app.get("/tokenPrice", async (req, res) => {
  const { addressOne, addressTwo } = req.query;
  if (!addressOne || !addressTwo) {
    return res.status(400).json({ error: "addressOne and addressTwo are required." });
  }

  try {
    const [responseOne, responseTwo] = await Promise.all([
      Moralis.EvmApi.token.getTokenPrice({ address: addressOne }),
      Moralis.EvmApi.token.getTokenPrice({ address: addressTwo }),
    ]);

    if (!responseOne || !responseTwo) {
      return res.status(400).json({ error: "Failed to fetch one or both token prices." });
    }

    const usdPrices = {
      tokenOne: responseOne.raw.usdPrice || 0,
      tokenTwo: responseTwo.raw.usdPrice || 0,
      ratio: (responseOne.raw.usdPrice / responseTwo.raw.usdPrice) || 0,
    };

    res.status(200).json(usdPrices);
  } catch (error) {
    console.error("Error fetching token prices:", error.message);
    res.status(500).json({ error: "Failed to fetch token prices. Please try again." });
  }
});

// Start Server with Moralis Initialization
(async () => {
  try {
    await Moralis.start({ apiKey: process.env.MORALIS_KEY });
    app.listen(port, () => {
      console.log(`Listening for API Calls on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start Moralis:", error.message);
    process.exit(1);
  }
})();
