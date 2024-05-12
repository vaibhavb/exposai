#!/usr/bin/env node
import readline from 'readline';
import { promises as fs } from 'fs';
import { generateArticle } from './genllama.js';
import logger from './Logger.js';

const readFile = fs.readFile;
const createArticleFile = './wizard/createArticle.json';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function loadQuestions() {
    try {
        const data = await readFile(createArticleFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading questions file:', err);
        process.exit(1);
    }
}

function askQuestion(question, defaultValue = '') {
    return new Promise((resolve) => {
        rl.question(`${question}${defaultValue ? ` (Default: ${defaultValue}) ` : ''}`, (answer) => {
            resolve(answer || defaultValue);
        });
    });
}

async function createArticle() {
    const questions = await loadQuestions();
    const exposaiFolderPath = './exposai';
    const exposaiStatePath = `${exposaiFolderPath}/exposaiState.json`;
    
    async function saveState(state) {
        try {
            // Check if the folder exists; create it if it doesn't
            try {
                await fs.access(exposaiFolderPath);
            } catch {
                await fs.mkdir(exposaiFolderPath);
            }
            // Write state to file
            await fs.writeFile(exposaiStatePath, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    let exposaiState;
    try {
        const data = await readFile(exposaiStatePath, "utf-8");
        exposaiState = JSON.parse(data);
    } catch {
        exposaiState = {}; // Set to empty object if the file or directory doesn't exist
    }

    // Initial questioning phase
    for (const key in questions) {
        exposaiState[key] = await askQuestion(questions[key]);
    }

    // Review and update phase
    let updateNeeded = true;
    while (updateNeeded) {
        logger.log("INFO", "\nCurrent responses:");
        for (const key in exposaiState) {
            console.log(`${key}: ${exposaiState[key]}`);
        }
        const updateResponse = await askQuestion("Do you want to update any answers? (yes/no) ");

        if (updateResponse.toLowerCase() === 'yes') {
            const keyToUpdate = await askQuestion("Which section do you want to update? (title, author, date, introduction, content, conclusion) ");
            if (exposaiState.hasOwnProperty(keyToUpdate)) {
                exposaiState[keyToUpdate] = await askQuestion(questions[keyToUpdate], exposaiState[keyToUpdate]);
            } else {
                logger.log("ERROR", "Invalid section. Please try again.");
            }
        } else {
            updateNeeded = false;
        }
    }

    saveState(exposaiState);
    logger.log('INFO', 'All questions answered! Generating the article...');
    const formattedArticle = await generateArticle();

    /*
    // Save to a file
    fs.writeFile("article.md", formattedArticle, (err) => {
        if (err) throw err;
        logger.log("INFO", 'The article has been saved!');
    });
    */
    rl.close();
}

createArticle();



