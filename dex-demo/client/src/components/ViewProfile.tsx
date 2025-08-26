import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { differenceInDays, format } from "date-fns";
import { Box, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { AxiosInstance } from "axios";

function ViewProfile({ api }: { api: AxiosInstance }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const { showSnackbar } = useSnackbar();

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

    function formatDate(time: string) {
        const date = new Date(time);
        const now = new Date();
        const days = differenceInDays(now, date);

        return `${format(date, 'yyyy-MM-dd HH:mm:ss')} (${days} days ago)`;
    }

    if (!profile) {
        return <></>;
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, p: 3 }}>
            <Table sx={{ width: '100%' }}>
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 120 }}>DID:</TableCell>
                        <TableCell sx={{ wordBreak: 'break-all', width: 'calc(100% - 120px)' }}>
                            <span style={{ fontFamily: 'Courier, monospace', fontSize: '0.9rem', whiteSpace: 'nowrap', display: 'block' }}>{profile.did}</span>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 120 }}>First login:</TableCell>
                        <TableCell>{formatDate(profile.firstLogin)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Last login:</TableCell>
                        <TableCell>{formatDate(profile.lastLogin)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Login count:</TableCell>
                        <TableCell sx={{ color: '#555' }}>{profile.logins}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    )
}

export default ViewProfile;
