import ollama from 'ollama';

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

const generateArticleSteps = {
    'title': 'genTitle',
    'data': 'genData',
    'article': 'generateArticle',
    'graphs': 'genGraphs',
}