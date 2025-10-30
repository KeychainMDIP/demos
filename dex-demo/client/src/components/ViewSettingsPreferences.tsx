import React, { useEffect, useState } from "react";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";

function ViewSettingsPreferences({ profile, onSave }: { profile: any; onSave: () => void }) {
    const api = useApi();
    const { showSnackbar, showSnackbarError } = useSnackbar();

    const [maxContentRating, setMaxContentRating] = useState<string>("");
    const [contentRatings, setContentRatings] = useState<string[]>([]);
    const [contentRating, setContentRating] = useState<string>("");

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
        </Box>
    )
}

export default ViewSettingsPreferences;
