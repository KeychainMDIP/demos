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

function ViewAssetTrade({ asset, onSave }: { asset: any, onSave: () => void }) {
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
        const [disableBuy, setDisableBuy] = useState<boolean>(false);

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
                edition.price = price;
            } catch (error) {
                showSnackbar("Failed to update price", 'error');
            }

            setDisableSave(true);
            onSave();
        }

        async function buyEdition() {
            if (!auth.isAuthenticated) {
                showSnackbar("You must be logged in to buy an edition", 'error');
                return;
            }

            if (price > (auth.profile?.credits || 0)) {
                showSnackbar("You do not have enough credits to buy this edition", 'error');
                return;
            }

            try {
                await api.post(`/asset/${edition.did}/buy`);
                showSnackbar("Edition bought", 'success');
            } catch (error) {
                showSnackbar("Failed to buy edition", 'error');
            }

            auth.refreshAuth();
            setDisableBuy(true);
            onSave();
        }

        return (
            <TableRow>
                <TableCell><a href={`/asset/${edition.did}`}>{title}</a></TableCell>
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
                    price === 0 ? (
                        <TableCell>not for sale</TableCell>
                    ) : (
                        <TableCell>
                            <Box display="flex" alignItems="center">
                                <TextField
                                    value={price}
                                    type="number"
                                    sx={{ width: '14ch', marginRight: 1 }}
                                    disabled={true}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={buyEdition}
                                    disabled={disableBuy}
                                >
                                    Buy
                                </Button>
                            </Box>
                        </TableCell>
                    )
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
                    {auth.isAuthenticated &&
                        <>
                            <TableRow>
                                <TableCell>Owned editions</TableCell>
                                <TableCell>{editions.filter(e => e.userIsOwner).length}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Credit balance</TableCell>
                                <TableCell>{auth.profile?.credits}</TableCell>
                            </TableRow>
                        </>
                    }
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetTrade;
