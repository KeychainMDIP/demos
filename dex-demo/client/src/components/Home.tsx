import React from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

function Home() {
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
        </Box>
    );
}

export default Home;
