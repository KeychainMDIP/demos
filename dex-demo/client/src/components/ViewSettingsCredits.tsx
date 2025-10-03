import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Button, Box, Table, TableBody, TableCell, TableRow, TextField } from "@mui/material";

function ViewSettingsCredits() {
    const { did } = useParams();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const api = useApi();

    const [profile, setProfile] = useState<any>(null);
    const [balance, setBalance] = useState<number>(0);
    const [credits, setCredits] = useState<number>(0);

    useEffect(() => {
        if (!did) {
            showSnackbar("No DID provided for profile.", "error");
            navigate('/');
            return;
        }

        const init = async () => {
            try {
                const getProfile = await api.get(`/profile/${did}`);
                const profile = getProfile.data;

                setProfile(profile);
                setBalance(profile.credits || 0);
            }
            catch (error: any) {
                showSnackbar("Failed to load profile data", 'error');
                navigate('/');
            }
        };

        init();
    }, [did, navigate, showSnackbar]);

    function changeCredits(value: string) {
        let credits = parseInt(value, 10);

        if (isNaN(credits)) {
            credits = 0;
        }

        // Clamp credits between 0 and 20000
        if (credits < 0) {
            credits = 0;
        } else if (credits > 20000) {
            credits = 20000;
        }

        setCredits(credits);
    }

    async function addCredits() {
        try {
            const getCredits = await api.post(`/add-credits`, { amount: credits });
            const { balance } = getCredits.data;
            setBalance(balance);
            setCredits(0);
            showSnackbar(`Successfully added ${credits} credits`, 'success');
        } catch (error) {
            showSnackbar("Failed to add credits", 'error');
        }
    }

    if (!profile) {
        return <></>;
    }

    const labelSx = { fontWeight: 'bold', width: 60 }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Table sx={{ width: '100%' }}>
                <TableBody>
                    <TableRow>
                        <TableCell sx={labelSx}>Balance:</TableCell>
                        <TableCell>{balance} credits</TableCell>
                    </TableRow>
                    {profile.isUser && (
                        <TableRow>
                            <TableCell sx={labelSx}>Purchase:</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <TextField
                                        type="number"
                                        value={credits}
                                        onChange={(e) => changeCredits(e.target.value)}
                                        margin="normal"
                                        inputProps={{
                                            min: 0,
                                            max: 20000,
                                        }}
                                        sx={{ width: '20ch' }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={addCredits}
                                        disabled={credits === 0}
                                    >
                                        Add Credits
                                    </Button>
                                </Box>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Box>
    )
}

export default ViewSettingsCredits;
