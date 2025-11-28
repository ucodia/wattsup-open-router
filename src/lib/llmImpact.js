/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// EcoLogits 0.8 JavaScript implementation
// Provides the same llmImpact function as the official python library
// with simplified interface and without DAG

import electricityMixes from "./data/electricity-mixes.json";
import models from "./data/models.json";

function isRange(v) {
  return typeof v === "object" && v !== null && "min" in v && "max" in v;
}

function toRange(v) {
  if (isRange(v)) return v;
  return { min: v, max: v };
}

function addRange(a, b) {
  const ra = toRange(a);
  const rb = toRange(b);
  return { min: ra.min + rb.min, max: ra.max + rb.max };
}

function mulRange(a, scalar) {
  const ra = toRange(a);
  return { min: ra.min * scalar, max: ra.max * scalar };
}

function ltRange(a, b) {
  const ra = toRange(a);
  return ra.max < b;
}

function findModel(provider, name) {
  const alias = (models.aliases || []).find(
    (a) => a.provider === provider && a.name === name
  );
  if (alias) name = alias.alias;
  return (models.models || []).find(
    (m) => m.provider === provider && m.name === name
  );
}

function findMix(zone) {
  return electricityMixes.find((mix) => mix.name === zone);
}

const MODEL_QUANTIZATION_BITS = 4;
const GPU_ENERGY_ALPHA = 8.91e-8;
const GPU_ENERGY_BETA = 1.43e-6;
const GPU_ENERGY_STDEV = 5.19e-7;
const GPU_LATENCY_ALPHA = 8.02e-4;
const GPU_LATENCY_BETA = 2.23e-2;
const GPU_LATENCY_STDEV = 7.0e-6;
const GPU_MEMORY = 80; // GB
const GPU_EMBODIED_IMPACT_GWP = 143;
const GPU_EMBODIED_IMPACT_ADPE = 5.1e-3;
const GPU_EMBODIED_IMPACT_PE = 1828;
const SERVER_GPUS = 8;
const SERVER_POWER = 1; // kW
const SERVER_EMBODIED_IMPACT_GWP = 3000;
const SERVER_EMBODIED_IMPACT_ADPE = 0.24;
const SERVER_EMBODIED_IMPACT_PE = 38000;
const HARDWARE_LIFESPAN = 5 * 365 * 24 * 60 * 60;
const DATACENTER_PUE = 1.2;

function computeImpactsOnce(opts) {
  const { activeParams, totalParams, outputTokens, requestLatency, mix } = opts;
  const energyPerToken = GPU_ENERGY_ALPHA * activeParams + GPU_ENERGY_BETA;
  const gpuEnergy = {
    min: Math.max(0, outputTokens * (energyPerToken - 1.96 * GPU_ENERGY_STDEV)),
    max: outputTokens * (energyPerToken + 1.96 * GPU_ENERGY_STDEV),
  };

  const latencyPerToken = GPU_LATENCY_ALPHA * activeParams + GPU_LATENCY_BETA;
  const latencyInterval = {
    min: Math.max(
      0,
      outputTokens * (latencyPerToken - 1.96 * GPU_LATENCY_STDEV)
    ),
    max: outputTokens * (latencyPerToken + 1.96 * GPU_LATENCY_STDEV),
  };
  const generationLatency = ltRange(latencyInterval, requestLatency)
    ? latencyInterval
    : requestLatency;
  const genLatRange = toRange(generationLatency);

  const modelMemory = (1.2 * totalParams * MODEL_QUANTIZATION_BITS) / 8;
  const gpuCount = Math.ceil(modelMemory / GPU_MEMORY);

  const serverEnergy = mulRange(
    genLatRange,
    (SERVER_POWER / 3600) * (gpuCount / SERVER_GPUS)
  );
  const requestEnergy = mulRange(
    addRange(serverEnergy, mulRange(gpuEnergy, gpuCount)),
    DATACENTER_PUE
  );

  const usageGWP = mulRange(requestEnergy, mix.gwp);
  const usageADPe = mulRange(requestEnergy, mix.adpe);
  const usagePE = mulRange(requestEnergy, mix.pe);

  const serverGpuEmbodiedGWP =
    (gpuCount / SERVER_GPUS) * SERVER_EMBODIED_IMPACT_GWP +
    gpuCount * GPU_EMBODIED_IMPACT_GWP;
  const serverGpuEmbodiedADPe =
    (gpuCount / SERVER_GPUS) * SERVER_EMBODIED_IMPACT_ADPE +
    gpuCount * GPU_EMBODIED_IMPACT_ADPE;
  const serverGpuEmbodiedPE =
    (gpuCount / SERVER_GPUS) * SERVER_EMBODIED_IMPACT_PE +
    gpuCount * GPU_EMBODIED_IMPACT_PE;

  const embodiedGWP = mulRange(
    genLatRange,
    serverGpuEmbodiedGWP / HARDWARE_LIFESPAN
  );
  const embodiedADPe = mulRange(
    genLatRange,
    serverGpuEmbodiedADPe / HARDWARE_LIFESPAN
  );
  const embodiedPE = mulRange(
    genLatRange,
    serverGpuEmbodiedPE / HARDWARE_LIFESPAN
  );

  return {
    request_energy: requestEnergy,
    request_usage_gwp: usageGWP,
    request_usage_adpe: usageADPe,
    request_usage_pe: usagePE,
    request_embodied_gwp: embodiedGWP,
    request_embodied_adpe: embodiedADPe,
    request_embodied_pe: embodiedPE,
  };
}

