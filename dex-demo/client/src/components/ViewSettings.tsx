import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import ViewSettingsLogin from "./ViewSettingsLogin.js";
import ViewSettingsName from "./ViewSettingsName.js";
import ViewSettingsCredits from "./ViewSettingsCredits.js";
import ViewSettingsTransactions from "./ViewSettingsTransactions.js";

function ViewSettings() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState<any>(null);
    const [tab, setTab] = useState<string>("logins");

    const fetchProfile = useCallback(async () => {
        if (!did) {
            showSnackbar("No DID provided for settings.", "error");
            navigate('/');
            return;
        }

        try {
            const getProfile = await api.get(`/profile/${did}`);
            const profile = getProfile.data;

            if (!profile?.adminAccess) {
                showSnackbar("No access to this profile", "error");
                navigate('/');
            }

            setProfile(profile);
        }
        catch (error: any) {
            showSnackbar("Failed to load profile data", 'error');
            navigate('/');
        }
    }, [api, did, navigate, showSnackbar]);

    async function refreshProfile() {
        await fetchProfile();
        auth.refreshAuth();
    }

    useEffect(() => {
        fetchProfile();
    }, [did]);

    if (!profile) {
        return <></>;
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>{profile.name} Account Settings</Typography>
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
                <Tab key="credits" value="credits" label={'Credits'} />
                <Tab key="transactions" value="transactions" label={'Transactions'} />
            </Tabs>
            {tab === "logins" && <ViewSettingsLogin />}
            {tab === "name" && <ViewSettingsName onSave={refreshProfile} />}
            {tab === "collections" && <div>Collections settings coming soon...</div>}
            {tab === "links" && <div>Links settings coming soon...</div>}
            {tab === "credits" && <ViewSettingsCredits onSave={refreshProfile} />}
            {tab === "transactions" && <ViewSettingsTransactions profile={profile} />}
        </Box>
    )
}

export default ViewSettings;
