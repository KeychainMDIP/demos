import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from 'react-dropzone';
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Button, Modal, Typography } from "@mui/material";
import AssetGrid from "./AssetGrid.js";
import UserBadge from "./UserBadge.js";

function ViewCollection() {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar, showSnackbarError } = useSnackbar();

    const [collection, setCollection] = useState<any>(null);
    const [credits, setCredits] = useState<number>(0);
    const [budget, setBudget] = useState<number>(0);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [uploadResults, setUploadResults] = useState<any>(null);
    const [uploadWarnings, setUploadWarnings] = useState<any>(null);

    async function fetchCollection() {
        if (!did) {
            showSnackbar("No DID provided for collection.", "error");
            navigate('/');
            return;
        }

        try {
            const getCollection = await api.get(`/collection/${did}`);
            const collection = getCollection.data.collection;

            setCollection(collection);

            const getRates = await api.get(`/rates`);
            const rates = getRates.data;

            // Fetch fresh auth data to get current credits
            const authResponse = await api.get(`/check-auth`);
            const profile = authResponse.data.profile;

            const credits = profile?.credits || 0;
            const budget = credits * rates.storageRate;

            setCredits(credits);
            setBudget(budget);
        }
        catch (error: any) {
            showSnackbar("Failed to load collection data", 'error');
            navigate('/');
        }
    }

    useEffect(() => {
        fetchCollection();
    }, [did]);

    if (!collection) {
        return <></>;
    }

    async function addAsset() {
        try {
            const input = window.prompt("Image DID:");

            if (input) {
                const asset = input.trim();
                await api.post(`/collection/${did}/add`, { asset });
                await fetchCollection();
            }
        } catch (error: any) {
            showSnackbarError(error, 'Failed to add asset');
        }
    }

    async function renameCollection() {
        try {
            const input = window.prompt("New collection name:", collection.name);

            if (input) {
                const name = input.trim();
                await api.patch(`/collection/${did}`, { name });
                fetchCollection();
            }
        } catch (error: any) {
            showSnackbarError(error, 'Failed to rename collection');
        }
    }

    async function renameAssets() {
        try {
            const input = window.prompt("New asset name:");

            if (input) {
                const baseName = input.trim();

                for (let i = 0; i < collection.assets.length; i++) {
                    const asset = collection.assets[i];
                    const title = `${baseName} #${i + 1}`;
                    await api.patch(`/asset/${asset.did}`, { title });
                }

                fetchCollection();
            }
        } catch (error: any) {
            showSnackbarError(error, 'Failed to rename assets');
        }
    }

    async function sortAssets() {
        try {
            const input = window.prompt("Sort assets by (title/created):", "title");

            if (input) {
                const sortBy = input.trim().toLowerCase();
                if (sortBy !== 'title' && sortBy !== 'created') {
                    showSnackbar('Invalid sort option. Please enter "title" or "created".', 'error');
                    return;
                }

                await api.post(`/collection/${did}/sort`, { sortBy });
                await fetchCollection();
            }
        } catch (error: any) {
            showSnackbarError(error, 'Failed to sort assets');
        }
    }

    async function removeCollection() {
        try {
            const confirmed = window.confirm(`Are you sure you want to remove the collection "${collection.name}"?`);
            if (confirmed) {
                await api.delete(`/collection/${did}`);
                navigate(`/profile/${auth.userDID}`);
            }
        } catch (error: any) {
            showSnackbarError(error, 'Failed to remove collection');
        }
    }

    async function uploadAssets() {
        if (credits === 0) {
            showSnackbar('You have no credits to upload images. Please add credits first.', 'error');
            return;
        }

        setUploadResults(null);
        setUploadWarnings(null);
        setModalOpen(true);
    };

    function handleModalClose() {
        setModalOpen(false);
    };

    async function uploadFiles(formData: FormData) {
        try {
            const response = await api.post(`/collection/${did}/upload`, formData);
            const data = response.data;
            let uploadResults = ''
            let uploadWarnings = '';

            if (data.filesUploaded) {
                const mb = data.bytesUploaded / 1000000;
                uploadResults = `You were debited ${data.creditsDebited} credits to upload ${data.filesUploaded} files (${mb.toFixed(2)} MB)`;
                fetchCollection();
                showSnackbar(`Successfully uploaded ${data.filesUploaded} files`, 'success');
            }

            if (data.filesSkipped) {
                if (data.filesSkipped === 1) {
                    uploadWarnings = `1 file was skipped due to insufficient credits. `;
                }
                else {
                    uploadWarnings = `${data.filesSkipped} files were skipped due to insufficient credits. `;
                }
            }

            if (data.filesErrored) {
                if (data.filesErrored === 1) {
                    uploadWarnings += `1 file was skipped due to error reading image.`;
                }
                else {
                    uploadWarnings += `${data.filesErrored} files were skipped due to error reading image.`;
                }
            }

            setUploadResults(uploadResults);
            setUploadWarnings(uploadWarnings);
        } catch (error) {
            setUploadResults('Error uploading images');
            setUploadWarnings('');
        }
    };

    async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files) return;

        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file) {
                formData.append('images', file);
            }
        }

        await uploadFiles(formData);
    };

    async function handlePaste(event: ClipboardEvent) {
        const items = event.clipboardData?.items;
        if (!items) return;

        const formData = new FormData();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item && item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    formData.append('images', file);
                }
            }
        }

        await uploadFiles(formData);
    };

    async function handleDrop(files: File[]) {
        const formData = new FormData();

        for (const file of files) {
            formData.append('images', file);
        }

        await uploadFiles(formData);
    };

    function FileUploadByPaste() {
        useEffect(() => {
            window.addEventListener('paste', handlePaste);

            // Clean up the event listener when the component unmounts
            return () => {
                window.removeEventListener('paste', handlePaste);
            }
        }, [handlePaste]);

        return (
            <div></div>
        );
    };

    function FileUploadDropzone() {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop: handleDrop,
            accept: {
                'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
            },
            multiple: true,
        });

        return (
            <div {...getRootProps()} className={`${isDragActive ? 'dropzone active' : 'dropzone'}`}>
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p>Drop the images here ...</p> :
                        <div>
                            <p>Copy/Paste or Drag 'n' Drop some images here, or click to select files</p>
                            <p>{uploadResults}</p>
                            <p>{uploadWarnings}</p>
                        </div>
                }
            </div>
        );
    };

    return (
        <>
            <Box sx={{ width: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '2.0em' }}>{collection.name} by</Typography>
                    <UserBadge did={collection.owner.did} fontSize={'2.0em'} imgSize={'50px'} />
                </Box>
                {auth.userDID === collection.owner.did &&
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Button variant="contained" color="primary" onClick={addAsset}>
                            Add asset...
                        </Button>
                        <Button variant="contained" color="primary" onClick={uploadAssets}>
                            Upload images...
                        </Button>
                        <Button variant="contained" color="primary" onClick={renameCollection}>
                            Rename collection...
                        </Button>
                        <Button variant="contained" color="primary" onClick={renameAssets}>
                            Rename assets...
                        </Button>
                        <Button variant="contained" color="primary" onClick={sortAssets}>
                            Sort assets...
                        </Button>
                        <Button variant="contained" color="primary" onClick={removeCollection}>
                            Remove collection...
                        </Button>
                    </Box>
                }
                <AssetGrid assets={collection.assets} />
            </Box>
            <Modal
                open={modalOpen}
                onClose={() => handleModalClose()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1em',
                    width: '400px',
                    height: '400px',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FileUploadByPaste />
                    <FileUploadDropzone />
                    <p style={{ fontSize: '14px' }}>You have {credits} credits, enough to upload {budget.toFixed(2)} MB.</p>

                    <input
                        id="file-upload"
                        type="file"
                        name="images"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                    />

                    <Box>
                        <label htmlFor="file-upload" className="custom-file-upload">
                            <Button variant="contained" color="primary" component="span">
                                Select Images
                            </Button>
                        </label>
                        <Button variant="contained" color="primary" onClick={handleModalClose}>
                            Close
                        </Button>
                    </Box>
                </div>
            </Modal>
        </>
    )
}

export default ViewCollection;
