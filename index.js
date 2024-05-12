#!/usr/bin/env node
import { promises as fs } from 'fs';
import { ArticleGenerator } from './genllama.js';
import { askQuestion, logger, runObservable } from './utils.js';

const readFile = fs.readFile;
const createArticleFile = './wizard/createArticle.json';


async function loadQuestions() {
    try {
        const data = await readFile(createArticleFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading questions file:', err);
        process.exit(1);
    }
}


async function createArticle() {
    const questions = await loadQuestions();
    
    async function saveState(state) {
        const exposaiFolderPath = './.exposai';
        const exposaiStatePath = `${exposaiFolderPath}/exposaiState.json`;
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
        const exposaiFolderPath = './.exposai';
        const exposaiStatePath = `${exposaiFolderPath}/exposaiState.json`;
        const data = await readFile(exposaiStatePath, "utf-8");
        exposaiState = JSON.parse(data);
        logger.info(exposaiState);
    } catch {
        exposaiState = {}; // Set to empty object if the file or directory doesn't exist
    }

    // Initial questioning phase
    for (const key in questions) {
        exposaiState[key] = await askQuestion(questions[key], exposaiState[key]);
    }
    saveState(exposaiState);
    logger.log('INFO', 'All questions answered! Regenerate or start new article...');
    const articleGenerator = new ArticleGenerator(exposaiState);
    await articleGenerator.restartPreviousRun()
    await articleGenerator.generateAndSaveArticle();
    await runObservable();
}

createArticle();



