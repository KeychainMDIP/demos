import fs from 'fs';
import path from 'path';
import { DatabaseInterface, DatabaseStructure } from './interfaces.js';

export class DbJson implements DatabaseInterface {
    private readonly dbPath: string;

    constructor(dbPath: string = 'data/db.json') {
        this.dbPath = dbPath;
    }

    async init(): Promise<void> {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
        if (!fs.existsSync(this.dbPath)) {
            this.writeDb({ settings: {}, users: {} });
        } else {
            const currentData = await this.loadDb();
            if (!currentData.users) {
                currentData.users = {};
            }
            this.writeDb(currentData);
        }
    }

    async loadDb(): Promise<DatabaseStructure> {
        if (fs.existsSync(this.dbPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8')) as DatabaseStructure;
            } catch (error) {
                console.error(`Error parsing JSON from ${this.dbPath}:`, error);
            }
        }
        return { settings: {}, users: {} };
    }

    async writeDb(data: DatabaseStructure): Promise<void> {
        try {
            await fs.promises.writeFile(this.dbPath, JSON.stringify(data, null, 4));
        } catch (error) {
            console.error(`Error writing JSON to ${this.dbPath}:`, error);
        }
    }
}
