import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Logger {
    constructor() {
        this.logDirectory = path.join(__dirname, './logs');
        // Ensure log directory exists
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory);
        }

        this.errorStream = fs.createWriteStream(path.join(this.logDirectory, 'system.log'), { flags: 'a' });
        this.infoStream = fs.createWriteStream(path.join(this.logDirectory, 'system.log'), { flags: 'a' });
    }

    info(message) {
        this.log('INFO', message);
        this.infoStream.write(`${new Date().toISOString()} [INFO] ${message}\n`);
    }

    error(message) {
        this.log('ERROR', message);
        this.errorStream.write(`${new Date().toISOString()} [ERROR] ${message}\n`);
    }

    debug(message) {
        if (process.env.NODE_ENV === 'development') {
            this.log('DEBUG', message);
        }
    }

    warn(message) {
        this.log('WARN', message);
    }

    log(level, message) {
        console.log(`${new Date().toISOString()} [${level}] ${message}`);
    }
}

export default new Logger();