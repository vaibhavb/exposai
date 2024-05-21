import ollama from 'ollama';
import OpenAI from 'openai';
import sqlite3 from'sqlite3';
import { promises as fs } from 'fs';
import { askQuestion, substituteVariables, logger } from './utils.js';

export class ArticleGenerator {
    constructor(exposaiState, model='ollama') {
        this.exposaiState = exposaiState;
        this.modelName = model;
    }

    async getResponse(prompt) {
        if (this.modelName === 'ollama') {
            const response = await ollama.chat({
                model: 'llama3',
                messages: [
                    { role: 'user', content: prompt }
                ]
            });
            return response.message.content;  
        }
        else if (this.modelName === 'openai'){
            const openai = new OpenAI();
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: "" },
                    { role: 'user', content: prompt }
                ]
            });
            return response.choices[0];
        }
    }
    async saveState(){
        const exposaiFolderPath = './.exposai';
        const statePath = `${exposaiFolderPath}/articleState.json`;
        try {
            // Check if the folder exists; create it if it doesn't
            try {
                await fs.access(exposaiFolderPath);
            } catch {
                await fs.mkdir(exposaiFolderPath);
            }
            // Write state to file
            logger.info('Saving state...');
            await fs.writeFile(statePath, JSON.stringify(this.exposaiState, null, 2));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    async generateAndSaveArticle(){
        await this.generateArticle();
        await this.saveArticle();
    }

    async restartPreviousRun() {
        logger.log('INFO', 'Restarting previous run with existing state...');
        // Review and update phase
        let updateNeeded = true;
        while (updateNeeded) {
            logger.log("INFO", "\nCurrent responses:");
            for (const key in this.exposaiState) {
                logger.log(`${key}: ${this.exposaiState[key]}`);
            }
            const updateResponse = await askQuestion("Do you want to update any answers? (yes/no)", "no");
    
            if (updateResponse.toLowerCase() === 'yes') {
                const keyToUpdate = await askQuestion("Which section do you want to update? (title, author, date, introduction, content, conclusion) ");
                if (this.exposaiState.hasOwnProperty(keyToUpdate)) {
                    this.exposaiState[keyToUpdate] = await askQuestion(questions[keyToUpdate], this.exposaiState[keyToUpdate]);
                } else {
                    logger.log("ERROR", "Invalid section. Please try again.");
                }
            } else {
                updateNeeded = false;
            }
        }
    }

    async saveArticle(){
        const articlesFolderPath = './observable/test/docs/';
        const articleTitle = this.exposaiState.title.replace(/\s/g, '-');
        const articlePath = `${articlesFolderPath}${articleTitle}.md`;
        fs.writeFile(articlePath, this.exposaiState.article, (err) => {
            if (err) throw err;
            logger.log("INFO", 'The article has been saved!');
        });
    }

    generateArticleSteps(){
        return ({
            'title': 'genTitle',
            'dataSchema': 'genDataSchema',
            'dataQuery': 'genDataQuery',
            'article': 'genArticle',
            //'graphs': 'genGraphs',
        })
    }

    async generateArticle() {
        // Iterate over the generateArticleSteps dictionary
        let steps = this.generateArticleSteps();
        for (const step in steps) {
            const methodName = steps[step]; // Get the function name from the dictionary
            if (typeof this[methodName] === 'function') { // Check if the function exists globally
                this.exposaiState[step] = await this[methodName](); // Call the function dynamically and assign the result
                logger.prompt(methodName, this.exposaiState[step]); // Log the function call and output
                await this.saveState();
            } else {
                logger.error(`Function ${methodName} not found.`);
            }
        }
        return this.exposaiState['article'];
    }

    async genTitle() {
        const titlePromptFile = './prompts/title_prompt.txt';
        let titlePrompt = await fs.readFile(titlePromptFile, 'utf8');
        titlePrompt = substituteVariables(titlePrompt, this.exposaiState);
        logger.info(titlePrompt);

        const response = await this.getResponse(titlePrompt) 
        let title = response.message.content;
        logger.info(title);
        let titles = JSON.parse(title);
        for (const [index, value] of titles.entries()) {
            console.log(`${index}: ${value}`);
        }
        const res = await askQuestion('Are you satisfied with the title? (yes/no)\n', 'yes');
        if (res === 'yes') {
            const res = await askQuestion('Are you satisfied with the title? (`0..9`)\n', '0');
            return titles[res];
        }
        else {
            titlePrompt = await askQuestion('Enter new prompt:\n');
            return titlePrompt;
        }
    }

    async genDataSchema(){
        // Open your database
        const db = new sqlite3.Database('tests/testdata/candidates.sqlite');
        let schema = {};
        await db.all("PRAGMA table_info('candidates')", [], async (err, rows) => {
            if (err) {
                throw err;
            }
            const columnNames = rows.map(row => row.name);
            schema = `Schema: ${columnNames}\n`;
        })
        logger.info(schema);
        // Return schema
        return schema;
    }

    async genDataQuery() {
        const queryPromptFile = './prompts/query_prompt.txt';
        let queryPrompt = await fs.readFile(queryPromptFile, 'utf8');
        queryPrompt = substituteVariables(queryPrompt, this.exposaiState);

        const response = await this.getResponse(queryPrompt) 
        let queries = response.message.content;
        logger.info(queries);

        const res = await askQuestion('Are you satisfied with the queries? (yes/no)\n', 'yes');
        if (res === 'yes') {
            return queries;
        }
        else {
            queryPrompt = await askQuestion('Enter new prompt:\n', "");
            return queryPrompt;
        }
    }

    async genArticle() {
        const promptFile = './prompts/article_prompt.txt';
        let prompt = await fs.readFile(promptFile, 'utf8');
        prompt = substituteVariables(prompt, this.exposaiState);
        logger.info(prompt);

        const response = await this.getResponse(prompt) 
 
        let data = response.message.content;
        logger.prompt("Article", data);

        const res = await askQuestion('Are you satisfied with this? (yes/no)\n', 'yes');
        if (res === 'yes') {
            return data;
        }
        else {
            titlePrompt = await askQuestion('Enter new prompt:\n', "");
            return titlePrompt;
        }
    }
}
