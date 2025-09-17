import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";
import {
    Box,
    Button,
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableRow,
    TextField,
} from "@mui/material";

function ViewAssetMint({ asset, onSave }: { asset: any, onSave: () => void }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        const init = async () => {
        };

        init();
    }, [asset]);

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>{asset.title || 'no title'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Collection</TableCell>
                        {asset.collection?.name ? (
                            <TableCell>
                                <a href={`/collection/${asset.collection.did}`}>{asset.collection.name}</a>
                            </TableCell>
                        ) : (
                            <TableCell>no collection</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Creator</TableCell>
                        {asset.owner?.did && asset.owner?.name ? (
                            <TableCell><a href={`/profile/${asset.owner.did}`}>{asset.owner.name}</a></TableCell>
                        ) : (
                            <TableCell>no creator</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>File size</TableCell>
                        <TableCell>{asset.image.bytes} bytes</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Image size</TableCell>
                        <TableCell>{asset.image.width} x {asset.image.height} pixels</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Image type</TableCell>
                        <TableCell>{asset.image.type}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetMint;
