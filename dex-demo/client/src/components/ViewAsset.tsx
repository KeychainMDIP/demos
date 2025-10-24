import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {
    Box,
    Button,
    Tab,
    Tabs,
    Typography
} from "@mui/material";

import ViewAssetMetadata from "./ViewAssetMetadata.js";
import ViewAssetPfp from "./ViewAssetPfp.js";
import ViewAssetEdit from "./ViewAssetEdit.js";
import ViewAssetMint from "./ViewAssetMint.js";
import ViewAssetToken from "./ViewAssetToken.js";
import ViewAssetHistory from "./ViewAssetHistory.js";
import ViewAssetTrade from "./ViewAssetTrade.js";
import UserBadge from "./UserBadge.js";

function ViewAsset() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [asset, setAsset] = useState<any>(null);
    const [collection, setCollection] = useState<any>(null);
    const [isEditable, setIsEditable] = useState<boolean>(false);
    const [isAssetOwner, setIsAssetOwner] = useState<boolean>(false);
    const [isCollectionOwner, setIsCollectionOwner] = useState<boolean>(false);
    const [tab, setTab] = useState<string>("metadata");
    const [firstDid, setFirstDid] = useState<string | null>(null);
    const [prevDid, setPrevDid] = useState<string | null>(null);
    const [nextDid, setNextDid] = useState<string | null>(null);
    const [lastDid, setLastDid] = useState<string | null>(null);

    const fetchAsset = useCallback(async () => {
        if (!did) {
            showSnackbar("No DID provided for asset.", "error");
            navigate('/');
            return;
        }

        try {
            const getAsset = await api.get(`/asset/${did}`);
            const asset = getAsset.data.asset;
            const owner = asset.token?.owner || asset.matrix?.owner;
            const isAssetOwner = auth.isAuthenticated && auth.userDID === owner;
            const isEditable = isAssetOwner && asset.matrix && !asset.minted && !asset.token;

            if (asset.matrix?.collection) {
                const getCollection = await api.get(`/collection/${asset.matrix.collection}`);
                const { collection } = getCollection.data;
                const isCollectionOwner = auth.isAuthenticated && auth.userDID === collection.owner.did;

                setCollection(collection);
                setIsCollectionOwner(isCollectionOwner);

                const list = (collection.assets || []).map((a: any) => a.did);

                let prevDid = null;
                let nextDid = null;
                let firstDid = null;
                let lastDid = null;

                for (let i = 0; i < list.length; i++) {
                    if (list[i] === did) {
                        if (i > 0) {
                            prevDid = list[i - 1];
                        }
                        if (i < list.length - 1) {
                            nextDid = list[i + 1];
                        }
                        break;
                    }
                }

                firstDid = list[0];

                if (firstDid === did) {
                    firstDid = null;
                }

                lastDid = list[list.length - 1];

                if (lastDid === did) {
                    lastDid = null;
                }

                setFirstDid(firstDid);
                setPrevDid(prevDid);
                setNextDid(nextDid);
                setLastDid(lastDid);
            }

            setAsset(asset);
            setIsEditable(isEditable);
            setIsAssetOwner(isAssetOwner);
        }
        catch (error: any) {
            showSnackbar("Failed to load asset data", 'error');
            navigate('/');
        }
    }, [api, auth, did, navigate, showSnackbar]);

    useEffect(() => {
        if (!auth.loading && did) {
            fetchAsset();
        }
    }, [did, auth.loading, fetchAsset]);

    if (!asset || !asset.image) {
        return <></>;
    }

    async function mintAsset() {
        auth.refreshAuth();
        await fetchAsset();
        setTab('token');
    }

    async function unmintAsset() {
        auth.refreshAuth();
        await fetchAsset();
        setTab('mint');
    }

    function CollectionLink({ collection }: { collection: any }) {
        if (!collection) {
            return <span>unknown collection</span>;
        }

        return (
            <a href={`/collection/${collection.did}`}>
                <Typography sx={{ fontSize: '2.0em' }}>"{collection.name || 'no name'}"</Typography>
            </a>
        );
    }

    function MatrixLink({ matrix }: { matrix: any }) {
        if (!matrix) {
            return <span>unknown matrix</span>;
        }

        return (
            <a href={`/asset/${matrix.did}`}>
                <Typography sx={{ fontSize: '1.0em' }}>"{matrix.title || 'no name'}"</Typography>
            </a>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '2.0em' }}>"{asset.title || 'no title'}" in</Typography>
                <CollectionLink collection={collection} />
                <Typography sx={{ fontSize: '2.0em' }}>by</Typography>
                <UserBadge did={asset.creator.did} fontSize={'2.0em'} imgSize={'50px'} />
            </Box>
            {asset.token ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.0em' }}>Limited edition of</Typography>
                    <MatrixLink matrix={asset.matrix} />
                </Box>
            ) : (
                <div style={{ display: 'inline-block' }}>
                    <Button
                        color="inherit"
                        disabled={!firstDid}
                        onClick={() => navigate(`/asset/${firstDid}`)}>
                        {'<<'}
                    </Button>
                    <Button
                        color="inherit"
                        disabled={!prevDid}
                        onClick={() => navigate(`/asset/${prevDid}`)}>
                        {'<'}
                    </Button>
                    <Button
                        color="inherit"
                        disabled={!nextDid}
                        onClick={() => navigate(`/asset/${nextDid}`)}>
                        {'>'}
                    </Button>
                    <Button
                        color="inherit"
                        disabled={!lastDid}
                        onClick={() => navigate(`/asset/${lastDid}`)}>
                        {'>>'}
                    </Button>
                </div>
            )}
            <div className="container">
                <div className="left-pane">
                    <img src={`/api/ipfs/${asset.image.cid}`} alt={asset.name} style={{ width: '100%', height: 'auto' }} />
                </div>
                <div className="right-pane">
                    <Tabs
                        value={tab}
                        onChange={(_, newTab) => { setTab(newTab); }}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab key="metadata" value="metadata" label={'Metadata'} />
                        {isEditable &&
                            <Tab key="edit" value="edit" label={'Edit'} />
                        }
                        {isEditable &&
                            <Tab key="mint" value="mint" label={'Mint'} />
                        }
                        {asset.minted &&
                            <Tab key="token" value="token" label={'Token'} />
                        }
                        {asset.minted &&
                            <Tab key="trade" value="trade" label={'Trade'} />
                        }
                        {(isAssetOwner || auth.isAdmin) &&
                            <Tab key="pfp" value="pfp" label={'Pfp'} />
                        }
                        {(asset.minted || asset.token) &&
                            <Tab key="history" value="history" label={'History'} />
                        }
                    </Tabs>
                    {tab === 'metadata' &&
                        <ViewAssetMetadata asset={asset} />
                    }
                    {tab === 'edit' &&
                        <ViewAssetEdit asset={asset} collection={collection} onSave={fetchAsset} />
                    }
                    {tab === 'mint' &&
                        <ViewAssetMint asset={asset} onMint={mintAsset} />
                    }
                    {tab === 'token' &&
                        <ViewAssetToken asset={asset} onUnmint={unmintAsset} />
                    }
                    {tab === 'trade' &&
                        <ViewAssetTrade asset={asset} onSave={fetchAsset} />
                    }
                    {tab === 'pfp' &&
                        <ViewAssetPfp asset={asset} isAssetOwner={isAssetOwner} isCollectionOwner={isCollectionOwner} onSave={fetchAsset} />
                    }
                    {tab === 'history' &&
                        <ViewAssetHistory asset={asset} />
                    }
                </div>
            </div>
        </Box>
    )
}

export default ViewAsset;
