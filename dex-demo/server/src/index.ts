import express, {
    Request,
    Response,
    NextFunction,
} from 'express';
import session from 'express-session';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

import CipherNode from '@mdip/cipher/node';
import GatekeeperClient from '@mdip/gatekeeper/client';
import Keymaster from '@mdip/keymaster';
import WalletJson from '@mdip/keymaster/wallet/json';
import { DatabaseInterface, User } from './db/interfaces.js';
import { DbMdip } from './db/mdip.js';
import { DbJson } from './db/json.js';
import e from 'express';
import { exit } from 'process';

let gatekeeper: GatekeeperClient;
let keymaster: Keymaster;
let db: DatabaseInterface;

dotenv.config();

const HOST_PORT = Number(process.env.DEX_HOST_PORT) || 3000;
const HOST_URL = process.env.DEX_HOST_URL || 'http://localhost:3000';
const GATEKEEPER_URL = process.env.DEX_GATEKEEPER_URL || 'http://localhost:4224';
const WALLET_URL = process.env.DEX_WALLET_URL || 'http://localhost:4224';
const OWNER_DID = process.env.DEX_OWNER_DID;
const DEMO_NAME = process.env.DEX_DEMO_NAME || 'dex-demo';
const DATABASE_TYPE = process.env.DEX_DATABASE_TYPE || 'json'; // 'json' or

const app = express();
const logins: Record<string, {
    response: string;
    challenge: string;
    did: string;
    verify: any;
}> = {};

app.use(morgan('dev'));
app.use(express.json());

