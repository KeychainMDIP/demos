import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    TextField,
    Paper,
} from '@mui/material';
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";

function ViewAssetTrade({ asset, onSave }: { asset: any, onSave: () => void  }) {
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [editions, setEditions] = useState<any[]>([]);

    useEffect(() => {
        const fetchEditions = async () => {
            const userDID = auth.isAuthenticated ? auth.userDID : null;
            const editionList = asset.minted?.tokens || []

            for (const edition of editionList) {
                edition.userIsOwner = edition.owner.did === userDID;
            }

            setEditions(editionList);
        };

        fetchEditions();
    }, [asset]);

    if (!asset || !editions) {
        return <div>Loading...</div>;
    }

    function EditionRow({ edition }: { edition: any }) {
        const [title, setTitle] = useState<string>("");
        const [price, setPrice] = useState<number>(0);
        const [disableSave, setDisableSave] = useState<boolean>(true);

        useEffect(() => {
            const fetchInfo = async () => {
                setTitle(edition.title);
                setPrice(edition.price);
            };

            fetchInfo();
        }, [edition]);

        async function savePrice() {
            try {
                await api.patch(`/asset/${edition.did}`, { price });
                showSnackbar(price ? "Price updated" : "Edition delisted", 'success');
                setDisableSave(true);
                edition.price = price;
            } catch (error) {
                showSnackbar("Failed to update price", 'error');
            }

            setDisableSave(true);
            onSave();
        }

        return (
            <TableRow>
                <TableCell>{title}</TableCell>
                {edition.userIsOwner ? (
                    <TableCell>
                        <Box display="flex" alignItems="center">
                            <TextField
                                value={price}
                                type="number"
                                onChange={(event) => {
                                    const price = parseInt(event.target.value, 10);

                                    if (isNaN(price)) {
                                        setPrice(0);
                                    }
                                    else {
                                        setPrice(price);
                                    }

                                    setDisableSave(price === edition.price);
                                }}
                                inputProps={{ min: 0 }}
                                sx={{ width: '14ch', marginRight: 1 }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={savePrice}
                                disabled={disableSave}
                            >
                                Save
                            </Button>
                        </Box>
                    </TableCell>
                ) : (
                    <TableCell>{price ? price : 'not for sale'}</TableCell>
                )}
            </TableRow>
        );
    };

    return (
        <TableContainer component={Paper} style={{ maxHeight: '600px', overflow: 'auto' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Edition</TableCell>
                        <TableCell>Price (credits)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {editions.map((edition, index) => (
                        <EditionRow key={index} edition={edition} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetTrade;
