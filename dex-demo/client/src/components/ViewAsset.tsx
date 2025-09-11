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
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableRow,
    TextField,
    Typography
} from "@mui/material";

function ViewAssetMetadata({ asset, onSave }: { asset: any, onSave: () => void }) {
    const { did } = useParams();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [newTitle, setNewTitle] = useState<string>(asset.title || "");
    const [currentTitle, setCurrentTitle] = useState<string>(asset.title || "");

    async function saveTitle() {
        try {
            const title = newTitle.trim();
            await api.patch(`/asset/${did}`, { title });
            setNewTitle(title);
            setCurrentTitle(title);
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set profile name", 'error');
        }
    }

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        {auth.isAuthenticated && auth.userDID === asset.tokenized.owner ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <TextField
                                    label=""
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    slotProps={{
                                        htmlInput: {
                                            maxLength: 20,
                                        },
                                    }}
                                    sx={{ width: 300 }}
                                    margin="normal"
                                    fullWidth
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={saveTitle}
                                    disabled={newTitle === currentTitle}
                                >
                                    Save
                                </Button>
                            </Box>
                        ) : (
                            <TableCell>{asset.title || 'no title'}</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Collection</TableCell>
                        {asset.collection?.name ? (
                            <TableCell><a href={`/collection/${asset.collection.did}`}>{asset.collection.name}</a></TableCell>
                        ) : (
                            <TableCell>no collection</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Creator</TableCell>
                        {asset.owner?.name ? (
                            <TableCell><a href={`/profile/${asset.tokenized.owner}`}>{asset.owner.name}</a></TableCell>
                        ) : (
                            <TableCell>no creator</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>File size</TableCell>
                        <TableCell>{asset.image.bytes} bytes</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Image size</TableCell>
                        <TableCell>{asset.image.width} x {asset.image.height} pixels</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Image type</TableCell>
                        <TableCell>{asset.image.type}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

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
