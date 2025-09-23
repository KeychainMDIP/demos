import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {
    Button,
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";

function ViewAssetToken({ asset, onUnmint }: { asset: any, onUnmint: () => void }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    const [licenseLink, setLicenseLink] = useState<string>("");
    const [showUnmint, setShowUnmint] = useState<boolean>(false);

    useEffect(() => {
        const init = async () => {
            try {
                const getLicenses = await api.get(`/licenses`);
                const licenses = getLicenses.data;
                const license = asset.minted?.license;

                if (licenses[license]) {
                    setLicenseLink(licenses[license] || "");
                }

                if (!asset.matrix || !asset.minted) {
                    navigate('/');
                    return;
                }

                if (auth.isAuthenticated && auth.userDID === asset.matrix.owner) {
                    setShowUnmint(true);
                }
            } catch (error: any) {
                showSnackbar("Failed to load license data", 'error');
                navigate('/');
            }
        };

        init();
    }, [asset]);

    async function unmintAsset() {
        try {
            await api.post(`/asset/${did}/unmint`);
            onUnmint();
        } catch (error) {
            showSnackbar("Failed to unmint asset", 'error');
        }
    }

    if (!asset.minted) {
        return <></>;
    }

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>License</TableCell>
                        <TableCell><a href={licenseLink} target="_blank" rel="noopener noreferrer">{asset.minted.license}</a></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Royalty</TableCell>
                        <TableCell>{asset.minted.royalty}%</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Editions</TableCell>
                        <TableCell>{asset.minted.editions}</TableCell>
                    </TableRow>
                    {asset.minted.editions > 0 &&
                        <TableRow>
                            <TableCell colSpan={2}>
                                <TableContainer component={Paper} style={{ maxHeight: '300px', overflow: 'auto' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Edition</TableCell>
                                                <TableCell>Owner</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {asset.minted.tokens.map((token: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <a href={`/asset/${token.did}`}>{index + 1} of {asset.minted.editions}</a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.0em', marginLeft: '0.5em', marginRight: '0.5em' }}>
                                                            {token.owner.pfp.cid &&
                                                                <img
                                                                    src={`/api/ipfs/${token.owner.pfp.cid}`}
                                                                    alt=""
                                                                    style={{
                                                                        width: '30px',
                                                                        height: '30px',
                                                                        objectFit: 'cover',
                                                                        marginRight: '10px',
                                                                        borderRadius: '50%',
                                                                    }}
                                                                />
                                                            } <a href={`/profile/${token.owner.did}`} >{token.owner.name}</a>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </TableCell>
                        </TableRow>
                    }
                    {showUnmint &&
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>
                                <Button variant="contained" color="primary"
                                    onClick={unmintAsset}
                                    style={{ marginRight: '10px' }} >
                                    Unmint
                                </Button>
                            </TableCell>
                        </TableRow>
                    }
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetToken;
