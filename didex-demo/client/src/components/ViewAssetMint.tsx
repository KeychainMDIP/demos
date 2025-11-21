import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../contexts/ApiContext.js";
import { useSnackbar } from "../contexts/SnackbarContext.js";
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
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar, showSnackbarError } = useSnackbar();

    const [editions, setEditions] = useState<number>(1);
    const [editionRate, setEditionRate] = useState<number>(0);
    const [mintingFee, setMintingFee] = useState<number>(0);
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
                const credits = auth.profile?.credits || 0;
                const editionFee = editions * editionRate;

                setLicenses(licenseList);
                setLicense(licenseList[0]);
                setCredits(credits);
                setEditionRate(editionRate);
                setEditions(editions);
                setMintingFee(editionFee);
                setDisableMint(editionFee > credits);
                setShowAddCredits(editionFee > credits);
            } catch (error) {
                showSnackbar("Failed to fetch licenses", 'error');
            }
        };

        init();
    }, [asset]);

    function changeEditions(value: string) {
        let editions = parseInt(value, 10);

        if (isNaN(editions)) {
            editions = 1;
        }

        // Clamp editions between 1 and 100
        if (editions < 1) {
            editions = 1;
        } else if (editions > 100) {
            editions = 100;
        }

        const mintingFee = editions * editionRate;

        setEditions(editions);
        setMintingFee(mintingFee);
        setDisableMint(mintingFee > credits);
        setShowAddCredits(mintingFee > credits);
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
            setDisableMint(mintingFee > balance);
            setShowAddCredits(mintingFee > balance);
        } catch (error) {
            showSnackbar("Failed to add credits", 'error');
        }
    }

    async function mintAsset() {
        setDisableMint(true);

        try {
            const getMint = await api.post(`/asset/${did}/mint`, { editions, royalty, license });
            const { message } = getMint.data;
            showSnackbar(message, 'success');
            onMint();
        } catch (error) {
            showSnackbarError(error, "Failed to mint asset");
        }
    }

    return (
        <TableContainer>
            <Table>
                <TableBody>
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
                        <TableCell>Editions (1-100)</TableCell>
                        <TableCell>
                            <TextField
                                type="number"
                                value={editions}
                                onChange={(e) => changeEditions(e.target.value)}
                                margin="normal"
                                inputProps={{
                                    min: 1,
                                    max: 100,
                                }}
                                sx={{ width: '20ch' }}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Minting fee</TableCell>
                        <TableCell>{mintingFee} credits for {editions} editions</TableCell>
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
