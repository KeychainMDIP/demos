import React from "react";
import { useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Button } from "@mui/material";

function ViewAssetPfp({ asset, isAssetOwner, isCollectionOwner, onSave }: { asset: any, isAssetOwner: boolean, isCollectionOwner: boolean, onSave: () => void }) {
    const { did } = useParams();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    async function setProfilePic() {
        try {
            await api.patch(`/profile/${auth.userDID}`, { pfp: did });
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set pfp", 'error');
        }
    }

    async function setDefaultPfp() {
        try {
            await api.patch(`/settings`, { pfp: did });
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set default pfp", 'error');
        }
    }

    async function setCollectionThumbnail() {
        try {
            await api.patch(`/collection/${asset.collection.did}`, { thumbnail: did });
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set collection thumbnail", 'error');
        }
    }

    async function setDefaultThumbnail() {
        try {
            await api.patch(`/settings`, { thumbnail: did });
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set default thumbnail", 'error');
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <img
                src={`/api/ipfs/${asset.image.cid}`}
                alt={asset.name}
                style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                }}
            />
            {isAssetOwner &&
                <Button variant="contained" color="primary" onClick={setProfilePic}>
                    Set Profile Pic
                </Button>
            }
            {isCollectionOwner &&
                <Button variant="contained" color="primary" onClick={setCollectionThumbnail}>
                    Set Collection Thumbnail
                </Button>
            }
            {auth.isAdmin &&
                <>
                    <Button variant="contained" color="primary" onClick={setDefaultPfp}>
                        Set Default Pfp
                    </Button>
                    <Button variant="contained" color="primary" onClick={setDefaultThumbnail}>
                        Set Default Thumbnail
                    </Button>
                </>
            }
        </div>
    );
}

export default ViewAssetPfp;
