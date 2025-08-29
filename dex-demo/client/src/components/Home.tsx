import React from "react";
import { Box, Typography } from "@mui/material";
import { AxiosInstance } from "axios";
import { useAuth } from "../contexts/AuthContext";

function Home({ api }: { api: AxiosInstance }) {
    const auth = useAuth();

    if (auth.loading) {
        return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;
    }
    return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Welcome, {auth.isAuthenticated ? (auth.profile?.name || auth.userDID) : "to the DEX Demo"}</Typography>
            {!auth.isAuthenticated && (
                <Typography sx={{ mt: 2 }}>Please login to buy/sell DID assets.</Typography>
            )}
            <Box sx={{ mt: 4, textAlign: 'left', fontFamily: 'monospace', fontSize: '0.95rem', background: '#f5f5f5', p: 2, borderRadius: 2 }}>
                <strong>Auth Context:</strong>
                <pre>{JSON.stringify(auth, null, 2)}</pre>
            </Box>
        </Box>
    );
}

export default Home;
