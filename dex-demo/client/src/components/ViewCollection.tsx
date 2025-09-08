import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {  Box, Typography } from "@mui/material";

function ViewCollection() {
    const { did } = useParams();
    const navigate = useNavigate();
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

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, p: 3 }}>
            <Typography variant="h4">{collection.name} by {collection.profile.name}</Typography>
        </Box>
    )
}

export default ViewCollection;
