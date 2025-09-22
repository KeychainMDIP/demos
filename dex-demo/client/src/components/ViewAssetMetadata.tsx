import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {
    Box,
    Button,
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableRow,
    TextField,
} from "@mui/material";

function ViewAssetMetadata({ asset, onSave }: { asset: any, onSave: () => void }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [newTitle, setNewTitle] = useState<string>("");
    const [currentTitle, setCurrentTitle] = useState<string>("");
    const [firstDid, setFirstDid] = useState<string | null>(null);
    const [prevDid, setPrevDid] = useState<string | null>(null);
    const [nextDid, setNextDid] = useState<string | null>(null);
    const [lastDid, setLastDid] = useState<string | null>(null);
    const [isEditable, setIsEditable] = useState<boolean>(false);

    function findAdjacentDids() {
        const list = asset.collection?.assets || [];

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

        return { firstDid, prevDid, nextDid, lastDid };
    }

    useEffect(() => {
        const init = async () => {
            const { firstDid, prevDid, nextDid, lastDid } = findAdjacentDids();

            setFirstDid(firstDid);
            setPrevDid(prevDid);
            setNextDid(nextDid);
            setLastDid(lastDid);

            setCurrentTitle(asset.title || "");
            setNewTitle(asset.title || "");

            setIsEditable(auth.isAuthenticated && auth.userDID === asset.matrix?.owner && !asset.minted)
        };

        init();
    }, [asset]);

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
                        {isEditable ? (
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
                            <TableCell>
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
                                    <a href={`/collection/${asset.collection.did}`}>{asset.collection.name}</a>
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
                            </TableCell>
                        ) : (
                            <TableCell>no collection</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Creator</TableCell>
                        {asset.owner?.did && asset.owner?.name ? (
                            <TableCell><a href={`/profile/${asset.owner.did}`}>{asset.owner.name}</a></TableCell>
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

export default ViewAssetMetadata;
