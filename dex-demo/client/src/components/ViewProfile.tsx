import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Button, Tab, Tabs, Typography } from "@mui/material";
import CollectionGrid from "./CollectionGrid.js";
import AssetGrid from "./AssetGrid.js";

function ViewProfile() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState<any>(null);
    const [tab, setTab] = useState<string>("collections");

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

    async function addCollection() {
        try {
            const input = window.prompt("Collection name:");

            if (input) {
                const name = input.trim();
                await api.post(`/collection`, { name });

                const getProfile = await api.get(`/profile/${did}`);
                const profile = getProfile.data;

                setProfile(profile);
            }
        } catch (error) {
            showSnackbar('Failed to add collection', 'error');
        }
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                {profile.pfp?.cid && (
                    <a href={`/asset/${profile.pfp.did}`} >
                        <img
                            src={`/api/ipfs/${profile.pfp.cid}`}
                            alt="Profile pic"
                            style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                marginRight: '16px',
                                borderRadius: '50%',
                            }}
                        />
                    </a>
                )}
                <div>
                    <Typography variant="h4">{profile.name}</Typography>
                    <Typography variant="caption">{profile.tagline}</Typography>
                </div>
            </div>
            <Tabs
                value={tab}
                onChange={(_, newTab) => { setTab(newTab); }}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab key="collections" value="collections" label={'Collections'} />
                <Tab key="minted" value="minted" label={'Minted'} />
                <Tab key="collected" value="collected" label={'Collected'} />
                <Tab key="listed" value="listed" label={'Listed'} />
                <Tab key="unlisted" value="unlisted" label={'Unlisted'} />
                {profile.isUser && <Tab key="deleted" value="deleted" label={'Deleted'} />}
            </Tabs>
            {tab === 'collections' &&
                <Box sx={{ width: '100%', p: 3 }}>
                    {auth.userDID === did &&
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Button variant="contained" color="primary" onClick={addCollection}>
                                Add collection...
                            </Button>
                        </Box>
                    }
                    <CollectionGrid collections={profile.collections} />
                </Box>
            }
            {tab === 'collected' &&
                <Box sx={{ width: '100%', p: 3 }}>
                    <AssetGrid assets={profile.collected} />
                </Box>
            }
        </Box>
    )
}

export default ViewProfile;
