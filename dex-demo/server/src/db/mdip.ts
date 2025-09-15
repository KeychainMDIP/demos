import Keymaster from '@mdip/keymaster';
import { DatabaseInterface, DatabaseStructure } from './interfaces.js';
import { MdipDocument } from '@mdip/gatekeeper/types';

export class DbMdip implements DatabaseInterface {
    private readonly keymaster: Keymaster;
    private readonly name: string;
    private readonly ownerDID: string;
    private vaultDID: string | undefined;

    constructor(keymaster: Keymaster, name: string, ownerDID: string) {
        this.keymaster = keymaster;
        this.name = name;
        this.ownerDID = ownerDID;
    }

    async init(): Promise<void> {
        const doc: MdipDocument = await this.keymaster.resolveDID(this.name);
        const data = doc.didDocumentData as { db?: string };

        this.vaultDID = data.db;

        if (!this.vaultDID) {
            this.vaultDID = await this.keymaster.createGroupVault();
            await this.keymaster.addGroupVaultMember(this.vaultDID, this.ownerDID);

            const db = { settings: {}, users: {} };
            await this.writeDb(db);

            data.db = this.vaultDID;
            await this.keymaster.updateDID(doc);
        }
    }

    async loadDb(): Promise<DatabaseStructure> {
        if (!this.vaultDID) {
            throw new Error('Vault not initialized');
        }

        const buffer = await this.keymaster.getGroupVaultItem(this.vaultDID, 'db');
        if (!buffer) {
            throw new Error('Database not found');
        }

        const db = JSON.parse(buffer.toString('utf-8'));
        return db;
    }

    async writeDb(data: DatabaseStructure): Promise<void> {
        if (!this.vaultDID) {
            throw new Error('Vault not initialized');
        }

        const buffer = Buffer.from(JSON.stringify(data), 'utf-8');
        await this.keymaster.addGroupVaultItem(this.vaultDID, 'db', buffer);
    }
}
