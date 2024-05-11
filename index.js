#!/usr/bin/env node
import readline from 'readline';
import { promises as fs } from 'fs';
import ollama from 'ollama';

/*
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question(`How can I help you?\n`, async prompt => {
    const message = { role: 'user', content: prompt }
    const response = await ollama.chat({ model: 'llama3', messages: [message], stream: true })
    for await (const part of response) {
        process.stdout.write(part.message.content)
    }
    rl.close();
});
*/

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
    let articleData = {};

    // Initial questioning phase
    for (const key in questions) {
        articleData[key] = await askQuestion(questions[key]);
    }

    // Review and update phase
    let updateNeeded = true;
    while (updateNeeded) {
        console.log("\nCurrent responses:");
        for (const key in articleData) {
            console.log(`${key}: ${articleData[key]}`);
        }
        const updateResponse = await askQuestion("Do you want to update any answers? (yes/no) ");

        if (updateResponse.toLowerCase() === 'yes') {
            const keyToUpdate = await askQuestion("Which section do you want to update? (title, author, date, introduction, content, conclusion) ");
            if (articleData.hasOwnProperty(keyToUpdate)) {
                articleData[keyToUpdate] = await askQuestion(questions[keyToUpdate], articleData[keyToUpdate]);
            } else {
                console.log("Invalid section. Please try again.");
            }
        } else {
            updateNeeded = false;
        }
    }

    const formattedArticle = `Title: ${articleData.title}\nAuthor: ${articleData.author}\nDate: ${articleData.date}\n\n${articleData.introduction}\n\n${articleData.content}\n\n${articleData.conclusion}`;

    // Save to a file
    fs.writeFile("article.txt", formattedArticle, (err) => {
        if (err) throw err;
        console.log('The article has been saved!');
    });

    rl.close();
}

createArticle();



