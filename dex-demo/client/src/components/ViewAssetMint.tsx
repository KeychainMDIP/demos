import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {
    Button,
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableRow,
    TextField,
    Select,
    MenuItem,
} from "@mui/material";

function ViewAssetMint({ asset, onMint }: { asset: any, onMint: () => void }) {
    const { did } = useParams();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [fileSize, setFileSize] = useState<number>(0);
    const [editions, setEditions] = useState<number>(1);
    const [editionRate, setEditionRate] = useState<number>(0);
    const [editionFee, setEditionFee] = useState<number>(0);
    const [storageFee, setStorageFee] = useState<number>(0);
    const [totalFee, setTotalFee] = useState<number>(0);
    const [royalty, setRoyalty] = useState<number>(0);
    const [license, setLicense] = useState<string>('');
    const [licenses, setLicenses] = useState<string[]>([]);
    const [disableMint, setDisableMint] = useState<boolean>(false);
    const [showAddCredits, setShowAddCredits] = useState<boolean>(false);
    const [credits, setCredits] = useState(0);

    useEffect(() => {
        const init = async () => {
            try {
                const getLicenses = await api.get(`/licenses`);
                const getRates = await api.get(`/rates`);

                const licenses = getLicenses.data;
                const licenseList = Object.keys(licenses).sort();
                const rates = getRates.data;
                const editionRate = rates.editionRate || 100;
                const storageRate = rates.storageRate || 0.001;
                const credits = asset.owner?.credits || 0;
                const fileSize = asset.image?.bytes || 0;
                const storageFee = Math.ceil(fileSize * storageRate);
                const editionFee = editions * editionRate;
                const totalFee = storageFee + editionFee;

                setLicenses(licenseList);
                setLicense(licenseList[0]);
                setCredits(credits);
                setFileSize(fileSize);
                setStorageFee(storageFee);
                setEditionRate(editionRate);
                setEditions(editions);
                setEditionFee(editionFee);
                setTotalFee(totalFee);
                setDisableMint(totalFee > credits);
                setShowAddCredits(totalFee > credits);
            } catch (error) {
                showSnackbar("Failed to fetch licenses", 'error');
            }
        };

        init();
    }, [asset]);

    function changeEditions(value: string) {
        let editions = parseInt(value, 10);

        if (isNaN(editions)) {
            editions = 0;
        }

        // Clamp editions between 0 and 100
        if (editions < 0) {
            editions = 0;
        } else if (editions > 100) {
            editions = 100;
        }

        const editionFee = editions * editionRate;
        const totalFee = storageFee + editionFee;

        setEditions(editions);
        setEditionFee(editionFee);
        setTotalFee(totalFee);
        setDisableMint(totalFee > credits);
        setShowAddCredits(totalFee > credits);
    }

    function handleRoyaltyChange(value: string) {
        const royalty = parseInt(value, 10);
        setRoyalty(royalty);
    }

    async function addCredits() {
        try {
            const getCredits = await api.post(`/add-credits`, { amount: 1000 });
            const { balance } = getCredits.data;
            setCredits(balance);
            setDisableMint(totalFee > balance);
            setShowAddCredits(totalFee > balance);
        } catch (error) {
            showSnackbar("Failed to add credits", 'error');
        }
    }

    async function mintAsset() {
        setDisableMint(true);

        try {
            await api.post(`/asset/${did}/mint`, { editions, royalty, license });
            onMint();
        } catch (error) {
            showSnackbar("Failed to mint asset", 'error');
        }
    }

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>{asset.title || 'no title'}</TableCell>
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
                    <TableRow>
                        <TableCell>Creator</TableCell>
                        {asset.owner?.did && asset.owner?.name ? (
                            <TableCell><a href={`/profile/${asset.owner.did}`}>{asset.owner.name}</a></TableCell>
                        ) : (
                            <TableCell>no creator</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>License</TableCell>
                        <TableCell>
                            <Select
                                value={license}
                                onChange={(e) => setLicense(e.target.value)}
                                sx={{ width: '20ch' }}
                            >
                                {licenses.map((licenseName, index) => (
                                    <MenuItem key={index} value={licenseName}>
                                        {licenseName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Royalty (0-25%)</TableCell>
                        <TableCell>
                            <TextField
                                type="number"
                                value={royalty}
                                onChange={(e) => handleRoyaltyChange(e.target.value)}
                                margin="normal"
                                inputProps={{
                                    min: 0,
                                    max: 25,
                                }}
                                sx={{ width: '20ch' }}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Editions (0-100)</TableCell>
                        <TableCell>
                            <TextField
                                type="number"
                                value={editions}
                                onChange={(e) => changeEditions(e.target.value)}
                                margin="normal"
                                inputProps={{
                                    min: 0,
                                    max: 100,
                                }}
                                sx={{ width: '20ch' }}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Storage fee</TableCell>
                        <TableCell>{storageFee} credits for {fileSize} bytes</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Minting fee</TableCell>
                        <TableCell>{editionFee} credits for {editions} editions</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Total fee</TableCell>
                        <TableCell>{totalFee} credits</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Current balance</TableCell>
                        <TableCell>{credits} credits</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell>
                            <Button variant="contained" color="primary"
                                onClick={mintAsset}
                                disabled={disableMint}
                                style={{ marginRight: '10px' }} >
                                Mint
                            </Button>
                            {showAddCredits &&
                                <Button variant="contained" color="primary" onClick={addCredits}>
                                    Add Credits
                                </Button>
                            }
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetMint;
