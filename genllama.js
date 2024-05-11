import ollama from 'ollama';

export async function generateArticle(articleData) {
    const prompt = `Title: ${articleData.title}\nAuthor: ${articleData.author}\nDate: ${articleData.date}\n\n${articleData.introduction}\n\n${articleData.content}\n\n${articleData.conclusion}`;

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
    'article': 'generateArticle'
}