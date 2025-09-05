import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import ViewSettingsLogin from "./ViewSettingsLogin.js";
import ViewSettingsName from "./ViewSettingsName.js";

function ViewSettings() {
    const { did } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState<any>(null);
    const [tab, setTab] = useState<string>("logins");

    useEffect(() => {
        if (!did) {
            showSnackbar("No DID provided for settings.", "error");
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
            <Typography variant="h4" gutterBottom>{profile.name}</Typography>
            <Tabs
                value={tab}
                onChange={(_, newTab) => { setTab(newTab); }}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab key="logins" value="logins" label={'Logins'} />
                <Tab key="name" value="name" label={'Name'} />
                <Tab key="collections" value="collections" label={'Collections'} />
                <Tab key="links" value="links" label={'Links'} />
                <Tab key="lightning" value="lightning" label={'Lightning'} />
            </Tabs>
            {tab === "logins" && <ViewSettingsLogin />}
            {tab === "name" && <ViewSettingsName />}
            {tab === "collections" && <div>Collections settings coming soon...</div>}
            {tab === "links" && <div>Links settings coming soon...</div>}
            {tab === "lightning" && <div>Lightning settings coming soon...</div>}
        </Box>
    )
}

export default ViewSettings;
