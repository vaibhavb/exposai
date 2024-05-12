import ollama from 'ollama';
import sqlite3 from'sqlite3';
import { promises as fs } from 'fs';
import { askQuestion, substituteVariables, logger } from './utils.js';


const titlePromptFile = './prompts/title_prompt.txt';
const queryPromptFile = './prompts/query_prompt.txt';
const articlePromptFile = './prompts/article_prompt.txt'

//TODO: Log prompts and their output to prompts.log
export async function generateArticle(exposaiState) {
    let article = {};
    article.title = genTitle(exposaiState);
    //article.query = genQuery(rl, readFile);
    //article.body = genArticleBody(rl, readFile);

    return article;
}

async function genTitle(exposaiState) {
    let titlePrompt = await fs.readFile(titlePromptFile, 'utf8');
    titlePrompt = substituteVariables(titlePrompt, exposaiState);
    logger.info(titlePrompt);

    const response = await ollama.chat({
        model: 'llama3',
        messages: [
            { role: 'user', content: titlePrompt }
        ]
    });
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
        titlePrompt = await rl.question('Enter new prompt:\n');
        return titlePrompt;
    }
}

async function genQuery(rl, readFile) {
    let queryPrompt = await readFile(queryPromptFile, 'utf8');

    // Open your database
    const db = new sqlite3.Database('tests/testdata/candidates.sqlite');

    db.all("PRAGMA table_info('candidates')", [], async (err, rows) => {
        if (err) {
            throw err;
        }

        const columnNames = rows.map(row => row.name);
        console.log(`Schema: ${columnNames}\n`);
        do {
            const response = await ollama.chat({
                model: 'llama3',
                messages: [
                    { role: 'user', content: queryPrompt }
                ]
            });
            let queries = response.message.content;
            console.log(queries);

            const res = await rl.question('Are you satisfied with the queries? (yes/no)\n');
            if (res === 'yes') {
                return queries;
            }
            else {
                queryPrompt = await rl.question('Enter new prompt:\n');
            }
        } while (true);
    });

    db.close(); // Close the connection when done


}


//TODO: Implement steps, for each step ask user feedback and prompt update
const generateArticleSteps = {
    'title': 'genTitle',
    'dataQuery': 'genDataQuery',
    'data': 'genData',
    'article': 'genArticle',
    'graphs': 'genGraphs',
}