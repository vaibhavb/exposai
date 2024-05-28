
import logger_instance from './Logger.js';
import readline from 'readline';
import { exec, execSync } from 'child_process';
import {promises as fs} from 'fs';
import path from 'path';
import os from 'os';
import {promisify} from 'util';

export async function openEditor(data) {
        // Define the temporary file path
        const tmpFilePath = path.join(os.tmpdir(), 'temp_editor_file.txt');

        // Write the initial content to the temporary file
        await fs.writeFile(tmpFilePath, data);

        // Determine the editor to use (default to nano or any editor you prefer)
        const editor = process.env.EDITOR || 'nano';

        const execPromise = promisify(exec);
        // Open the editor and wait for the user to finish editing
        try {
            execSync(`${editor} ${tmpFilePath}`, { stdio: 'inherit' });
        } catch (error) {
            console.error('Error opening the editor:', error);
            return null;
        }

        // Read the content back from the temporary file
        const editedContent = await fs.readFile(tmpFilePath, 'utf-8');

        // Clean up the temporary file
        await fs.unlink(tmpFilePath);
        return editedContent;
}


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

export async function confirm(data){
    const res = await askQuestion('Are you satisfied with this? (yes/no)\n', 'yes');
    if (res === 'yes') {
        return data;
    }
    else {
        const newdata = await openEditor(data);
        return newdata;
    }
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
