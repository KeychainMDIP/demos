import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { Button, Box, Select, MenuItem, Table, TableBody, TableCell, TableRow, TextField, private_excludeVariablesFromRoot } from "@mui/material";

function ViewSettingsName() {
    const { did } = useParams();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const api = useApi();
    const auth = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [currentName, setCurrentName] = useState<string>("");
    const [newName, setNewName] = useState<string>("");
    const [roleList, setRoleList] = useState<string[]>([]);
    const [currentRole, setCurrentRole] = useState<string>("");
    const [newRole, setNewRole] = useState<string>("");

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
            showSnackbar("Failed to set profile role", 'error');
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
