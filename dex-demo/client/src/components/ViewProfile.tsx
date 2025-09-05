import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {  Box, Tab, Tabs, Typography } from "@mui/material";

function ViewProfile() {
    const { did } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState<any>(null);
    const [tab, setTab] = useState<string>("created");

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
            }
            catch (error: any) {
                showSnackbar("Failed to load profile data", 'error');
                navigate('/');
            }
        };

        init();
    }, [did, navigate, showSnackbar]);

    if (!profile) {
        return <></>;
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, p: 3 }}>
            <Typography variant="h4">{profile.name}</Typography>
            <Typography variant="h5" gutterBottom>{profile.tagline}</Typography>
            <Tabs
                value={tab}
                onChange={(_, newTab) => { setTab(newTab); }}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab key="created" value="created" label={'Created'} />
                <Tab key="minted" value="minted" label={'Minted'} />
                <Tab key="collected" value="collected" label={'Collected'} />
                <Tab key="listed" value="listed" label={'Listed'} />
                <Tab key="unlisted" value="unlisted" label={'Unlisted'} />
                {profile.isUser && <Tab key="deleted" value="deleted" label={'Deleted'} />}
            </Tabs>
        </Box>
    )
}

export default ViewProfile;
