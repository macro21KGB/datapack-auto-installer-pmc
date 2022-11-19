#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import * as cheerio from 'cheerio';
import axios from 'axios';
import ora from 'ora';
import { Datapack, Result } from './interfaces';
import inquirer from 'inquirer';
import fs from 'fs';
import chalk from 'chalk';
import { getMinecraftPath, getMinecraftWorlds, getMinecraftResourcePackPath, normalizeDatapackName, extractDatapackLinkFromUrl, BASE_URL } from "./utils.js"
import path from 'path';

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


const getDownloadLinksFromPage = async (datapackPageUrl: string): Promise<Result> => {
    const spinner = ora('Getting download links...').start();
    const page = await axios.get(BASE_URL + datapackPageUrl);
    const $ = cheerio.load(page.data);


    const downloadUrl = $('#resource-options > ul.content-actions > li > a').get(0)?.attribs.href ?? '';
    const resourcePackDownloadUrl = $('#dependancies > div.content-actions > li > a').get(0)?.attribs.href ?? undefined;
    // se esiste nella pagina un bottone con la scritta "DOWNLOAD REQUIRED RESOURCE PACK", allora il datapack richiede un resource pack

    spinner.succeed('Download links found');

    return {
        datapackDownloadUrl: downloadUrl,
        resourcePackDownloadUrl: resourcePackDownloadUrl
    };

}

/**
 * 
 * @param datapack DataPack to download
 * @param outDir Directory where to download the datapack
 */
const downloadDatapack = async (datapack: Datapack, outDir?: string) => {

    if (outDir === undefined)
        outDir = "./";

    const resultFromPage = await getDownloadLinksFromPage(datapack.url);

    if (resultFromPage.datapackDownloadUrl === '') {
        console.log(chalk.red('Could not find download link'));
        return;
    }

    const datapackName = normalizeDatapackName(datapack.name) + '.zip';
    await downloadStreamOfDataToFile(resultFromPage.datapackDownloadUrl, outDir, datapackName);


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

    }
};

const downloadStreamOfDataToFile = async (downloadUrl: string, outDir: string, fileName: string) => {
    const spinner = ora('Downloading...').start();

    const response = await axios({
        url: BASE_URL + downloadUrl,
        method: 'GET',
        responseType: 'stream'
    });

    try {
        const writer = fs.createWriteStream(path.join(outDir, fileName));
        response.data.pipe(writer);
        spinner.succeed(fileName + ' downloaded successfully');
    } catch (err) {
        spinner.fail('Could not download file');
        return;
    }

}


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
            const datapackPageUrl = extractDatapackLinkFromUrl(argv.query);
            const result = await getDownloadLinksFromPage(datapackPageUrl);

            if (result.datapackDownloadUrl === '') {
                console.log(chalk.red('Could not find download link'));
                return;
            }

            datapackToDownload = {
                name: datapackPageUrl.split('/')[2]!,
                url: datapackPageUrl
            }
        } else {
            datapackToDownload = await selectDatapackToDownload();
        }

        const worlds = getMinecraftWorlds();
        const placesToDownload = [...worlds, 'current directory'];

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

        if (chosenDownloadPlace === 'current directory') {
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
    }).parse();
