
import logger_instance from './Logger.js';
import readline from 'readline';
import { exec } from 'child_process';

export async function askQuestion (question, defaultValue = '') {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${question}${defaultValue ? ` (Default: ${defaultValue}) ` : ''} `, (answer) => {
            rl.close();
            resolve(answer || defaultValue);
        });
    }).finally(() => {
        rl.close(); // Double ensure cleanup in case of any issues
    });
}

export function substituteVariables(str, vars) {
    return str.replace(/\{\$(\w+)\}/g, (match, key) => {
        if (vars.hasOwnProperty(key)) {
            return vars[key];
        }
        return match; // Return the original match if no substitution is found
    });
}

async function runShell(command) {
    return new Promise((resolve, reject) => {
        exec(`${command}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Error: ${stderr || error.message}`));
                return;
            }
            resolve(stdout);
        });
    });
}

export async function runObservable(observable) {
    const res = await askQuestion('Run observable? (yes/no)', 'yes');
    if (res.trim().toLowerCase() === 'yes') {
        await runShell('cd ./observable/test && npm run dev');
    }
}

export let logger = logger_instance;