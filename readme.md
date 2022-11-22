# Datapack Installer

> 🚨CURRENTLY IN DEVELOPMENT - NOT READY FOR USE🚨
> SOLVING DOWNLOADING ISSUES

This CLI app allows you to search datapacks on Planet-Minecraft(PMC) and install them with a single command.

![Datapck Installer](https://user-images.githubusercontent.com/37043239/202900249-33f71abd-a799-4e22-b55f-1540c0bb19e4.gif)

If a resource pack is needed, it will also download the resource pack in the `resourcepacks` in your `.minecraft` folder 

## Installation

Install it globally with

```bash
  npm install -g datapack-installer
```
or use it on the fly with npx

```bash
 npx datapack-installer install <datapack name>
```
## Usage

For help, run

```bash
  datapack-installer --help
```
For installing a datapack, run


```bash
datapack-installer install <datapack name>
```
or use a PlanetMinecraft Link

```bash
datapack-installer install -l <pmc url link>
```
## Examples

```bash
datapack-installer install "mining device"
```
```bash
datapack-installer install -l "https://www.planetminecraft.com/data-pack/mining-device/"
```

## Configuration

The configuration file is located in your home directory `"C:\Users\{user}\datapack_installer_config.json"`

```json
{
    "minecraftPath": "C:\\Users\\{user}\\AppData\\Roaming\\.minecraft",
    "datapacks": [
        {
            "name": "Bucketable (Bucket Any Mob!)",
            "datapackPath": "...",
            "resourcePackPath": "..."
        }
    ]
}
```
In this file, you can add datapacks manually or change the minecraft path if it is in a different location.

> this will not auto download the datapack, it will just add it to the config file, for internal use...for now

## Authors

- [@macro21KGB](https://mariodeluca.netlify.app/)

