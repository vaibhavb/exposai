import ollama from 'ollama';

//TODO: Log prompts and their output to prompts.log
export async function generateArticle(articleData) {
    const prompt = `Output raw makrdown only. Title: ${articleData.title}\n\n${articleData.data}\n\n${articleData.summary}`;

    const response = await ollama.chat({
        model: 'llama3',
        messages: [
            { role: 'user', content: prompt }
        ]
    });
    const article = response.message.content;
    console.log(article);
    return article;
}

//TODO: Implement steps, for each step ask user feedback and prompt update
const generateArticleSteps = {
    'title': 'genTitle',
    'dataQuery': 'genDataQuery',
    'data': 'genData',
    'article': 'genArticle',
    'graphs': 'genGraphs',
}