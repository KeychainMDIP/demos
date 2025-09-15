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

function ViewAsset() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [asset, setAsset] = useState<any>(null);
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

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, p: 3 }}>
            <Typography variant="h4">"{asset.title || 'no title'}" by {asset.owner.name}</Typography>
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
                        <Tab key="token" value="token" label={'Token'} />
                        <Tab key="buysell" value="buysell" label={'Buy/Sell'} />
                        {auth.isAuthenticated &&
                            <Tab key="pfp" value="pfp" label={'Pfp'} />
                        }
                        <Tab key="history" value="history" label={'History'} />
                    </Tabs>
                    {tab === 'metadata' &&
                        <ViewAssetMetadata asset={asset} onSave={fetchAsset} />
                    }
                </div>
            </div>
        </Box>
    )
}

export default ViewAsset;
