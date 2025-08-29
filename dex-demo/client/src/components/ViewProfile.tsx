import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext";
import { differenceInDays, format } from "date-fns";
import { Button, Box, Select, MenuItem, Table, TableBody, TableCell, TableRow, TextField } from "@mui/material";
import { AxiosInstance } from "axios";

function ViewProfile({ api }: { api: AxiosInstance }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const auth = useAuth(); // <-- get auth state from context
    const [profile, setProfile] = useState<any>(null);
    const [currentName, setCurrentName] = useState<string>("");
    const [newName, setNewName] = useState<string>("");
    const [roleList, setRoleList] = useState<string[]>([]);
    const [currentRole, setCurrentRole] = useState<string>("");
    const [newRole, setNewRole] = useState<string>("");
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

                if (profile.name) {
                    setCurrentName(profile.name);
                    setNewName(profile.name);
                }

                if (profile.role) {
                    setCurrentRole(profile.role);
                    setNewRole(profile.role);
                }

                setRoleList(['Admin', 'Moderator', 'Member']);
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

    async function saveName() {
        try {
            const name = newName.trim();
            await api.put(`/profile/${profile.did}/name`, { name });
            setNewName(name);
            setCurrentName(name);
            profile.name = name;
        }
        catch (error: any) {
            showSnackbar("Failed to set profile name", 'error');
        }
    }

    async function saveRole() {
        try {
            const role = newRole;
            await api.put(`/profile/${profile.did}/role`, { role });
            setNewRole(role);
            setCurrentRole(role);
            profile.role = role;
        }
        catch (error: any) {
            window.alert(error);
        }
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
                        <TableCell>{profile.logins}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Name:</TableCell>
                        <TableCell>
                            {profile.isUser ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <TextField
                                        label=""
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        slotProps={{
                                            htmlInput: {
                                                maxLength: 20,
                                            },
                                        }}
                                        sx={{ width: 300 }}
                                        margin="normal"
                                        fullWidth
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={saveName}
                                        disabled={newName === currentName}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            ) : (
                                currentName
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Role:</TableCell>
                        <TableCell>
                            {auth?.isAdmin && currentRole !== 'Owner' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Select
                                        value={newRole}
                                        displayEmpty
                                        onChange={(event) => setNewRole(event.target.value)}
                                        sx={{ width: 300 }}
                                        fullWidth
                                    >
                                        <MenuItem value="" disabled>
                                            Select role
                                        </MenuItem>
                                        {roleList.map((role, index) => (
                                            <MenuItem value={role} key={index}>
                                                {role}
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={saveRole}
                                        disabled={newRole === currentRole}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            ) : (
                                currentRole
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    )
}

export default ViewProfile;
