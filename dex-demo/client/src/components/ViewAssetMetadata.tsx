import React from "react";
import {
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableRow,
} from "@mui/material";
import { formatDate } from "../utils.js";
import UserBadge from "./UserBadge.js";

function ViewAssetMetadata({ asset }: { asset: any }) {
    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Creator</TableCell>
                        {asset.creator ? (
                            <TableCell><UserBadge user={asset.creator} /></TableCell>
                        ) : (
                            <TableCell>no creator</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Owner</TableCell>
                        {asset.owner ? (
                            <TableCell><UserBadge user={asset.owner} /></TableCell>
                        ) : (
                            <TableCell>no owner</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Created</TableCell>
                        <TableCell>{formatDate(asset.created)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Updated</TableCell>
                        <TableCell>{formatDate(asset.updated)}</TableCell>
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

export default ViewAssetMetadata;
