import os from 'os';
import fs from 'fs';
import ora from 'ora';
import download from 'download';
import chalk from 'chalk';
import { getConfigPath, readConfigs } from './configs.js';

export const BASE_URL = 'https://www.planetminecraft.com';

export const getCurrentUser = (): string => {
  return os.userInfo().username;
}

export const getMinecraftPath = (): string => {

  const configs = readConfigs();

  // if the path in the config file is not valid, thow an error and show the config path
  if (!fs.existsSync(configs.minecraftPath)) {
    console.log(chalk.red(`The path in the config file is not valid. Please check the config file at ${getConfigPath()}`));
    process.exit(1);
  }

  return configs.minecraftPath;
}

export const getMinecraftWorlds = (): string[] => {

  const worlds = fs.readdirSync(`${getMinecraftPath()}\\saves`);
  return worlds;
}

export const getMinecraftResourcePackPath = (): string => {
  return `${getMinecraftPath()}\\resourcepacks`;
}

export const normalizeDatapackName = (name: string) => {
  const nameWithoutSpacesAndDots = name.replace(/\-/g, ' ').replace(/\s+/g, '-');
  const normalized = nameWithoutSpacesAndDots.replaceAll(".", "");
  return normalized.toLowerCase();
}

export const extractDatapackLinkFromUrl = (url: string): string => {
  const datapackLink = url.replace(BASE_URL, '');
  return datapackLink;
}

export const downloadStreamOfDataToFile = async (downloadUrl: string, outDir: string, fileName: string) => {
  const spinner = ora('Downloading...').start();
  try {

    // download the zip file from the url
    await download(BASE_URL + downloadUrl, outDir, { filename: fileName });
    spinner.succeed(fileName + ' Downloaded');

  } catch {
    spinner.fail('Download failed');
  }



}