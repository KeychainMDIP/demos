export interface User {
    firstLogin?: string;
    lastLogin?: string;
    logins?: number;
    role?: string;
    name?: string;
    [key: string]: any;
}

export interface DatabaseStructure {
    settings: any;
    users?: Record<string, User>;
}

export interface DatabaseInterface {
    init(): Promise<void>;
    loadDb(): Promise<DatabaseStructure>;
    writeDb(data: DatabaseStructure): Promise<void>;
}
