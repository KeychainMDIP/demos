import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../contexts/ApiContext.js";
import CollectionGrid from "./CollectionGrid.js";
import ProfileGrid from "./ProfileGrid.js";

function Home() {
    const auth = useAuth();
    const { showSnackbar } = useSnackbar();
    const api = useApi();
    const [showcase, setShowcase] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const getShowcase = await api.get(`/showcase`);
                const { showcase } = getShowcase.data;

                setShowcase(showcase);
            }
            catch (error: any) {
                showSnackbar("Failed to load showcase data", 'error');
            }
        };

        init();
    }, [showSnackbar]);

    if (auth.loading) {
        return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;
    }
    return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4">Welcome, {auth.isAuthenticated ? (auth.profile?.name || auth.userDID) : "to the DID Exchange Demo"}</Typography>
            {!auth.isAuthenticated && (
                <Typography sx={{ mt: 2 }}>Login to upload image assets and mint limited editions (tokens) that can be collected and traded.</Typography>
            )}
            {showcase?.collections && showcase.collections.length > 0 &&
                <>
                    <Typography variant="h5">Featured Collections</Typography>
                    <CollectionGrid collections={showcase.collections} />
                </>
            }
            {showcase?.creators && showcase.creators.length > 0 &&
                <>
                    <Typography variant="h5">Featured Creators</Typography>
                    <ProfileGrid profiles={showcase.creators} />
                </>
            }
        </Box>
    );
}

export default Home;
