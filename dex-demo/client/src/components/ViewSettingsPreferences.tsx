import React, { useEffect, useState } from "react";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { useNavigate } from "react-router-dom";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";

function ViewSettingsPreferences({ profile, onSave }: { profile: any; onSave: () => void }) {
    const api = useApi();
    const navigate = useNavigate();
    const { showSnackbar, showSnackbarError } = useSnackbar();

    const [maxContentRating, setMaxContentRating] = useState<string>("");
    const [contentRatings, setContentRatings] = useState<string[]>([]);
    const [contentRating, setContentRating] = useState<string>("");
    const [verifiedAge, setVerifiedAge] = useState<number>(0);

    async function fetchContentRatings() {
        try {
            const getRatings = await api.get('/content-ratings');
            const ratings = getRatings.data;
            const defaultRating = ratings[0]?.label;
            const rating = profile.maxContentRating || defaultRating;

            setContentRatings(ratings);
            setMaxContentRating(rating);
            setContentRating(rating);
        } catch (error: any) {
            showSnackbarError(error, 'Failed to load content ratings');
        }
    }

    useEffect(() => {
        fetchContentRatings();

        if (profile.birthDate) {
            const birthDate = new Date(profile.birthDate);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs); // miliseconds from epoch
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            setVerifiedAge(age);
        }
    }, [profile]);

    if (!profile) {
        return <></>;
    }

    async function saveContentRating() {
        try {
            await api.patch(`/profile/${profile.did}`, { maxContentRating: contentRating });
            showSnackbar(`Content rating preference (${contentRating}) saved`, 'success');
            onSave();
        } catch (error: any) {
            showSnackbarError(error, 'Failed to save content rating preference');
        }
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography>Select maximum content rating:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Select
                    value={contentRating}
                    onChange={e => setContentRating(e.target.value)}
                    sx={{ width: 400 }}
                >
                    {contentRatings.map((rating: any) => (
                        <MenuItem key={rating.label} value={rating.label}>
                            {`${rating.name} (${rating.label}) - ${rating.description}`}
                        </MenuItem>
                    ))}
                </Select>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={contentRating === maxContentRating}
                    onClick={saveContentRating}
                >
                    Save
                </Button>
            </Box>
            <Box sx={{ mt: 4 }}>
                <Typography>Age verification status:</Typography>
                {verifiedAge ? (
                    <Typography sx={{ mt: 1 }}>Verified (birth date: {profile.birthDate}, age: {verifiedAge})</Typography>
                ) : (
                    <>
                        <Typography sx={{ mt: 1 }}>Not Verified</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate("/verify-age")}
                        >
                            Verify Age
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    )
}

export default ViewSettingsPreferences;
