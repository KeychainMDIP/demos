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
import multer from 'multer';

import CipherNode from '@mdip/cipher/node';
import GatekeeperClient from '@mdip/gatekeeper/client';
import Keymaster, { DmailMessage } from '@mdip/keymaster';
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
let DEMO_DID: string;

const app = express();
const logins: Record<string, {
    response: string;
    challenge: string;
    did: string;
    verify: any;
}> = {};

app.use(morgan('dev'));
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

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

const ValidLicenses = {
    "CC BY": "https://creativecommons.org/licenses/by/4.0/",
    "CC BY-SA": "https://creativecommons.org/licenses/by-sa/4.0/",
    "CC BY-NC": "https://creativecommons.org/licenses/by-nc/4.0/",
    "CC BY-ND": "https://creativecommons.org/licenses/by-nd/4.0/",
    "CC BY-NC-SA": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    "CC BY-NC-ND": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
};

app.get('/api/licenses', async (_: Request, res: Response) => {

    res.json(ValidLicenses);
});

const DexRates = {
    editionRate: 100,
    storageRate: 0.001, // per byte in credits
};

app.get('/api/rates', async (_: Request, res: Response) => {
    res.json(DexRates);
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
        const collected: any[] = [];

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
                        name: asset.name,
                        items: asset.collection.assets.length,
                        thumbnail,
                    });
                }
            } catch (e) {
                console.log(`Failed to resolve collection ${collectionId}: ${e}`);
            }
        }

        for (const assetId of rawProfile.assets?.collected || []) {
            try {
                const asset = await keymaster.resolveAsset(assetId);
                if (asset) {
                    const thumbnail = {
                        did: asset.thumbnail || currentDb.settings?.thumbnail,
                        cid: undefined,
                    };

                    if (thumbnail.did) {
                        const thumbAsset = await keymaster.resolveAsset(thumbnail.did);
                        if (thumbAsset && thumbAsset.image) {
                            thumbnail.cid = thumbAsset.image.cid;
                        }
                    }

                    collected.push({
                        did: assetId,
                        title: asset.title,
                        image: asset.image,
                        thumbnail,
                    });
                }
            } catch (e) {
                console.log(`Failed to resolve collected asset ${assetId}: ${e}`);
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
            collected,
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
        const currentDb = await db.loadDb();
        const users = currentDb.users || {};
        const docs = await keymaster.resolveDID(req.params.did);

        if (!docs?.didDocumentData) {
            res.status(404).send("DID not found");
            return;
        }

        let asset: any = docs.didDocumentData || {};

        asset.did = req.params.did;
        asset.created = docs.didDocumentMetadata?.created || '';
        asset.updated = docs.didDocumentMetadata?.updated || asset.created;

        async function fetchUser(did: string) {
            if (!users[did]) {
                return {
                    did,
                    name: 'Unknown',
                };
            }

            const pfp = {
                did: users[did].pfp || currentDb.settings?.pfp,
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

            return {
                did,
                name: users[did].name || 'Anon',
                pfp,
            };
        }

        if (asset.token?.matrix) {
            const { matrix, minted } = await keymaster.resolveAsset(asset.token.matrix);
            asset.matrix = matrix;

            if (minted.history && minted.history.length > 0) {
                asset.token.history = minted.history.filter((record: any) => record.details?.did === req.params.did) || [];
                // insert the first (mint) event
                asset.token.history.unshift(minted.history[0]);
            }
            else {
                asset.token.history = [];
            }
        }

        if (asset.matrix) {
            asset.matrix.original = asset.cloned;
            asset.creator = await fetchUser(asset.matrix.owner);

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

                const thumbnail = {
                    did: asset.collection.thumbnail?.did || currentDb.settings?.thumbnail,
                    cid: undefined,
                };

                if (thumbnail.did) {
                    try {
                        const thumbnailAsset = await keymaster.resolveAsset(thumbnail.did);
                        if (thumbnailAsset && thumbnailAsset.image) {
                            thumbnail.cid = thumbnailAsset.image.cid;
                        }
                    } catch (e) {
                        console.log(`Failed to resolve profile picture ${thumbnail.did}: ${e}`);
                    }
                }

                asset.collection.thumbnail = thumbnail;
            }
        } else {
            asset.creator = {};
        }

        if (asset.minted) {
            // Replace each did in asset.minted.tokens with enriched info
            asset.minted.tokens = await Promise.all(asset.minted.tokens.map(async (did: string) => {
                const { token, title } = await keymaster.resolveAsset(did);
                const owner: any = await fetchUser(token.owner);
                const edition: number = token.edition || 0;
                const price: number = token.price || 0;

                return {
                    did,
                    title,
                    edition,
                    price,
                    owner,
                };
            }));
        }

        if (asset.token) {
            asset.owner = await fetchUser(asset.token.owner);
        } else {
            asset.owner = asset.creator;
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

        const owner = asset.matrix?.owner || asset.token?.owner;

        if (!req.session.user || req.session.user.did !== owner) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const data: any = {};

        if (updates.title !== undefined) {
            data.title = updates.title;
        }

        let event;

        if (updates.price !== undefined) {
            if (!asset.token) {
                res.status(400).send("Only token assets can be listed for sale");
                return;
            }
            data.token = {
                ...asset.token,
                price: updates.price,
            };

            event = {
                type: 'list',
                time: new Date().toISOString(),
                actor: owner,
                details: {
                    price: updates.price,
                    edition: data.token.edition,
                    title: asset.title,
                    did,
                }
            };
        }

        await keymaster.updateAsset(did, data);

        if (event) {
            const matrixDID = asset.token?.matrix;
            const matrixAsset = await keymaster.resolveAsset(matrixDID);
            if (matrixAsset.minted) {
                const minted = matrixAsset.minted;
                minted.history.push(event);
                await keymaster.updateAsset(matrixDID, { minted });
            }
        }

        res.json({ ok: true, message: 'Asset updated successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to update asset");
    }
});

app.post('/api/asset/:did/move', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { collection } = req.body;
        const { matrix } = await keymaster.resolveAsset(did);
        if (!matrix) {
            res.status(400).send("Only matrix assets can be moved to a collection");
            return;
        }

        const { collection: currentCollection } = await keymaster.resolveAsset(matrix.collection);
        if (!currentCollection) {
            res.status(400).send("Invalid collection");
            return;
        }

        const { collection: newCollection } = await keymaster.resolveAsset(collection);
        if (!newCollection) {
            res.status(400).send("Invalid collection");
            return;
        }

        // Remove did from current collection and add to new collection
        currentCollection.assets = currentCollection.assets.filter((assetDid: string) => assetDid !== did);
        newCollection.assets.push(did);

        await keymaster.updateAsset(matrix.collection, { collection: currentCollection });
        await keymaster.updateAsset(collection, { collection: newCollection });

        // Update asset's matrix collection reference
        await keymaster.updateAsset(did, {
            matrix: {
                ...matrix,
                collection,
            }
        });

        res.json({ ok: true, message: 'Asset moved successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to move asset");
    }
});

app.post('/api/asset/:did/mint', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { editions, royalty, license } = req.body;

        if (typeof editions !== 'number' || editions < 0 || editions > 100) {
            res.status(400).send("Editions must be a number between 0 and 100");
            return;
        }

        if (typeof royalty !== 'number' || royalty < 0 || royalty > 25) {
            res.status(400).send("Royalty must be a number between 0 and 25");
            return;
        }

        if (typeof license !== 'string' || !(license in ValidLicenses)) {
            res.status(400).send("Invalid license");
            return;
        }

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

        if (asset.minted) {
            res.status(400).send("Asset has already been minted");
            return;
        }

        const currentDb = await db.loadDb();
        const users = currentDb.users || {};
        const user = users[owner];

        if (!user) {
            res.status(404).send("User not found");
            return;
        }

        const fileSize = asset.image?.bytes || 0;
        const storageFee = Math.ceil(fileSize * DexRates.storageRate);
        const mintingFee = editions * DexRates.editionRate;
        const totalFee = storageFee + mintingFee;

        if ((user.credits || 0) < totalFee) {
            res.status(403).send("Insufficient credits");
            return;
        }

        const tokens = [];

        for (let i = 1; i <= editions; i++) {
            const title = `${asset.title || 'Untitled'} (#${i} of ${editions})`;
            const image = asset.image;
            const token = {
                edition: i,
                matrix: did,
                price: 0,
                owner: owner,
            };

            const editionDID = await keymaster.createAsset({ title, image, token });
            tokens.push(editionDID);
        }

        const event = {
            type: 'mint',
            time: new Date().toISOString(),
            actor: owner,
        };

        const minted = {
            editions,
            royalty,
            license,
            tokens,
            history: [event],
        };

        await keymaster.updateAsset(did, { minted });

        user.credits = (user.credits || 0) - totalFee;
        db.writeDb(currentDb);

        res.json({ ok: true, message: 'Asset minted successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to update asset");
    }
});

app.post('/api/asset/:did/unmint', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
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

        if (!asset.minted) {
            res.status(400).send("Asset has not been minted");
            return;
        }

        // All tokens must be owned by the asset owner or the exchange
        for (const did of asset.minted.tokens) {
            try {
                const docs = await keymaster.resolveDID(did);
                const tokenOwner = docs?.didDocument?.controller;

                if (tokenOwner !== owner && tokenOwner !== DEMO_DID) {
                    res.status(400).send("All tokens must be owned by the asset owner to unmint");
                    return;
                }
            } catch (e) {
                console.log(`Failed to resolve token ${did}: ${e}`);
            }
        }

        await keymaster.updateAsset(did, { minted: null });

        // TBD return credits?

        res.json({ ok: true, message: 'Asset unminted successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to update asset");
    }
});

app.post('/api/asset/:did/buy', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const asset = await keymaster.resolveAsset(did);

        if (!asset) {
            res.status(404).send("Asset not found");
            return;
        }

        if (!asset.token) {
            res.status(400).send("Asset is not a token");
            return;
        }

        if (!req.session.user?.did) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const buyer = req.session.user.did;
        const seller = asset.token.owner;
        const price = asset.token.price || 0;

        if (buyer === seller) {
            res.status(400).send("You already own this asset");
            return;
        }

        if (price === 0) {
            res.status(400).send("Asset is not for sale");
            return;
        }

        const currentDb = await db.loadDb();
        const users = currentDb.users || {};
        const buyerProfile = users[buyer];
        const sellerProfile = users[seller];

        if (!buyerProfile) {
            res.status(404).send("Buyer not found");
            return;
        }

        if (!sellerProfile) {
            res.status(404).send("Seller not found");
            return;
        }

        if ((buyerProfile.credits || 0) < price) {
            res.status(403).send("Insufficient credits");
            return;
        }

        // Royalty adjustment
        let royalty = 0;
        let creator;

        if (asset.token.matrix) {
            const matrix = await keymaster.resolveAsset(asset.token.matrix);
            creator = matrix.matrix?.owner;
            const creatorProfile = users[creator];

            if (matrix.minted?.royalty) {
                royalty = Math.ceil((matrix.minted.royalty / 100) * price);
            }

            if (creatorProfile && royalty > 0) {
                creatorProfile.credits = (creatorProfile.credits || 0) + royalty;
                console.log(`${creatorProfile.name || 'Unknown'} (${creator}) received ${royalty} credits in royalties`);
            }
        }

        // Transfer credits
        buyerProfile.credits = (buyerProfile.credits || 0) - price;
        console.log(`${buyerProfile.name || 'Unknown'} (${buyer}) paid ${price} credits`);

        sellerProfile.credits = (sellerProfile.credits || 0) + price - royalty;
        console.log(`${sellerProfile.name || 'Unknown'} (${seller}) received ${price - royalty} credits`);

        // Transfer token ownership (DID ownership TBD)
        await keymaster.updateAsset(did, { token: { ...asset.token, owner: buyer, price: 0 } });

        // Add to buyer's collected assets
        if (!buyerProfile.assets) {
            buyerProfile.assets = { created: [], collected: [], collections: [] };
        }

        if (buyer !== creator) {
            buyerProfile.assets.collected.push(did);
        }

        // Remove from seller's collected assets if present
        if (sellerProfile.assets) {
            sellerProfile.assets.collected = (sellerProfile.assets.collected || []).filter((a: string) => a !== did);
        }

        // Add sale event to matrix history
        const matrixDID = asset.token.matrix;
        const matrixAsset = await keymaster.resolveAsset(matrixDID);
        if (matrixAsset.minted) {
            const minted = matrixAsset.minted;
            const event = {
                type: 'sale',
                time: new Date().toISOString(),
                actor: buyer,
                details: {
                    seller,
                    price,
                    edition: asset.token.edition,
                    title: asset.title,
                    did,
                }
            };
            minted.history.push(event);
            await keymaster.updateAsset(matrixDID, { minted });
        }

        db.writeDb(currentDb);

        try {
            const subject = `Congratulations on the sale of "${asset.title}"`;
            const url = `${HOST_URL}/asset/${did}`;
            const body = `"${asset.title}" was sold by ${sellerProfile.name} to ${buyerProfile.name} for ${price} credits\n\n${url}\n\n - Sent from ${DEMO_NAME}`;
            const dmail: DmailMessage = {
                to: [seller, buyer],
                cc: creator ? [creator] : [],
                subject,
                body,
            };
            const dmailDID = await keymaster.createDmail(dmail);
            await keymaster.sendDmail(dmailDID);
        } catch (error) {
            console.error("Failed to send Dmail notification:", error);
        }

        res.json({ ok: true, message: 'Asset bought successfully' });
    } catch (error: any) {
        res.status(500).send("Failed to buy asset");
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

app.post('/api/collection/:did/upload', isAuthenticated, upload.array('images', 100), async (req: Request, res: Response) => {
    try {
        const { did } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).send("No files uploaded");
            return;
        }

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

        const currentDb = await db.loadDb();
        const users = currentDb.users || {};
        const user = users[collection.owner];

        if (!user) {
            res.status(404).send("User not found");
            return;
        }

        let filesUploaded = 0;
        let filesSkipped = 0;
        let filesErrored = 0;
        let bytesUploaded = 0;
        let creditsDebited = 0;

        for (const file of files) {
            try {
                // Get image metadata
                const fileSize = file.buffer.length;
                const storageFee = Math.ceil(fileSize * DexRates.storageRate);

                // Check if user has enough credits
                if ((user.credits || 0) < storageFee) {
                    filesSkipped++;
                    continue;
                }

                // Create asset with image data
                const assetDID = await keymaster.createImage(file.buffer);

                if (!assetDID) {
                    filesErrored++;
                    continue;
                }

                const title = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension

                const matrix = {
                    owner: collection.owner,
                    collection: did,
                };

                const ok = await keymaster.updateAsset(assetDID, { title, matrix });

                if (!ok) {
                    filesErrored++;
                    continue;
                }

                // Add asset to collection
                collection.assets.push(assetDID);

                // Debit user credits
                user.credits = (user.credits || 0) - storageFee;
                creditsDebited += storageFee;

                filesUploaded++;
                bytesUploaded += fileSize;
            } catch (error) {
                console.error('Error processing file:', file.originalname, error);
                filesErrored++;
            }
        }

        // Save updated collection and user data
        await keymaster.updateAsset(did, { collection });
        db.writeDb(currentDb);

        res.json({
            ok: true,
            filesUploaded,
            filesSkipped,
            filesErrored,
            bytesUploaded,
            creditsDebited,
            message: `Uploaded ${filesUploaded} files successfully`,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).send("Could not upload files to collection");
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
    try {
        const docs = await keymaster.resolveDID(DEMO_NAME);
        if (!docs.didDocument?.id) {
            throw new Error(`No DID found for ${DEMO_NAME}`);
        }
        DEMO_DID = docs.didDocument.id;
    }
    catch (error) {
        console.log(`Creating ID ${DEMO_NAME}`);
        DEMO_DID = await keymaster.createId(DEMO_NAME);
    }

    await keymaster.setCurrentId(DEMO_NAME);
    console.log(`${DEMO_NAME} wallet DID ${DEMO_DID}`);

    const assets = await keymaster.listAssets();
    console.log(`Wallet has ${assets.length} assets`);

    let matrixCount = 0;
    let tokenCount = 0;
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

        if (asset.token) {
            console.log(`Asset ${did} is a token asset ${asset.title}`);
            tokenCount += 1;
        }

        if (asset.collection) {
            console.log(`Asset ${did} is a collection ${asset.name}`);
            collectionCount += 1;
        }
    }
    console.log(`Wallet has ${matrixCount} matrix assets, ${tokenCount} token assets, and ${collectionCount} collections`);
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

