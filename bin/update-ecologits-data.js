#!/usr/bin/env node

import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const TARGET_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/lib/data"
);
const ECOLOGITS_URL =
  "https://raw.githubusercontent.com/genai-impact/ecologits/refs/heads/main/ecologits/data";
const COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=cca3,name";

const fetchJson = (url) => fetch(url).then((response) => response.json());
const fetchText = (url) => fetch(url).then((response) => response.text());

const loadCountryNames = async () => {
  const countries = await fetchJson(COUNTRIES_URL);
  return countries.reduce((map, country) => {
    map.set(country.cca3, country.name.common);
    return map;
  }, new Map([["WOR", "World"]]));
};

const parseCsv = (csv) => {
  const [header, ...rows] = csv.trim().split("\n");
  const keys = header.split(",");
  return rows.map((row) => {
    const values = row.split(",");
    return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
  });
};

const main = async () => {
  const countryNames = await loadCountryNames();

  const [modelsJson, mixesCsv] = await Promise.all([
    fetchText(`${ECOLOGITS_URL}/models.json`),
    fetchText(`${ECOLOGITS_URL}/electricity_mixes.csv`),
  ]);

  const mixes = parseCsv(mixesCsv).map((mix) => ({
    ...mix,
    displayName: countryNames.get(mix.name),
  }));

  await Promise.all([
    writeFile(join(TARGET_DIR, "models.json"), modelsJson),
    writeFile(
      join(TARGET_DIR, "electricity-mixes.json"),
      JSON.stringify(mixes, null, 2)
    ),
  ]);
};

await main();
