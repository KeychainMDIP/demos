import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {
    Box,
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
    const [isEditable, setIsEditable] = useState<boolean>(false);
    const [tab, setTab] = useState<string>("metadata");

    const fetchAsset = useCallback(async () => {
        if (!did) {
            showSnackbar("No DID provided for asset.", "error");
            navigate('/');
            return;
        }

        try {
            const getAsset = await api.get(`/asset/${did}`);
            const asset = getAsset.data.asset;

            setAsset(asset);
            setIsEditable(auth.isAuthenticated && auth.userDID === asset.matrix?.owner && !asset.minted && !asset.token);
        }
        catch (error: any) {
            showSnackbar("Failed to load asset data", 'error');
            navigate('/');
        }
    }, [api, did, navigate, showSnackbar]);

    useEffect(() => {
        fetchAsset();
    }, [did]);

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

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '2.0em' }}>"{asset.title || 'no title'}" by</Typography>
                <UserBadge did={asset.creator.did} fontSize={'2.0em'} imgSize={'50px'} />
            </Box>
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
                        {auth.isAuthenticated &&
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
                        <ViewAssetEdit asset={asset} onSave={fetchAsset} />
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
                        <ViewAssetPfp asset={asset} onSave={fetchAsset} />
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
