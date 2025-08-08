const https = require("https");
const cheerio = require("cheerio");

function downloadHtml(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => resolve(data));
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

const keysOfInterest = ["rankingData", "rankMap"];

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

async function main() {
  let modelUsage = {};
  let appUsage = {};

  try {
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

    console.log(
      JSON.stringify(
        {
          modelUsage,
          appUsage,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
