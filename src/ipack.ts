#!/usr/bin/env node

import instapack = require('./index');
import * as program from 'yargs';
import chalk from 'chalk';
import { Meta } from './Meta';

let projectFolder = process.cwd();
let app = new instapack(projectFolder);
let meta = new Meta();
meta.checkForUpdates();
program.version(meta.version);

/**
 * Writes app name, version number, command and sub-command to the console output.
 * @param command 
 * @param subCommand 
 */
function echo(command: string, subCommand: string) {
    if (!subCommand) {
        subCommand = '';
    }

    console.log(chalk.yellow(meta.name) + ' ' + chalk.green(meta.version) + ' ' + command + ' ' + subCommand);
    console.log();
}

program.command({
    command: 'build [project]',
    describe: 'Builds the web application!',
    aliases: ['*'],
    builder: yargs => {
        return yargs.choices('project', app.availableTasks)
            .option('watch', {
                alias: 'w',
                describe: 'Enables automatic incremental build on source code changes.'
            }).option('dev', {
                alias: 'd',
                describe: 'Disables build outputs optimization and minification.'
            }).option('hot', {
                alias: 'h',
                describe: 'Enables Hot Reload development mode using dedicated build servers.'
            }).option('xdebug', {
                alias: 'x',
                describe: 'Disables source maps, producing undebuggable outputs.'
            }).option('env', {
                describe: 'Defines process.env variables to be replaced in TypeScript project build.'
            }).option('stats', {
                describe: 'Generates webpack stats.json next to the TypeScript build outputs for analysis.'
            })/*.option('v', {
                alias: 'verbose',
                describe: 'Trace diagnostic outputs for debugging instapack.'
            })*/
    },
    handler: argv => {
        let subCommand = argv.project || 'all';

        let cliEnv: IMapLike<string> = {};
        if (argv.env && typeof argv.env === 'object' && !Array.isArray(argv.env)) {
            cliEnv = argv.env;
            for (let key in cliEnv) {
                cliEnv[key] = cliEnv[key].toString();
            }
            // console.log(cliEnv);
        }

        echo('build', subCommand);
        app.build(subCommand, {
            production: !Boolean(argv.dev),
            watch: Boolean(argv.watch),
            sourceMap: !Boolean(argv.xdebug),
            env: cliEnv,
            stats: Boolean(argv.stats),
            hot: Boolean(argv.hot)
        });
    }
});

program.command({
    command: 'new [template]',
    describe: 'Scaffolds new TypeScript + Sass projects!',
    builder: yargs => {
        return yargs.choices('template', app.availableTemplates);
    },
    handler: argv => {
        let subCommand = argv.template || 'vue';

        echo('new', subCommand);
        app.scaffold(subCommand);
    }
});

program.command({
    command: 'clean',
    describe: 'Remove files in output folder.',
    handler: argv => {
        echo('clean', null);
        app.clean();
    }
});

program.command({
    command: 'set <key> <value>',
    describe: 'Change a global setting.',
    builder: yargs => {
        return yargs.choices('key', app.availableSettings);
    },
    handler: argv => {
        echo('set', argv.key);
        app.changeGlobalSetting(argv.key, argv.value);
    }
});

let parse = program.strict().help().argv;
//console.log(parse);

process.on('exit', () => {
    meta.updateNag();
});

// Catch CTRL+C event then exit normally.
process.on('SIGINT', () => {
    meta.updateNag();
    process.exit(2);
});
