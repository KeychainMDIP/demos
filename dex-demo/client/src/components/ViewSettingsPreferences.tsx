import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { formatDate } from "../utils.js";
import { Box, Table, TableBody, TableCell, TableRow } from "@mui/material";

function ViewSettingsPreferences({ profile, onSave }: { profile: any; onSave: () => void }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { showSnackbar } = useSnackbar();


    useEffect(() => {

        const init = async () => {
        };

        init();
    }, [profile]);

    if (!profile) {
        return <></>;
    }

    const labelSx = { fontWeight: 'bold', width: 100 }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Table sx={{ width: '100%' }}>
                <TableBody>
                    <TableRow>
                        <TableCell sx={labelSx}>DID:</TableCell>
                        <TableCell sx={{ wordBreak: 'break-all', width: 'calc(100% - 120px)' }}>
                            <span style={{ fontFamily: 'Courier, monospace', fontSize: '0.9rem', whiteSpace: 'nowrap', display: 'block' }}>{profile.did}</span>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={labelSx}>First login:</TableCell>
                        <TableCell>{formatDate(profile.firstLogin)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={labelSx}>Last login:</TableCell>
                        <TableCell>{formatDate(profile.lastLogin)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={labelSx}>Login count:</TableCell>
                        <TableCell>{profile.logins}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    )
}

export default ViewSettingsPreferences;
