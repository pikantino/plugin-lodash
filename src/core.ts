import * as childProcess from 'child_process';
import * as  path from 'path';
import * as fs from 'fs-extra';
import {Plugin} from '@pikantino/toolkit';

const cwd: string = process.cwd();
const lodashTempFolderName: string = '.pikantino-plugin-lodash.temp';
const lodashFolderPath: string = path.join(cwd, lodashTempFolderName);


function modularizeLodash(): Promise<void> {
    return new Promise((resolve, reject) => {
        const pluginNodeModulesPath: string = path.join(__dirname, '..', '..', 'node_modules');
        const lodashCliBinPath: string = path.join(pluginNodeModulesPath, 'lodash-cli', 'bin', 'lodash');

        fs.ensureDirSync(lodashFolderPath);

        const spawn = childProcess.spawn(lodashCliBinPath, ['modularize', 'exports=es', '-o', `./${lodashTempFolderName}`]);
        spawn.stderr.on('data', (error: Buffer) => {
            throw new Error('Can not modularize lodash. ' + error.toString());
        });
        spawn.on('exit', (code) => {
            resolve();
        });
    });
}

async function beforePackageInfoCollecting(packageName: string, packageJsonPath: string, packageJson: { [key: string]: string }): Promise<{ [key: string]: string }> {
    if (packageName === 'lodash') {
        await modularizeLodash();
        const cwd = process.cwd();
        const lodashNewEntryPath: string = path.join(cwd, lodashTempFolderName, 'lodash.js');
        return Object.assign({}, {es2015: path.relative(packageJsonPath, lodashNewEntryPath)});
    }
    return packageJson;
}

async function afterPackagesBuilt(): Promise<void> {
    // fs.removeSync(lodashTempFolderName);
}

export const plugin: Plugin = {
    beforePackageInfoCollecting: beforePackageInfoCollecting,
    afterPackagesBuilt: afterPackagesBuilt
};

