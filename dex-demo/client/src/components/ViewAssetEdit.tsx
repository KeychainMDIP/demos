import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
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

function ViewAssetEdit({ asset, onSave }: { asset: any, onSave: () => void }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [newTitle, setNewTitle] = useState<string>("");
    const [currentTitle, setCurrentTitle] = useState<string>("");
    const [collections, setCollections] = useState<any[]>([]);
    const [currentCollection, setCurrentCollection] = useState<string>("");
    const [newCollection, setNewCollection] = useState<string>("");

    useEffect(() => {
        const init = async () => {
            try {
                const getProfile = await api.get(`/profile/${asset.owner.did}`);
                const { collections } = getProfile.data;

                setCollections(collections);
                setCurrentCollection(asset.collection.name);
                setNewCollection(asset.collection.name);
            }
            catch (error: any) {
                showSnackbar("Failed to load profile data", 'error');
                navigate('/');
            }

            setCurrentTitle(asset.title || "");
            setNewTitle(asset.title || "");
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
            showSnackbar("Failed to set asset title", 'error');
        }
    }

    async function moveAsset() {
        try {
            const collection = collections.find(c => c.name === newCollection)?.did;
            if (!collection) {
                showSnackbar("Invalid collection selected", 'error');
                return;
            }
            await api.post(`/asset/${did}/move`, { collection });
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to move asset", 'error');
        }
    }

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>
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
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Collection</TableCell>
                        <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <TextField
                                    select
                                    value={newCollection}
                                    onChange={(e) => setNewCollection(e.target.value)}
                                    SelectProps={{
                                        native: true,
                                    }}
                                    sx={{ width: 300 }}
                                >
                                    {collections.map((collection) => (
                                        <option key={collection.did} value={collection.name}>
                                            {collection.name}
                                        </option>
                                    ))}
                                </TextField>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={moveAsset}
                                    disabled={newCollection === currentCollection}
                                >
                                    Move
                                </Button>
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetEdit;
