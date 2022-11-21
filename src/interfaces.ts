export interface Datapack {
    name: string;
    url: string;
}

export interface SavedDatapack {
    name: string;
    datapackPath: string;
    resourcePackPath: string;
}

export interface Result {
    datapackDownloadUrl: string;
    resourcePackDownloadUrl?: string;
}