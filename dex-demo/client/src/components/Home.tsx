import React, { useEffect, useState } from "react";
import { AuthState } from "../types.js";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { Box, Typography } from "@mui/material";
import { AxiosInstance } from "axios";

function Home({ api }: { api: AxiosInstance }) {
    const [authData, setAuthData] = useState<AuthState | null>(null);
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        const determineInitialView = async () => {
            try {
                const authResponse = await api.get<AuthState>('/check-auth');
                const currentAuth = authResponse.data;
                setAuthData(currentAuth);

                if (currentAuth && currentAuth.isAuthenticated) {
                }
            } catch (error: any) {
                showSnackbar('Error determining initial view', 'error');
                setAuthData({ isAuthenticated: false, userDID: '', isOwner: false, isAdmin: false, isModerator: false, isMember: false });
            }
        };

        determineInitialView();
    }, [navigate, showSnackbar]);

    if (authData) {
        if (authData.isAuthenticated) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6">Welcome, {authData.profile?.name || authData.userDID}</Typography>
                </Box>
            );
        } else {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6">Welcome to the DEX Demo</Typography>
                    <Typography sx={{ mt: 2 }}>Please login to buy/sell DID assets.</Typography>
                </Box>
            );
        }
    }

    return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>Could not load application state. Please try refreshing.</Typography></Box>;
}

export default Home;
