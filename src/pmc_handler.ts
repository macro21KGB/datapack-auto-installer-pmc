import axios from "axios";
import ora from "ora";
import * as cheerio from 'cheerio';
import { BASE_URL, extractDatapackLinkFromUrl } from "./utils.js";
import { Datapack, Result } from "./interfaces.js";
import chalk from "chalk";
import { exit } from "process";


export const getDownloadLinksFromPage = async (datapackPageUrl: string): Promise<Result> => {
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

export const getDatapacksFromPMC = async (url: string): Promise<Datapack[]> => {
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

export const getDatapackFromPMCLink = async (query: string): Promise<Datapack> => {

    try {
        const datapackPageUrl = extractDatapackLinkFromUrl(query);
        const result = await getDownloadLinksFromPage(datapackPageUrl);

        if (result.datapackDownloadUrl === '') {
            console.log(chalk.red('Could not find download link'));
            return { name: '', url: '' };
        }

        return {
            name: datapackPageUrl.split('/')[2]!,
            url: datapackPageUrl
        }
    } catch (err) {
        console.log(chalk.red('Could not find download link'));
        exit(1);
    }

}