// Session setup
app.use(session({
    secret: 'MDIP',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
    if (req.session.user) {
        return next();
    }
    res.status(401).send('You need to log in first');
}

function isAdmin(req: Request, res: Response, next: NextFunction): void {
    isAuthenticated(req, res, async () => {
        const userDID = req.session.user?.did;

        if (!userDID) {
            res.status(403).send('Admin access required');
            return;
        }

        if (userDID === OWNER_DID) {
            return next();
        }

        const currentDb = await db.loadDb();
        const inAdminRole = !!currentDb.users && currentDb.users[userDID]?.role === 'Admin';

        if (inAdminRole) {
            return next();
        }

        res.status(403).send('Admin access required');
    });
}

async function loginUser(response: string): Promise<any> {
    const verify = await keymaster.verifyResponse(response, { retries: 10 });

    if (verify.match) {
        const challenge = verify.challenge;
        const did = verify.responder!;
        const currentDb = await db.loadDb();

        if (!currentDb.users) {
            currentDb.users = {};
        }

        const now = new Date().toISOString();
        let user = currentDb.users[did];

        if (user) {
            user.lastLogin = now;
            user.logins = (user.logins || 0) + 1;
        } else {
            user = {
                firstLogin: now,
                lastLogin: now,
                logins: 1
            };
            currentDb.users[did] = user;
        }

        if (!user.role) {
            if (did === OWNER_DID) {
                user.role = 'Owner';
            } else {
                user.role = 'Member';
            }
        }

        if (!user.name) {
            user.name = 'Anon';
        }

        if (!user.assets) {
            user.assets = {
                created: [],
                collected: [],
                collections: [],
            };
        }

        if (user.assets.collections.length === 0) {
            const collectionId = await createCollection('Collection', did);
            user.assets.collections.push(collectionId);
        }

        db.writeDb(currentDb);

        logins[challenge] = {
            response,
            challenge,
            did,
            verify,
        };
    }

    return verify;
}

async function createCollection(name: string, owner: string): Promise<string> {
    const collection = {
        owner,
        assets: [],
    };

    const collectionDID = await keymaster.createAsset({ name, collection });
    return collectionDID;
}

const corsOptions = {
    origin: process.env.DEX_CORS_SITE_ORIGIN || 'http://localhost:3009', // Origin needs to be specified with credentials true
    methods: ['DELETE', 'GET', 'POST', 'PUT'],  // Specify which methods are allowed (e.g., GET, POST)
    credentials: true,         // Enable if you need to send cookies or authorization headers
    optionsSuccessStatus: 200  // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

app.options('/api/{*path}', cors(corsOptions));

app.get('/api/version', async (_: Request, res: Response) => {
    try {
        res.json(1);
    } catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.get('/api/licenses', async (_: Request, res: Response) => {
    const ValidLicenses = {
        "CC BY": "https://creativecommons.org/licenses/by/4.0/",
        "CC BY-SA": "https://creativecommons.org/licenses/by-sa/4.0/",
        "CC BY-NC": "https://creativecommons.org/licenses/by-nc/4.0/",
        "CC BY-ND": "https://creativecommons.org/licenses/by-nd/4.0/",
        "CC BY-NC-SA": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
        "CC BY-NC-ND": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
        "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
    };

    res.json(ValidLicenses);
});

app.get('/api/rates', async (_: Request, res: Response) => {
    const rates = {
        editionRate: 100,
        storageRate: 0.001, // per byte in credits
    };

    res.json(rates);
});

app.get('/api/challenge', async (req: Request, res: Response) => {
    try {
        const challenge = await keymaster.createChallenge({
            callback: `${HOST_URL}/api/login`
        });
        req.session.challenge = challenge;
        const challengeURL = `${WALLET_URL}?challenge=${challenge}`;

        const doc = await keymaster.resolveDID(challenge);
        console.log(JSON.stringify(doc, null, 4));
        res.json({ challenge, challengeURL });
    } catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.get('/api/login', cors(corsOptions), async (req: Request, res: Response) => {
    try {
        const { response } = req.query;
        if (typeof response !== 'string') {
            res.status(400).json({ error: 'Missing or invalid response param' });
            return;
        }
        const verify = await loginUser(response);
        if (!verify.challenge) {
            res.json({ authenticated: false });
            return;
        }
        req.session.user = {
            did: verify.responder
        };
        res.json({ authenticated: verify.match });
    } catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.post('/api/login', cors(corsOptions), async (req: Request, res: Response) => {
    try {
        const { response } = req.body;
        const verify = await loginUser(response);
        if (!verify.challenge) {
            res.json({ authenticated: false });
            return;
        }
        req.session.user = {
            did: verify.responder
        };
        res.json({ authenticated: verify.match });
    } catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.post('/api/logout', async (req: Request, res: Response) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.log(err);
            }
        });
        res.json({ ok: true });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.get('/api/check-auth', async (req: Request, res: Response) => {
    try {
        if (!req.session.user && req.session.challenge) {
            const challengeData = logins[req.session.challenge];
            if (challengeData) {
                req.session.user = { did: challengeData.did };
            }
        }

        const isAuthenticated = !!req.session.user;
        const userDID = isAuthenticated ? req.session.user?.did : null;
        const currentDb = await db.loadDb();

        let profile: User | null = null;

        if (isAuthenticated && userDID) {
            profile = currentDb.users?.[userDID] || null;
        }

        let isOwner = false;
        let isAdmin = false;
        let isModerator = false;
        let isMember = false;

        if (profile) {
            isOwner = userDID === OWNER_DID;
            isAdmin = profile.role === 'Admin' || isOwner;
            isModerator = profile.role === 'Moderator' || isAdmin;
            isMember = profile.role === 'Member' || isModerator;
        }

        const auth = {
            isAuthenticated,
            isOwner,
            isAdmin,
            isModerator,
            isMember,
            userDID,
            profile,
        };

        res.json(auth);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            isAuthenticated: false,
            userDID: null,
            isOwner: false,
            profile: null,
            error: "Failed to check authentication status",
        });
    }
});

app.patch('/api/settings', isAdmin, async (req: Request, res: Response) => {
    try {
        const { pfp, thumbnail } = req.body;
        const currentDb = await db.loadDb();

        if (!currentDb.settings) {
            currentDb.settings = {};
        }

        if (pfp) {
            currentDb.settings.pfp = pfp;
        }

        if (thumbnail) {
            currentDb.settings.thumbnail = thumbnail;
        }

        db.writeDb(currentDb);
        res.json({ ok: true });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.get('/api/profile/:did', async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const currentDb = await db.loadDb();

        if (!currentDb.users || !currentDb.users[did]) {
            res.status(404).send('Not found');
            return;
        }

        const rawProfile = currentDb.users[did];
        const isUser = (req.session?.user?.did === did);
        const collections: any[] = [];

        for (const collectionId of rawProfile.assets?.collections || []) {
            try {
                const asset = await keymaster.resolveAsset(collectionId);
                if (asset && asset.collection) {
                    const thumbnail = {
                        did: asset.collection.thumbnail || currentDb.settings?.thumbnail,
                        cid: undefined,
                    };

                    if (thumbnail.did) {
                        const thumbAsset = await keymaster.resolveAsset(thumbnail.did);
                        if (thumbAsset && thumbAsset.image) {
                            thumbnail.cid = thumbAsset.image.cid;
                        }
                    }

                    collections.push({
                        did: collectionId,
                        ...asset.collection,
                        name: asset.name,
                        thumbnail,
                    });
                }
            } catch (e) {
                console.log(`Failed to resolve collection ${collectionId}: ${e}`);
            }
        }

        const pfp = {
            did: rawProfile.pfp || currentDb.settings?.pfp,
            cid: undefined,
        };

        if (pfp.did) {
            try {
                const pfpAsset = await keymaster.resolveAsset(pfp.did);
                if (pfpAsset && pfpAsset.image) {
                    pfp.cid = pfpAsset.image.cid;
                }
            } catch (e) {
                console.log(`Failed to resolve profile picture ${pfp.did}: ${e}`);
            }
        }

        const profile: User = {
            ...rawProfile,
            did,
            pfp,
            isUser,
            collections,
        };

        res.json(profile);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.patch('/api/profile/:did', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { name, tagline, pfp } = req.body;

        if (!req.session.user || req.session.user.did !== did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const currentDb = await db.loadDb();
        if (!currentDb.users || !currentDb.users[did]) {
            res.status(404).send('Not found');
            return;
        }

        if (name !== undefined) {
            currentDb.users[did].name = name;
        }

        if (tagline !== undefined) {
            currentDb.users[did].tagline = tagline;
        }

        if (pfp !== undefined) {
            currentDb.users[did].pfp = pfp;
        }

        db.writeDb(currentDb);

        res.json({ ok: true, message: `Profile updated` });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.put('/api/profile/:did/name', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { name } = req.body;

        if (!req.session.user || req.session.user.did !== did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const currentDb = await db.loadDb();
        if (!currentDb.users || !currentDb.users[did]) {
            res.status(404).send('Not found');
            return;
        }

        currentDb.users[did].name = name;
        db.writeDb(currentDb);

        res.json({ ok: true, message: `name set to ${name}` });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.put('/api/profile/:did/tagline', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { tagline } = req.body;

        if (!req.session.user || req.session.user.did !== did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const currentDb = await db.loadDb();
        if (!currentDb.users || !currentDb.users[did]) {
            res.status(404).send('Not found');
            return;
        }

        currentDb.users[did].tagline = tagline;
        db.writeDb(currentDb);

        res.json({ ok: true, message: `tagline set to ${tagline}` });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.put('/api/profile/:did/role', isAdmin, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { role } = req.body;
        const validRoles = ['Admin', 'Moderator', 'Member'];

        if (!validRoles.includes(role)) {
            res.status(400).send(`valid roles include ${validRoles}`);
            return;
        }

        const currentDb = await db.loadDb();
        if (!currentDb.users || !currentDb.users[did]) {
            res.status(404).send('Not found');
            return;
        }

        currentDb.users[did].role = role;
        db.writeDb(currentDb);

        res.json({ ok: true, message: `role set to ${role}` });
    }
    catch (error) {
        console.log(error);
        res.status(500).send(String(error));
    }
});

app.get('/api/did/:id', async (req: Request, res: Response) => {
    try {
        const docs = await keymaster.resolveDID(req.params.id, req.query);
        res.json({ docs });
    } catch (error: any) {
        res.status(404).send("DID not found");
    }
});

app.get('/api/asset/:did', async (req: Request, res: Response) => {
    try {
        const asset = await keymaster.resolveAsset(req.params.did);

        if (asset.matrix) {
            asset.matrix.original = asset.cloned;
            asset.did = req.params.did;

            const currentDb = await db.loadDb();
            const users = currentDb.users || {};

            asset.owner = users[asset.matrix.owner] || {};
            asset.owner.did = asset.matrix.owner;

            if (asset.matrix.collection) {
                try {
                    const collection = await keymaster.resolveAsset(asset.matrix.collection);
                    if (collection && collection.collection) {
                        asset.collection = {
                            ...collection.collection,
                            did: asset.matrix.collection,
                            name: collection.name,
                        };
                    }
                } catch (e) {
                    console.log(`Failed to resolve collection ${asset.matrix.collection}: ${e}`);
                }
            }
        } else {
            asset.owner = {};
        }

        res.json({ asset });
    } catch (error: any) {
        res.status(404).send("DID not found");
    }
});

app.patch('/api/asset/:did', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const updates = req.body;

        const asset = await keymaster.resolveAsset(did);

        if (!asset) {
            res.status(404).send("Asset not found");
            return;
        }

        const owner = asset.matrix?.owner;

        if (!req.session.user || req.session.user.did !== owner) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        await keymaster.updateAsset(did, updates);
        res.json({ ok: true, message: 'Asset updated successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to update asset");
    }
});

app.post('/api/collection', isAuthenticated, async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: 'Collection name is required' });
            return;
        }

        const did = req.session.user.did;
        const currentDb = await db.loadDb();
        const users = currentDb.users || {};

        if (!users[did]) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const collectionId = await createCollection(name, did);
        users[did].assets.collections.push(collectionId);

        db.writeDb(currentDb);
        res.json({ did: collectionId });
    } catch (error: any) {
        res.status(500).send(String(error));
    }
});

app.delete('/api/collection/:did', isAuthenticated, async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const { did } = req.params;
        const userDID = req.session.user.did;
        const currentDb = await db.loadDb();
        const users = currentDb.users || {};
        const user = users[userDID];

        if (!user) {
            res.status(404).send('Not found');
            return;
        }

        user.assets.collections = user.assets.collections.filter((c: string) => c !== did);

        db.writeDb(currentDb);
        res.json({ ok: true });
    } catch (error: any) {
        res.status(500).send(String(error));
    }
});

app.get('/api/collection/:did', async (req: Request, res: Response) => {
    try {
        const currentDb = await db.loadDb();
        const users = currentDb.users || {};

        const docs = await keymaster.resolveDID(req.params.did);
        if (!docs) {
            res.status(404).send("DID not found");
            return;
        }

        const data = docs.didDocumentData as { name?: string; collection?: any };

        if (!data.collection) {
            res.status(404).send("Not a collection");
            return;
        }

        const profile = users[data.collection.owner] || { name: 'Unknown User' };
        const owner = {
            did: data.collection.owner,
            ...profile,
        };

        const assets = [];
        for (const assetId of data.collection.assets) {
            try {
                const item = await keymaster.resolveAsset(assetId);
                if (item) {
                    assets.push({
                        did: assetId,
                        ...item,
                    });
                }
            } catch (e) {
                console.log(`Failed to resolve asset ${assetId}: ${e}`);
            }
        }

        const collection = {
            name: data.name,
            owner,
            assets,
        }

        res.json({ collection });
    } catch (error: any) {
        res.status(404).send("DID not found");
    }
});

app.patch('/api/collection/:did', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { name, thumbnail } = req.body;

        const data = await keymaster.resolveAsset(did);

        if (!data) {
            res.status(404).send("Collection not found");
            return;
        }

        if (!data.collection) {
            res.status(400).send("Not a collection");
            return;
        }

        if (!req.session.user || req.session.user.did !== data.collection.owner) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        if (name !== undefined) {
            data.name = name;
        }

        if (thumbnail !== undefined) {
            data.collection.thumbnail = thumbnail;
        }

        await keymaster.updateAsset(did, data);
        res.json({ ok: true, message: 'Collection updated successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to update collection");
    }
});

app.post('/api/collection/:did/add', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const { did } = req.params;
        const { asset } = req.body;
        const data = await keymaster.resolveAsset(did);

        if (!data) {
            res.status(404).send("Collection not found");
            return;
        }

        const collection = data.collection;

        if (!collection) {
            res.status(400).send("Not a collection");
            return;
        }

        if (collection.owner !== req.session.user?.did) {
            res.status(403).send("You do not own this collection");
            return;
        }

        const clone = await keymaster.cloneAsset(asset);

        if (!clone) {
            res.status(404).send("Asset to add not found");
            return;
        }

        const matrix = {
            owner: req.session.user?.did,
            collection: did,
        };
        await keymaster.updateAsset(clone, { matrix });

        collection.assets.push(clone);
        await keymaster.updateAsset(did, { collection });

        res.json({ ok: true, message: 'Asset added to collection' });
    } catch (error: any) {
        res.status(500).send("Could not add asset to collection");
    }
});

app.get('/api/users', isAdmin, async (_: Request, res: Response) => {
    try {
        const currentDb = await db.loadDb();
        const users = currentDb.users || {};
        res.json({ users });
    } catch (error: any) {
        res.status(500).send(String(error));
    }
});

app.get('/api/ipfs/:cid', async (req, res) => {
    try {
        const response = await gatekeeper.getData(req.params.cid);
        res.set('Content-Type', 'application/octet-stream');
        res.send(response);
    } catch (error: any) {
        res.status(404).send(error.toString());
    }
});

app.post('/api/add-credits', isAuthenticated, async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const { amount } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ message: 'Valid amount is required' });
            return;
        }

        const did = req.session.user.did;
        const currentDb = await db.loadDb();
        const users = currentDb.users || {};

        if (!users[did]) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        users[did].credits = (users[did].credits || 0) + amount;
        db.writeDb(currentDb);

        res.json({
            ok: true,
            message: 'Credits added successfully',
            balance: users[did].credits,
        });
    } catch (error: any) {
        res.status(500).send("Failed to add credits");
    }
});

if (process.env.DEX_SERVE_CLIENT !== 'false') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const clientBuildPath = path.join(__dirname, '../../client/build');
    app.use(express.static(clientBuildPath));

    app.use((req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        } else {
            console.warn(`Warning: Unhandled API endpoint - ${req.method} ${req.originalUrl}`);
            res.status(404).json({ message: 'Endpoint not found' });
        }
    });
}

