import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import * as cheerio from 'cheerio';
import axios from 'axios';
import ora from 'ora';
import { Datapack } from './interfaces';
import inquirer from 'inquirer';
import fs from 'fs';
import chalk from 'chalk';
import os from 'os';
import path from 'path';

const BASE_URL = 'https://www.planetminecraft.com';
const SEARCH_URL = BASE_URL + '/data-packs/?keywords='

const showWelcomeMessage = () => {
    console.log(chalk.green("  _____        _                         _      _____           _        _ _           "));
    console.log(chalk.green(" |  __ \\      | |                       | |    |_   _|         | |      | | |          "));
    console.log(chalk.green(" | |  | | __ _| |_ __ _ _ __   __ _  ___| | __   | |  _ __  ___| |_ __ _| | | ___ _ __ "));
    console.log(chalk.green(" | |  | |/ _` | __/ _` | '_ \\ / _` |/ __| |/ /   | | | '_ \\/ __| __/ _` | | |/ _ \\ '__|"));
    console.log(chalk.green(" | |__| | (_| | || (_| | |_) | (_| | (__|   <   _| |_| | | \\__ \\ || (_| | | |  __/ |   "));
    console.log(chalk.green(" |_____/ \\__,_|\\__\\__,_| .__/ \\__,_|\\___|_|\\_\\ |_____|_| |_|___/\\__\\__,_|_|_|\\___|_|   "));
    console.log(chalk.green("                       | |                                                             "));
    console.log(chalk.green("                       |_|                                                             "));
}


/*
* This CLI will be used to download datapack from planetminecraft.com
*/
const normalizeDatapackName = (name: string) => {
    const nameWithoutSpacesAndDots = name.replace(/[\s\.]/g, '-');

    // replace multiple - with one -
    const normalized = nameWithoutSpacesAndDots.replace(/-{2,}/g, '-');

    return normalized.toLowerCase();
}

const getCurrentUser = (): string => {
    return os.userInfo().username;
}

const getMinecraftPath = (): string => {
    return `C:\\Users\\${getCurrentUser()}\\AppData\\Roaming\\.minecraft`;
}

const getMinecraftWorlds = (): string[] => {

    const worlds = fs.readdirSync(`${getMinecraftPath()}\\saves`);
    return worlds;
}


const getDownloadUrl = async (datapack: Datapack): Promise<string> => {

    const page = await axios.get(BASE_URL + datapack.url);
    const $ = cheerio.load(page.data);

    const downloadUrl = $('#resource-options > ul.content-actions > li > a').get(0)?.attribs.href ?? '';
    return downloadUrl;
}

// download file from url with axios
const downloadDatapack = async (datapack: Datapack, outDir?: string) => {

    if (outDir === undefined)
        outDir = "./";

    const spinner = ora('Downloading...').start();

    const downloadUrl = await getDownloadUrl(datapack);

    if (downloadUrl === '') {
        spinner.fail('Could not find download link');
        return;
    }

    const response = await axios({
        url: BASE_URL + downloadUrl,
        method: 'GET',
        responseType: 'stream'
    });

    try {
        const writer = fs.createWriteStream(path.join(outDir, normalizeDatapackName(datapack.name) + '.zip'));
        response.data.pipe(writer);
        spinner.succeed('Datapack downloaded successfully');
    } catch (err) {
        spinner.fail('Could not download file');
        return;
    }

};


const getDatapacksFromPMC = async (url: string): Promise<Datapack[]> => {
    const spinner = ora('Loading datapacks').start();
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const datapacks = $('.resource_list li').map((_, el) => {
        const newDatapack: Datapack = {
            name: $(el).children('.r-info').children('a').text() ?? '',
            url: $(el).children('.r-info').children().get(0)?.attribs.href ?? '',
        }

        if (newDatapack.url === '')
            return null;

        return newDatapack;
    }).get();
    spinner.stop();
    return datapacks;
}

showWelcomeMessage();
yargs(hideBin(process.argv))
    .command('search [query]', 'search datapacks on PMC', (yargs) => {
        return yargs
            .positional('query', {
                describe: 'query to search',
                type: 'string'
            })
    }, async (argv) => {

        const datapacks = await getDatapacksFromPMC(SEARCH_URL + argv.query?.replaceAll(' ', '+'));
        const result = await inquirer.prompt({
            type: 'list',
            name: 'datapack',
            message: 'Select a datapack',
            choices: datapacks.map((datapack) => datapack.name)
        });

        const datapackToDownload = datapacks.find((datapack) => datapack.name === result.datapack);

        const worlds = getMinecraftWorlds();
        const worldResult = await inquirer.prompt({
            type: 'list',
            name: 'world',
            message: 'Select a world to install the datapack',
            choices: worlds,
        });

        const worldToInstallDatapackPath = path.join(getMinecraftPath(), 'saves', worldResult.world, 'datapacks');
        if (datapackToDownload) {
            await downloadDatapack(datapackToDownload, worldToInstallDatapackPath);
        }

    }).parse();
