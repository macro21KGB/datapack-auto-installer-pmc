import { SavedDatapack } from './interfaces';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CONFIG_FILE_NAME = 'datapack_installer_config.json';
const DEFAULT_MINECRAFT_PATH = path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft');

interface Config {
    minecraftPath: string;
    datapacks: SavedDatapack[];
}

const basicConfig = {
    minecraftPath: '',
    datapacks: []
}

export const getConfigPath = (): string => {
    return path.join(os.homedir(), CONFIG_FILE_NAME);
}

const writeConfigs = (config: Config) => {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 4));
}


export const readConfigs = (): Config => {

    if (!fs.existsSync(getConfigPath())) {
        basicConfig.minecraftPath = DEFAULT_MINECRAFT_PATH;
        writeConfigs(basicConfig);
        return basicConfig;
    }

    return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));

}


export const addDatapackToConfig = (datapack: SavedDatapack) => {
    const configs = readConfigs();

    configs.datapacks.push(datapack);

    writeConfigs(configs);
}