function mergeRanges(a, b) {
  const ra = toRange(a);
  const rb = toRange(b);
  return { min: Math.min(ra.min, rb.min), max: Math.max(ra.max, rb.max) };
}

function computeLLMImpacts(opts) {
  const { activeParams, totalParams, outputTokens, requestLatency, mix } = opts;
  const activeVals = isRange(activeParams)
    ? [activeParams.min, activeParams.max]
    : [activeParams, activeParams];
  const totalVals = isRange(totalParams)
    ? [totalParams.min, totalParams.max]
    : [totalParams, totalParams];

  const fields = [
    "request_energy",
    "request_usage_gwp",
    "request_usage_adpe",
    "request_usage_pe",
    "request_embodied_gwp",
    "request_embodied_adpe",
    "request_embodied_pe",
  ];
  const results = {};
  for (let i = 0; i < activeVals.length; i++) {
    const res = computeImpactsOnce({
      activeParams: activeVals[i],
      totalParams: totalVals[i],
      outputTokens,
      requestLatency,
      mix,
    });
    for (const f of fields) {
      if (!results[f]) {
        results[f] = res[f];
      } else {
        results[f] = mergeRanges(results[f], res[f]);
      }
    }
  }

  const energy = results.request_energy;
  const gwpUsage = results.request_usage_gwp;
  const adpeUsage = results.request_usage_adpe;
  const peUsage = results.request_usage_pe;
  const gwpEmbodied = results.request_embodied_gwp;
  const adpeEmbodied = results.request_embodied_adpe;
  const peEmbodied = results.request_embodied_pe;

  return {
    energy,
    gwp: addRange(gwpUsage, gwpEmbodied),
    adpe: addRange(adpeUsage, adpeEmbodied),
    pe: addRange(peUsage, peEmbodied),
    usage: {
      energy,
      gwp: gwpUsage,
      adpe: adpeUsage,
      pe: peUsage,
    },
    embodied: {
      gwp: gwpEmbodied,
      adpe: adpeEmbodied,
      pe: peEmbodied,
    },
  };
}

function llmImpact(
  activeParams,
  totalParams,
  outputTokenCount,
  requestLatency,
  electricityMixZone = "WOR",
  requestCount = 1
) {
  //   const model = findModel(provider, modelName);
  //   if (!model) {
  //     throw new Error(
  //       `Could not find model \`${modelName}\` for ${provider} provider.`
  //     );
  //   }
  const mix = findMix(electricityMixZone);
  if (!mix) {
    throw new Error(
      `Could not find electricity mix for zone \`${electricityMixZone}\`.`
    );
  }

  //   let totalParams;
  //   let activeParams;
  //   if (model.architecture.type === "moe") {
  //     totalParams = model.architecture.parameters.total;
  //     activeParams = model.architecture.parameters.active;
  //   } else {
  //     totalParams = model.architecture.parameters;
  //     activeParams = model.architecture.parameters;
  //   }

  const singleImpact = computeLLMImpacts({
    activeParams,
    totalParams,
    outputTokens: outputTokenCount,
    requestLatency,
    mix,
  });

  if (requestCount === 1) {
    return singleImpact;
  }

  return {
    energy: mulRange(singleImpact.energy, requestCount),
    gwp: mulRange(singleImpact.gwp, requestCount),
    adpe: mulRange(singleImpact.adpe, requestCount),
    pe: mulRange(singleImpact.pe, requestCount),
    usage: {
      energy: mulRange(singleImpact.usage.energy, requestCount),
      gwp: mulRange(singleImpact.usage.gwp, requestCount),
      adpe: mulRange(singleImpact.usage.adpe, requestCount),
      pe: mulRange(singleImpact.usage.pe, requestCount),
    },
    embodied: {
      gwp: mulRange(singleImpact.embodied.gwp, requestCount),
      adpe: mulRange(singleImpact.embodied.adpe, requestCount),
      pe: mulRange(singleImpact.embodied.pe, requestCount),
    },
  };
}

export default llmImpact;
