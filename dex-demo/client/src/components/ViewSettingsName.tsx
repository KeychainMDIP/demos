import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { Button, Box, Select, MenuItem, Table, TableBody, TableCell, TableRow, TextField } from "@mui/material";

function ViewSettingsName({ profile, onSave }: { profile: any; onSave: () => void }) {
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const api = useApi();
    const auth = useAuth();

    const [currentName, setCurrentName] = useState<string>("");
    const [newName, setNewName] = useState<string>("");
    const [roleList, setRoleList] = useState<string[]>([]);
    const [currentRole, setCurrentRole] = useState<string>("");
    const [newRole, setNewRole] = useState<string>("");
    const [currentTagline, setCurrentTagline] = useState<string>("");
    const [newTagline, setNewTagline] = useState<string>("");

    useEffect(() => {
        const init = async () => {
            if (profile.name) {
                setCurrentName(profile.name);
                setNewName(profile.name);
            }

            if (profile.role) {
                setCurrentRole(profile.role);
                setNewRole(profile.role);
            }

            if (profile.tagline) {
                setCurrentTagline(profile.tagline);
                setNewTagline(profile.tagline);
            }

            setRoleList(['Admin', 'Moderator', 'Member']);
        };

        init();
    }, [profile, navigate, showSnackbar]);

    async function saveName() {
        try {
            const name = newName.trim();
            await api.patch(`/profile/${profile.did}`, { name });
            setNewName(name);
            setCurrentName(name);
            onSave();
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
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set profile role", 'error');
        }
    }

    async function saveTagline() {
        try {
            const tagline = newTagline;
            await api.patch(`/profile/${profile.did}`, { tagline });
            setNewTagline(tagline);
            setCurrentTagline(tagline);
            onSave();
        }
        catch (error: any) {
            showSnackbar("Failed to set profile tagline", 'error');
        }
    }

    if (!profile) {
        return <></>;
    }

    const labelSx = { fontWeight: 'bold', width: 60 }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Table sx={{ width: '100%' }}>
                <TableBody>
                    <TableRow>
                        <TableCell sx={labelSx}>Name:</TableCell>
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
                        <TableCell sx={labelSx}>Tagline:</TableCell>
                        <TableCell>
                            {profile.isUser ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <TextField
                                        label=""
                                        value={newTagline}
                                        onChange={(e) => setNewTagline(e.target.value)}
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
                                        onClick={saveTagline}
                                        disabled={newTagline === currentTagline}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            ) : (
                                currentTagline
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={labelSx}>Role:</TableCell>
                        <TableCell>
                            {auth.isAdmin && currentRole !== 'Owner' ? (
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

export default ViewSettingsName;
