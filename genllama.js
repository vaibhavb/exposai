import ollama from 'ollama';

const titlePromptFile = './prompts/title_prompt.txt';
const queryPromptFile = './prompts/query_prompt.txt';
const articlePromptFile = './prompts/article_prompt.txt'

//TODO: Log prompts and their output to prompts.log
export async function generateArticle(rl, readFile) {
    // const prompt = `Output raw markdown only. Title: ${articleData.title}\n\n${articleData.data}\n\n${articleData.summary}`;
    let article = {};
    article.title = genTitle(rl, readFile);
    article.query = genQuery(rl, readFile);
    article.body = genArticleBody(rl, readFile);

    return article;
}

async function genTitle(rl, readFile) {
    let titlePrompt = await readFile(titlePromptFile, 'utf8');

    do {
        const response = await ollama.chat({
            model: 'llama3',
            messages: [
                { role: 'user', content: titlePrompt }
            ]
        });
        let title = response.message.content;
        console.log(title);

        const res = await rl.question('Are you satisfied with the title? (yes/no)\n');
        if (res === 'yes') {
            return title;
        }
        else {
            titlePrompt = await rl.question('Enter new prompt:\n');
        }
    } while (true);
}

async function genQuery(rl, readFile) {
    let queryPrompt = await readFile(queryPromptFile, 'utf8');


    do {
        const response = await ollama.chat({
            model: 'llama3',
            messages: [
                { role: 'user', content: titlePrompt }
            ]
        });
        let title = response.message.content;
        console.log(title);

        const res = await rl.question('Are you satisfied with the title? (yes/no)\n');
        if (res === 'yes') {
            return title;
        }
        else {
            titlePrompt = await rl.question('Enter new prompt:\n');
        }
    } while (true);
}


//TODO: Implement steps, for each step ask user feedback and prompt update
const generateArticleSteps = {
    'title': 'genTitle',
    'dataQuery': 'genDataQuery',
    'data': 'genData',
    'article': 'genArticle',
    'graphs': 'genGraphs',
}