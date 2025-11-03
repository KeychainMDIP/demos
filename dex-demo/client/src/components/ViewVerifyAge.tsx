import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { Box, Button, TextField, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

function ViewVerifyAge() {
    const api = useApi();
    const auth = useAuth();

    const [challengeDID, setChallengeDID] = useState<string>('');
    const [responseDID, setResponseDID] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);
    const [challengeURL, setChallengeURL] = useState<string | null>(null);
    const [extensionURL, setExtensionURL] = useState<string>('');

    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const intervalIdRef = useRef<number | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                intervalIdRef.current = window.setInterval(async () => {
                    auth.refreshAuth();
                }, 1000); // Check every second

                const response = await api.get(`/challenge/verify-age`);
                const { challenge, challengeURL } = response.data;
                setChallengeDID(challenge);
                setExtensionURL(`mdip://auth?challenge=${challenge}`);
                setChallengeURL(encodeURI(challengeURL));
            }
            catch (error: any) {
                showSnackbar('Failed to get challenge', 'error');
            }
        };

        init();

        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        }
    }, [navigate, showSnackbar]);

    useEffect(() => {
        if (auth.profile?.birthDate) {
            // This effect runs whenever auth.isAuthenticated changes
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
            navigate(`/settings/${auth.userDID}`);
        }
    }, [auth.profile?.birthDate, navigate]);

    async function verifyAge() {
        setVerifying(true);

        try {
            await api.post(`/verify-age`, { challenge: challengeDID, response: responseDID });
        }
        catch (error: any) {
            showSnackbar('Verify age request failed', 'error');
        }

        setVerifying(false);
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            showSnackbar('Challenge DID copied to clipboard', 'success');
        } catch (error: any) {
            showSnackbar("Failed to copy text", 'error');
        }
    }

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '800px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                p: 2,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                }}
            >
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 'bold',
                        pt: challengeURL ? '4px' : '8px',
                    }}
                >
                    Challenge:
                </Typography>

                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {challengeURL && (
                        <a href={challengeURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-block' }}>
                            <QRCodeSVG value={challengeURL} />
                        </a>
                    )}
                    <Typography
                        component="a"
                        href={extensionURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            fontFamily: 'Courier, monospace',
                            wordBreak: 'break-all',
                            textDecoration: 'underline',
                            color: 'primary.main',
                            '&:hover': {
                                textDecoration: 'none',
                            }
                        }}
                    >
                        {challengeDID}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => copyToClipboard(challengeDID)}
                    sx={{ whiteSpace: 'nowrap', height: 'fit-content', alignSelf: 'center' }}
                >
                    Copy
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 'bold',
                    }}
                >
                    Response:
                </Typography>

                <Box sx={{ flexGrow: 1 }}>
                    <TextField
                        label="Response DID"
                        value={responseDID}
                        onChange={(e) => setResponseDID(e.target.value)}
                        fullWidth
                        variant="outlined"
                        slotProps={{
                            htmlInput: {
                                maxLength: 80,
                            },
                        }}
                    />
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={verifyAge}
                    disabled={!responseDID || verifying}
                    sx={{ whiteSpace: 'nowrap' }}
                >
                    {verifying ? 'Verifying...' : 'Verify Age'}
                </Button>
            </Box>
        </Box>
    );
}

export default ViewVerifyAge;
