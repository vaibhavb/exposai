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
            rl.close();
        });
    });
}

async function createArticle() {
    const questions = await loadQuestions();
    let articleData = {};

    // Initial questioning phase
    for (const key in questions) {
        articleData[key] = await askQuestion(questions[key]);
    }

    // Review and update phase
    let updateNeeded = true;
    while (updateNeeded) {
        logger.log("INFO", "\nCurrent responses:");
        for (const key in articleData) {
            console.log(`${key}: ${articleData[key]}`);
        }
        const updateResponse = await askQuestion("Do you want to update any answers? (yes/no) ");

        if (updateResponse.toLowerCase() === 'yes') {
            const keyToUpdate = await askQuestion("Which section do you want to update? (title, author, date, introduction, content, conclusion) ");
            if (articleData.hasOwnProperty(keyToUpdate)) {
                articleData[keyToUpdate] = await askQuestion(questions[keyToUpdate], articleData[keyToUpdate]);
            } else {
                logger.log("ERROR", "Invalid section. Please try again.");
            }
        } else {
            updateNeeded = false;
        }
    }

    const formattedArticle = await generateArticle(articleData);

    // Save to a file
    fs.writeFile("article.md", formattedArticle, (err) => {
        if (err) throw err;
        logger.log("INFO", 'The article has been saved!');
    });

    rl.close();
}

createArticle();



