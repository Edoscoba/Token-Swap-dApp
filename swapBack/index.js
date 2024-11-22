const express = require("express");
const axios = require("axios");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 3001;

if (!process.env.MORALIS_KEY || !process.env.ONE_INCH_API_KEY) {
  console.error("MORALIS_KEY or ONE_INCH_API_KEY is not set in the environment variables.");
  process.exit(1);
}

app.use(cors({ origin: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "*" }));
app.use(express.json());

// Utility: Retry logic with exponential backoff
async function fetchWithRetry(url, config, retries = 3) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, config);
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

// 1inch API: Swap Route
app.get("/api/1inch-swap", async (req, res) => {
  try {
    const response = await fetchWithRetry("https://api.1inch.dev/swap/v6.0/1/swap",
      {
        params: req.query,
        headers: {
          Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
        },
      });
    res.json(response);
  } catch (error) {
    console.error("Error fetching swap data:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// 1inch API: Approve Transaction
app.get("/api/1inch-approve-transaction", async (req, res) => {
  try {
    const response = await fetchWithRetry(
      "https://api.1inch.dev/swap/v6.0/1/approve/transaction",
      {
        params: req.query,
        headers: {
          Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
        },
      }
    );
    res.json(response);
  } catch (error) {
    console.error("Error fetching approve transaction:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// 1inch API: Allowance
app.get("/api/1inch-allowance", async (req, res) => {
  const { tokenAddress, walletAddress } = req.query;

  try {
    const response = await fetchWithRetry(
      "https://api.1inch.dev/swap/v6.0/1/approve/allowance",
      {
        params: { tokenAddress, walletAddress },
        headers: {
          Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
        },
      }
    );
    res.json(response);
  } catch (error) {
    console.error("Error fetching allowance data:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});




// Moralis: Token Prices Route
app.get("/tokenPrice", async (req, res) => {
  const { query } = req;
  try {
    const responseOne = await Moralis.EvmApi.token.getTokenPrice({ address: query.addressOne });
    const responseTwo = await Moralis.EvmApi.token.getTokenPrice({ address: query.addressTwo });
    const usdPrices = {
      tokenOne: responseOne.raw.usdPrice,
      tokenTwo: responseTwo.raw.usdPrice,
      ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice,
    };
    res.status(200).json(usdPrices);
  } catch (error) {
    console.error("Error fetching token prices:", error.message);
    res.status(500).json({ error: error.message });
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
