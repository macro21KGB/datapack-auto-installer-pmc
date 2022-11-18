import os from 'os';
import fs from 'fs';

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

