#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import { Datapack, SavedDatapack } from './interfaces';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getMinecraftPath, getMinecraftWorlds, getMinecraftResourcePackPath, normalizeDatapackName, BASE_URL, downloadStreamOfDataToFile } from "./utils.js"
import path from 'path';
import { getDatapackFromPMCLink, getDatapacksFromPMC, getDownloadLinksFromPage } from './pmc_handler.js';
import { addDatapackToConfig, getConfigPath } from './configs.js';

const SEARCH_URL = BASE_URL + '/data-packs/?keywords='
const CURRENT_DIRECTORY_NAME = "Current Directory";

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


/**
 * 
 * @param datapack DataPack to download
 * @param outDir Directory where to download the datapack
 */
const downloadDatapack = async (datapack: Datapack, outDir?: string): Promise<void> => {

    if (outDir === undefined)
        outDir = "./";

    const resultFromPage = await getDownloadLinksFromPage(datapack.url);


    if (resultFromPage.datapackDownloadUrl === '') {
        console.log(chalk.red('Could not find download link'));
        return;
    }

    const datapackName = normalizeDatapackName(datapack.name) + '.zip';
    await downloadStreamOfDataToFile(resultFromPage.datapackDownloadUrl, outDir, datapackName);

    const datapackToSave: SavedDatapack = {
        name: datapack.name,
        datapackPath: path.join(outDir, normalizeDatapackName(datapack.name)),
        resourcePackPath: ''
    }


    if (resultFromPage.resourcePackDownloadUrl) {

        const askForResourcePack = await inquirer.prompt({
            type: 'confirm',
            name: 'downloadResourcePack',
            message: 'This datapack requires a resource pack. Do you want to download it?',
            default: true
        });

        if (!askForResourcePack.downloadResourcePack)
            return;

        const resourcePackName = normalizeDatapackName(datapack.name) + '-resource-pack.zip';
        await downloadStreamOfDataToFile(resultFromPage.resourcePackDownloadUrl, getMinecraftResourcePackPath(), resourcePackName);

        datapackToSave.resourcePackPath = path.join(getMinecraftResourcePackPath(), resourcePackName);
    }

    addDatapackToConfig(datapackToSave);
};

showWelcomeMessage();

yargs(hideBin(process.argv))
    .command('install [query]', 'install datapacks on PMC', (yargs) => {
        return yargs
            .positional('query', {
                describe: 'query to search',
                type: 'string'
            }).option('link', {
                alias: 'l',
                describe: 'utilize link to download datapack',
                type: 'boolean',
            })
    }, async (argv) => {

        let datapacks: Datapack[] = [];
        let datapackToDownload: Datapack | undefined = undefined;

        if (argv.query === undefined) {
            console.log(chalk.red('Please provide a datapack name'));
            return;
        }

        if (argv.link) {
            datapackToDownload = await getDatapackFromPMCLink(argv.query);
        } else {
            datapackToDownload = await selectDatapackToDownload();
        }

        const worlds = getMinecraftWorlds();
        const placesToDownload = [...worlds, CURRENT_DIRECTORY_NAME];

        const worldResult = await inquirer.prompt({
            type: 'list',
            name: 'world',
            message: 'Select a world to install the datapack',
            choices: placesToDownload,
        });

        const chosenDownloadPlace = worldResult.world;

        if (!datapackToDownload) {
            console.log(chalk.red('Could not find datapack'));
            return;
        }

        if (chosenDownloadPlace === CURRENT_DIRECTORY_NAME) {
            downloadDatapack(datapackToDownload, './');
        } else {
            const worldToInstallDatapackPath = path.join(getMinecraftPath(), 'saves', chosenDownloadPlace, 'datapacks');
            await downloadDatapack(datapackToDownload, worldToInstallDatapackPath);
        }


        async function selectDatapackToDownload() {
            datapacks = await getDatapacksFromPMC(SEARCH_URL + argv.query?.replaceAll(' ', '+'));

            const result = await inquirer.prompt({
                type: 'list',
                name: 'datapack',
                message: 'Select a datapack',
                choices: datapacks.map((datapack) => datapack.name)
            });

            const datapackToDownload = datapacks.find((datapack) => datapack.name === result.datapack);
            return datapackToDownload;
        }
    }).command('manage', "manage datapacks and configuration files", () => {
        const configPath = chalk.bold(chalk.green(getConfigPath()));

        console.log("Configuration file located at " + configPath);
    }
    )
    .parse();
