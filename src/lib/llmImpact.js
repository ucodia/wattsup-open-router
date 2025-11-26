/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// EcoLogits 0.9 JavaScript implementation
// Provides the same llmImpact function as the official python library
// with simplified interface and without DAG

import electricityMixes from "./data/electricity_mixes.json";

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

const MODEL_QUANTIZATION_BITS = 16;
const GPU_ENERGY_ALPHA = 1.1665273170451914e-6;
const GPU_ENERGY_BETA = -0.011205921025579175;
const GPU_ENERGY_GAMMA = 4.052928146734005e-5;
const LATENCY_ALPHA = 0.0006785088094353663;
const LATENCY_BETA = 0.0003119310311688259;
const LATENCY_GAMMA = 0.019473717579473387;
const GPU_MEMORY = 80; // GB
const GPU_EMBODIED_IMPACT_GWP = 164;
const GPU_EMBODIED_IMPACT_ADPE = 5.1e-3;
const GPU_EMBODIED_IMPACT_PE = 1828;
const SERVER_GPUS = 8;
const SERVER_POWER = 1.2; // kW
const SERVER_EMBODIED_IMPACT_GWP = 5700;
const SERVER_EMBODIED_IMPACT_ADPE = 0.37;
const SERVER_EMBODIED_IMPACT_PE = 70000;
const HARDWARE_LIFESPAN = 3 * 365 * 24 * 60 * 60;
const BATCH_SIZE = 64;

function computeImpactsOnce(opts) {
  const {
    activeParams,
    totalParams,
    outputTokens,
    requestLatency,
    mix,
    datacenterPue,
    datacenterWue,
  } = opts;

  const gpuEnergyPerToken =
    (GPU_ENERGY_ALPHA * Math.exp(GPU_ENERGY_BETA * BATCH_SIZE) * activeParams +
      GPU_ENERGY_GAMMA) /
    1000; // convert to kWh
  const gpuEnergy = outputTokens * gpuEnergyPerToken;

  const latencyPerToken =
    LATENCY_ALPHA * activeParams + LATENCY_BETA * BATCH_SIZE + LATENCY_GAMMA;
  const gpuLatency = outputTokens * latencyPerToken;
  const generationLatency =
    requestLatency < gpuLatency ? requestLatency : gpuLatency;

  const modelMemory = (1.2 * totalParams * MODEL_QUANTIZATION_BITS) / 8;
  const gpuCount =
    2 ** Math.ceil(Math.log2(Math.ceil(modelMemory / GPU_MEMORY)));

  const serverEnergy =
    (generationLatency / 3600) *
    SERVER_POWER *
    (gpuCount / SERVER_GPUS) *
    (1 / BATCH_SIZE);

  const requestEnergy = mulRange(
    toRange(datacenterPue),
    serverEnergy + gpuCount * gpuEnergy
  );

  const usageGWP = mulRange(requestEnergy, mix.gwp);
  const usageADPe = mulRange(requestEnergy, mix.adpe);
  const usagePE = mulRange(requestEnergy, mix.pe);
  const pueRange = toRange(datacenterPue);
  const wueRange = toRange(datacenterWue);
  const pueTimesElecWue = mulRange(pueRange, mix.wue);
  const totalWueFactor = addRange(wueRange, pueTimesElecWue);
  const usageWCF = mulRange(
    requestEnergy,
    totalWueFactor.min === totalWueFactor.max
      ? totalWueFactor.min
      : totalWueFactor
  );

  const serverGpuEmbodiedGWP =
    (gpuCount / SERVER_GPUS) * SERVER_EMBODIED_IMPACT_GWP +
    gpuCount * GPU_EMBODIED_IMPACT_GWP;
  const serverGpuEmbodiedADPe =
    (gpuCount / SERVER_GPUS) * SERVER_EMBODIED_IMPACT_ADPE +
    gpuCount * GPU_EMBODIED_IMPACT_ADPE;
  const serverGpuEmbodiedPE =
    (gpuCount / SERVER_GPUS) * SERVER_EMBODIED_IMPACT_PE +
    gpuCount * GPU_EMBODIED_IMPACT_PE;

  const embodiedGWP =
    (generationLatency * serverGpuEmbodiedGWP) /
    (HARDWARE_LIFESPAN * BATCH_SIZE);
  const embodiedADPe =
    (generationLatency * serverGpuEmbodiedADPe) /
    (HARDWARE_LIFESPAN * BATCH_SIZE);
  const embodiedPE =
    (generationLatency * serverGpuEmbodiedPE) /
    (HARDWARE_LIFESPAN * BATCH_SIZE);

  return {
    request_energy: requestEnergy,
    request_usage_gwp: usageGWP,
    request_usage_adpe: usageADPe,
    request_usage_pe: usagePE,
    request_usage_wcf: usageWCF,
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
  const {
    activeParams,
    totalParams,
    outputTokens,
    requestLatency,
    mix,
    datacenterPue,
    datacenterWue,
  } = opts;

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
    "request_usage_wcf",
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
      datacenterPue,
      datacenterWue,
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
  const wcfUsage = results.request_usage_wcf;
  const gwpEmbodied = results.request_embodied_gwp;
  const adpeEmbodied = results.request_embodied_adpe;
  const peEmbodied = results.request_embodied_pe;

  return {
    energy,
    gwp: addRange(gwpUsage, gwpEmbodied),
    adpe: addRange(adpeUsage, adpeEmbodied),
    pe: addRange(peUsage, peEmbodied),
    wcf: wcfUsage,
    usage: {
      energy,
      gwp: gwpUsage,
      adpe: adpeUsage,
      pe: peUsage,
      wcf: wcfUsage,
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
  datacenterPue,
  datacenterWue,
  requestLatency,
  electricityMixZone = "WOR",
  requestCount = 1
) {
  const mix = electricityMixes[electricityMixZone];
  if (!mix) {
    throw new Error(
      `Could not find electricity mix for zone \`${electricityMixZone}\`.`
    );
  }

  const singleImpact = computeLLMImpacts({
    activeParams,
    totalParams,
    outputTokens: outputTokenCount,
    requestLatency: requestLatency === undefined ? Infinity : requestLatency,
    mix,
    datacenterPue,
    datacenterWue,
  });

  if (requestCount === 1) {
    return singleImpact;
  }

  return {
    energy: mulRange(singleImpact.energy, requestCount),
    gwp: mulRange(singleImpact.gwp, requestCount),
    adpe: mulRange(singleImpact.adpe, requestCount),
    pe: mulRange(singleImpact.pe, requestCount),
    wcf: mulRange(singleImpact.wcf, requestCount),
    usage: {
      energy: mulRange(singleImpact.usage.energy, requestCount),
      gwp: mulRange(singleImpact.usage.gwp, requestCount),
      adpe: mulRange(singleImpact.usage.adpe, requestCount),
      pe: mulRange(singleImpact.usage.pe, requestCount),
      wcf: mulRange(singleImpact.usage.wcf, requestCount),
    },
    embodied: {
      gwp: mulRange(singleImpact.embodied.gwp, requestCount),
      adpe: mulRange(singleImpact.embodied.adpe, requestCount),
      pe: mulRange(singleImpact.embodied.pe, requestCount),
    },
  };
}

export default llmImpact;
