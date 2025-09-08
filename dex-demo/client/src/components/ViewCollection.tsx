import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Button, Typography } from "@mui/material";
import AssetGrid from "./AssetGrid.js";

function ViewCollection() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [collection, setCollection] = useState<any>(null);

    useEffect(() => {
        if (!did) {
            showSnackbar("No DID provided for collection.", "error");
            navigate('/');
            return;
        }

        const init = async () => {
            try {
                const getCollection = await api.get(`/collection/${did}`);
                const collection = getCollection.data.collection;

                setCollection(collection);
            }
            catch (error: any) {
                showSnackbar("Failed to load collection data", 'error');
                navigate('/');
            }
        };

        init();
    }, [did, navigate, showSnackbar]);

    if (!collection) {
        return <></>;
    }

    async function addAsset() {
        try {
            const input = window.prompt("Image DID:");

            if (input) {
                const asset = input.trim();
                await api.post(`/collection/${did}/add`, { asset });

                const getCollection = await api.get(`/collection/${did}`);
                const collection = getCollection.data.collection;

                setCollection(collection);
            }
        } catch (error) {
            showSnackbar('Failed to add asset', 'error');
        }
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, p: 3 }}>
            <Typography variant="h4">{collection.name} by {collection.profile.name}</Typography>
            {auth.userDID === collection.owner &&
                <Button variant="contained" color="primary" onClick={addAsset}>
                    Add...
                </Button>
            }
            <AssetGrid assets={collection.assets} />
        </Box>
    )
}

export default ViewCollection;
