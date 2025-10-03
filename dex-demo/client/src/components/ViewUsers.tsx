import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import UserBadge from "./UserBadge.js";

function ViewUsers() {
    type User = {
        name?: string;
        role?: string;
        logins?: number;
        firstLogin?: string;
        lastLogin?: string;
    };

    const navigate = useNavigate();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [users, setUsers] = useState<Record<string, User> | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const getUsers = await api.get(`/users`);
                setUsers(getUsers.data.users);
            }
            catch (error: any) {
                showSnackbar("Failed to load users data", 'error');
                navigate('/');
            }
        };

        init();
    }, [navigate, showSnackbar]);

    if (!users) {
        return <></>;
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Table sx={{ width: '100%' }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Logins</TableCell>
                        <TableCell>Last Login</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(users).map(([did, user]) => (
                        <TableRow key={did}>
                            <TableCell>
                                <UserBadge did={did} />
                            </TableCell>
                            <TableCell>
                                <a href={`/settings/${did}`} style={{ textDecoration: 'none', color: '#1976d2' }}>{user.role}</a>
                            </TableCell>
                            <TableCell>{user.logins}</TableCell>
                            <TableCell>{user.lastLogin}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    )
}

export default ViewUsers;
