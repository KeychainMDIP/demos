import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [newTitle, setNewTitle] = useState<string>("");
    const [currentTitle, setCurrentTitle] = useState<string>("");

    useEffect(() => {
        const init = async () => {
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
            showSnackbar("Failed to set profile name", 'error');
        }
    }

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
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
                    </TableRow>
                    <TableRow>
                        <TableCell>Collection</TableCell>
                        {asset.collection?.name ? (
                            <TableCell>
                                <a href={`/collection/${asset.collection.did}`}>{asset.collection.name}</a>
                            </TableCell>
                        ) : (
                            <TableCell>no collection</TableCell>
                        )}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetEdit;
