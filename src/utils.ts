import os from 'os';
import fs from 'fs';

export const BASE_URL = 'https://www.planetminecraft.com';

export const getCurrentUser = (): string => {
  return os.userInfo().username;
}

export const getMinecraftPath = (): string => {
  return `C:\\Users\\${getCurrentUser()}\\AppData\\Roaming\\.minecraft`;
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