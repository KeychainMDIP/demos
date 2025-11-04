import React, { useEffect, useState } from "react";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Button, Box, Table, TableBody, TableCell, TableRow, TextField } from "@mui/material";

function ViewSettingsCredits({ profile, onSave }: { profile: any; onSave: () => void }) {
    const { showSnackbar } = useSnackbar();
    const api = useApi();

    const [balance, setBalance] = useState<number>(0);
    const [credits, setCredits] = useState<number>(0);

    useEffect(() => {
        setBalance(profile.credits || 0);
    }, [profile]);

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
            await api.post(`/add-credits`, { amount: credits });
            
            setCredits(0);
            showSnackbar(`Successfully added ${credits} credits`, 'success');
            onSave();
        } catch (error) {
            showSnackbar("Failed to add credits", 'error');
        }
    }

    if (!profile) {
        return <></>;
    }

    const labelSx = { fontWeight: 'bold', width: 60 };

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
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setCredits(1000)}
                                        >
                                            1K
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setCredits(5000)}
                                        >
                                            5K
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setCredits(10000)}
                                        >
                                            10K
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setCredits(20000)}
                                        >
                                            20K
                                        </Button>
                                    </Box>
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
