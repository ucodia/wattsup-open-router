const https = require("https");
const cheerio = require("cheerio");
const express = require("express");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 300 });

function downloadHtml(url) {
  return new Promise((resolve, reject) => {
    const cacheKey = url;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return resolve(cachedData);
    }

    const request = https.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        cache.set(cacheKey, data);
        resolve(data);
      });
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
}

function extractDataKey(content, dataKey) {
  const dataKeyIndex = content.indexOf(dataKey);
  const isArray =
    content.indexOf("[", dataKeyIndex) < content.indexOf("{", dataKeyIndex);
  const openChar = isArray ? "[" : "{";
  const closeChar = isArray ? "]" : "}";
  const startIndex = content.indexOf(openChar, dataKeyIndex);

  let endIndex = startIndex;
  let depth = 0;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  const dataString = content.substring(startIndex, endIndex + 1);
  return JSON.parse(dataString);
}

function extractData(html) {
  const data = {};
  const $ = cheerio.load(html);

  $("script")
    .toArray()
    .forEach((element) => {
      const content = $(element).html().replace(/\\/g, "");

      if (
        content.includes("rankingData") &&
        content.includes("model_permaslug")
      ) {
        data.modelUsage = extractDataKey(content, "rankingData");
      } else if (content.includes("rankMap")) {
        data.appUsage = extractDataKey(content, "rankMap");
      }
    });

  return data;
}

async function getRankingsData() {
  let modelUsage = {};
  let appUsage = {};

  await Promise.all(
    ["day", "week", "month"].map(async (period) => {
      const html = await downloadHtml(
        `https://openrouter.ai/rankings?view=${period}`
      );
      const data = extractData(html);
      modelUsage[period] = data.modelUsage;
      appUsage = data.appUsage;
    })
  );

  return {
    modelUsage,
    appUsage,
  };
}

const app = express();
const port = process.env.PORT || 8888;

app.use(express.json());

app.get("/rankings", async (req, res) => {
  try {
    const rankingsData = await getRankingsData();
    res.json(rankingsData);
  } catch (error) {
    console.error("Error fetching rankings:", error.message);
    res.status(500).json({
      error: "Failed to fetch rankings data",
      message: error.message,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
