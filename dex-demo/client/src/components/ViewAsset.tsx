import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Tab, Tabs, Table, TableBody, TableContainer, TableCell, TableRow, Typography } from "@mui/material";

function ViewAssetMetadata({ asset }: { asset: any }) {
    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>{asset.name || 'no title'}</TableCell>
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
                        {asset.profile?.name ? (
                            <TableCell><a href={`/profile/${asset.tokenized.owner}`}>{asset.profile.name}</a></TableCell>
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

    useEffect(() => {
        if (!did) {
            showSnackbar("No DID provided for asset.", "error");
            navigate('/');
            return;
        }

        const init = async () => {
            try {
                const getAsset = await api.get(`/asset/${did}`);
                const asset = getAsset.data.asset;

                setAsset(asset);
            }
            catch (error: any) {
                showSnackbar("Failed to load asset data", 'error');
                navigate('/');
            }
        };

        init();
    }, [did, navigate, showSnackbar]);

    if (!asset || !asset.image) {
        return <></>;
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, p: 3 }}>
            <Typography variant="h4">{asset.name || 'no name'} by {asset.profile.name}</Typography>
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
                        <ViewAssetMetadata asset={asset} />
                    }
                </div>
            </div>
        </Box>
    )
}

export default ViewAsset;
