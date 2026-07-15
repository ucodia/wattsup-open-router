import { NextResponse } from "next/server";

export const revalidate = 300;

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} responded with status ${response.status}`);
  }
  return response.json();
}

function processModelUsage(item, models) {
  const model = models.find(
    (model) =>
      model?.permaslug === item.variant_permaslug ||
      model?.permaslug === item.model_permaslug
  );

  // TODO: investigate rare cases where is not matching model

  return {
    id: item.variant_permaslug,
    name: model?.short_name,
    author: model?.author,
    tokens: item.total_completion_tokens + item.total_prompt_tokens,
    promptTokens: item.total_prompt_tokens,
    completionTokens: item.total_completion_tokens,
    requestCount: item.count,
    url: `https://openrouter.ai/${model?.slug}`,
    authorUrl: `https://openrouter.ai/${model?.author}`,
  };
}

function processAppUsage(item) {
  return {
    id: item.app.id.toString(),
    name: item.app.title,
    tokens: Number(item.total_tokens),
    description: item.app.description,
    url: item.app.origin_url,
  };
}

async function fetchRankings() {
  const modelUsage = {};
  const appUsage = {};

  try {
    const models = await fetchJson(
      "https://openrouter.ai/api/frontend/v1/models",
      { cache: "no-store" } // avoid 2MB cache limit error
    );

    const appRankings = await fetchJson(
      "https://openrouter.ai/api/frontend/v1/rankings/apps",
      { next: { revalidate: 300 } }
    );

    await Promise.all(
      ["day", "week", "month"].map(async (period) => {
        const modelRankings = await fetchJson(
          `https://openrouter.ai/api/frontend/v1/rankings/models?view=${period}`,
          { next: { revalidate: 300 } }
        );
        modelUsage[period] = modelRankings.data.map((item) =>
          processModelUsage(item, models)
        );
        appUsage[period] = appRankings.data[period].map(processAppUsage);
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