process.on('uncaughtException', (error) => {
    console.error('Unhandled exception caught', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

async function verifyWallet(): Promise<void> {
    let demoDID: string;

    try {
        const docs = await keymaster.resolveDID(DEMO_NAME);
        if (!docs.didDocument?.id) {
            throw new Error(`No DID found for ${DEMO_NAME}`);
        }
        demoDID = docs.didDocument.id;
    }
    catch (error) {
        console.log(`Creating ID ${DEMO_NAME}`);
        demoDID = await keymaster.createId(DEMO_NAME);
    }

    await keymaster.setCurrentId(DEMO_NAME);
    console.log(`${DEMO_NAME} wallet DID ${demoDID}`);

    const assets = await keymaster.listAssets();
    console.log(`Wallet has ${assets.length} assets`);

    let matrixCount = 0;
    let collectionCount = 0;

    for (const did of assets) {
        const asset = await keymaster.resolveAsset(did);

        if (!asset) {
            console.log(`Failed to resolve asset ${did}`);
            continue;
        }

        if (asset.tokenized) {
            asset.matrix = asset.tokenized;
            asset.tokenized = null;
            await keymaster.updateAsset(did, asset);
            console.log(`Updated tokenized to matrix for ${did}`);
        }

        if (asset.matrix) {
            console.log(`Asset ${did} is a matrix asset ${asset.title}`);
            matrixCount += 1;
        }

        if (asset.collection) {
            console.log(`Asset ${did} is a collection ${asset.name}`);
            collectionCount += 1;
        }
    }
    console.log(`Wallet has ${matrixCount} matrix assets and ${collectionCount} collections`);
}

app.listen(HOST_PORT, '0.0.0.0', async () => {
    if (OWNER_DID) {
        console.log(`${DEMO_NAME} owner DID ${OWNER_DID}`);
    }
    else {
        console.log('DEX_OWNER_DID not set');
        exit(1);
    }

    gatekeeper = new GatekeeperClient();
    await gatekeeper.connect({
        url: GATEKEEPER_URL,
        waitUntilReady: true,
        intervalSeconds: 5,
        chatty: true,
    });
    const wallet = new WalletJson();
    const cipher = new CipherNode();
    keymaster = new Keymaster({
        gatekeeper,
        wallet,
        cipher
    });
    console.log(`${DEMO_NAME} using gatekeeper at ${GATEKEEPER_URL}`);

    try {
        await verifyWallet();
    }
    catch (e: any) {
        console.error(`Error: ${e.message}`);
        exit(1);
    }

    if (DATABASE_TYPE === 'json') {
        db = new DbJson();
    } else if (DATABASE_TYPE === 'mdip') {
        db = new DbMdip(keymaster, DEMO_NAME, OWNER_DID!);
    } else {
        console.error(`Error: Unknown DATABASE_TYPE ${DATABASE_TYPE}`);
        exit(1);
    }

    try {
        await db.init();
    } catch (e: any) {
        console.error(`Error initialising database: ${e.message}`);
        process.exit(1);
    }

    console.log(`${DEMO_NAME} using wallet at ${WALLET_URL}`);
    console.log(`${DEMO_NAME} listening at ${HOST_URL}`);
});

