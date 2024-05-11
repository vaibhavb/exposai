#!/usr/bin/env node
// This shebang line is important. It tells the OS to use Node to run this script.

import ollama from "ollama";

import readline from 'node:readline';

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



