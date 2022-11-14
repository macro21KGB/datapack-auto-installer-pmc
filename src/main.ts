import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import * as cheerio from 'cheerio';
import axios from 'axios';
import ora from 'ora';
import { Datapack } from './interfaces';
import inquirer from 'inquirer';
import fs from 'fs';

const BASE_URL = 'https://www.planetminecraft.com';
const SEARCH_URL = BASE_URL + '/data-packs/?keywords='


/*
* This CLI will be used to download datapack from planetminecraft.com
*/

const normalizeDatapackName = (name: string) => {
    const nameWithoutSpacesAndDots = name.replace(/[\s\.]/g, '-');

    return nameWithoutSpacesAndDots.toLowerCase();
}

const getDownloadUrl = async (datapack: Datapack): Promise<string> => {

    const page = await axios.get(BASE_URL + datapack.url);
    const $ = cheerio.load(page.data);

    const downloadUrl = $('#resource-options > ul.content-actions > li > a').get(0)?.attribs.href ?? '';
    return downloadUrl;
}

// download file from url with axios
const downloadDatapack = async (datapack: Datapack) => {
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

    const writer = fs.createWriteStream(normalizeDatapackName(datapack.name) + '.zip');
    response.data.pipe(writer);

    spinner.succeed('Datapack downloaded');
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

        console.log(result.datapack);
        const datapackToDownload = datapacks.find((datapack) => datapack.name === result.datapack);

        if (datapackToDownload) {
            await downloadDatapack(datapackToDownload);
        }

    }).parse();