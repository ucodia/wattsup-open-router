import { load } from "cheerio";
import { NextResponse } from "next/server";

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
    if (char === openChar) depth++;
    else if (char === closeChar) {
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
  const $ = load(html);
  $("script")
    .toArray()
    .forEach((el) => {
      const content = $(el).html().replace(/\\/g, "");
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

async function fetchRankings() {
  const modelUsage = {};
  let appUsage = {};

  try {
    await Promise.all(
      ["day", "week", "month"].map(async (period) => {
        const response = await fetch(
          `https://openrouter.ai/rankings?view=${period}`,
          { next: { revalidate: 300 } }
        );
        const html = await response.text();
        const data = extractData(html);
        modelUsage[period] = data.modelUsage;
        appUsage = data.appUsage;
      })
    );
  } catch (error) {
    throw new Error(`Failed to fetch rankings data: ${error.message}`);
  }

  return { modelUsage, appUsage };
}

export async function GET() {
  try {
    const data = await fetchRankings();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching live rankings:", err);
    return NextResponse.json(
      { error: "Failed to fetch rankings data", message: err.message },
      { status: 500 }
    );
  }
}
