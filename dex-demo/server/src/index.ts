import express, {
    Request,
    Response,
    NextFunction
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
import KeymasterClient from '@mdip/keymaster/client';
import WalletJson from '@mdip/keymaster/wallet/json';
import { DatabaseInterface, User } from './db/interfaces.js';
import { DbJson } from './db/json.js';
import e from 'express';
import { exit } from 'process';

let keymaster: Keymaster | KeymasterClient;
let db: DatabaseInterface;

dotenv.config();

const HOST_PORT = Number(process.env.DEX_HOST_PORT) || 3000;
const HOST_URL = process.env.DEX_HOST_URL || 'http://localhost:3000';
const GATEKEEPER_URL = process.env.DEX_GATEKEEPER_URL || 'http://localhost:4224';
const WALLET_URL = process.env.DEX_WALLET_URL || 'http://localhost:4224';
const OWNER_DID = process.env.DEX_OWNER_DID;

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

        const currentDb = db.loadDb();
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
        const currentDb = db.loadDb();

        if (!currentDb.users) {
            currentDb.users = {};
        }

        const now = new Date().toISOString();

        if (currentDb.users[did]) {
            currentDb.users[did].lastLogin = now;
            currentDb.users[did].logins = (currentDb.users[did].logins || 0) + 1;
        } else {
            currentDb.users[did] = {
                firstLogin: now,
                lastLogin: now,
                logins: 1
            }
        }

        if (!currentDb.users[did].role) {
            if (did === OWNER_DID) {
                currentDb.users[did].role = 'Owner';
            } else {
                currentDb.users[did].role = 'Member';
            }
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
        const currentDb = db.loadDb();

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

app.get('/api/profile/:did', isAuthenticated, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const currentDb = db.loadDb();

        if (!currentDb.users || !currentDb.users[did]) {
            res.status(404).send('Not found');
            return;
        }

        const profile: User = { ...currentDb.users[did] };

        profile.did = did;
        profile.isUser = (req.session?.user?.did === did);

        res.json(profile);
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

        const currentDb = db.loadDb();
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

app.put('/api/profile/:did/role', isAdmin, async (req: Request, res: Response) => {
    try {
        const did = req.params.did;
        const { role } = req.body;
        const validRoles = ['Admin', 'Moderator', 'Member'];

        if (!validRoles.includes(role)) {
            res.status(400).send(`valid roles include ${validRoles}`);
            return;
        }

        const currentDb = db.loadDb();
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

app.get('/api/did/:id', async (req, res) => {
    try {
        const docs = await keymaster.resolveDID(req.params.id, req.query);
        res.json({ docs });
    } catch (error: any) {
        res.status(404).send("DID not found");
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
    const demoName = 'dex-demo';
    let demoDID: string;

    try {
        const docs = await keymaster.resolveDID(demoName);
        if (!docs.didDocument?.id) {
            throw new Error(`No DID found for ${demoName}`);
        }
        demoDID = docs.didDocument.id;
    }
    catch (error) {
        console.log(`Creating ID ${demoName}`);
        demoDID = await keymaster.createId(demoName);
    }

    await keymaster.setCurrentId(demoName);
    console.log(`${demoName} wallet DID ${demoDID}`);
}

app.listen(HOST_PORT, '0.0.0.0', async () => {
    db = new DbJson();

    if (db.init) {
        try {
            db.init();
        } catch (e: any) {
            console.error(`Error initialising database: ${e.message}`);
            process.exit(1);
        }
    }

    const gatekeeper = new GatekeeperClient();
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
    console.log(`dex-demo using gatekeeper at ${GATEKEEPER_URL}`);

    try {
        await verifyWallet();
    }
    catch (e: any) {
        console.error(`Error: ${e.message}`);
        exit(1);
    }

    if (OWNER_DID) {
        console.log(`dex-demo owner DID ${OWNER_DID}`);
    }
    else {
        console.log('DEX_OWNER_DID not set');
        exit(1);
    }

    console.log(`dex-demo using wallet at ${WALLET_URL}`);
    console.log(`dex-demo listening at ${HOST_URL}`);
});

