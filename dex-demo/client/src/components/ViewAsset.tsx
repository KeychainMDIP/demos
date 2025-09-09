import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Table, TableBody, TableContainer, TableCell, TableRow, Typography } from "@mui/material";

function ViewAsset() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [asset, setAsset] = useState<any>(null);

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
            <Typography variant="h4">{asset.name} by {asset.profile.name}</Typography>
            <div className="container">
                <div className="left-pane">
                    <img src={`/api/ipfs/${asset.image.cid}`} alt={asset.name} style={{ width: '100%', height: 'auto' }} />
                </div>
                <div className="right-pane">
                    <TableContainer>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>DID</TableCell>
                                    <TableCell>{did}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>CID</TableCell>
                                    <TableCell>{asset.image.cid}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Created</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Updated</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Version</TableCell>
                                    <TableCell></TableCell>
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
                </div>
            </div>
        </Box>
    )
}

export default ViewAsset;
