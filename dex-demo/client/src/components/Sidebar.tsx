import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { AxiosInstance } from "axios";
import { useSnackbar } from '../contexts/SnackbarContext.js';
import { AuthState } from "../types.js";

function Sidebar({ api }: { api: AxiosInstance }) {
    const [auth, setAuth] = useState<AuthState | null>(null);
    const location = useLocation();
    const { showSnackbar } = useSnackbar();

    const fetchData = useCallback(async () => {
        try {
            const authResponse = await api.get<AuthState>('/check-auth');
            setAuth(prevAuth => JSON.stringify(prevAuth) !== JSON.stringify(authResponse.data) ? authResponse.data : prevAuth);
        } catch (error) {
            showSnackbar('Failed to load sidebar data', 'error');
            setAuth(null);
        }
    }, [showSnackbar, api]);

    useEffect(() => {
        fetchData();
    }, [location.pathname, fetchData]);

    const commonListItemSx = {
        mb: 0.5,
        '&.Mui-selected': {
            backgroundColor: 'action.selected',
            '&:hover': {
                backgroundColor: 'action.selected',
            },
        },
        '&:hover': {
            backgroundColor: 'action.hover',
        },
    };

    const isPathActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    if (!auth || !auth.isAuthenticated) {
        return <></>;
    }

    return (
        <Box
            sx={{
                width: 250,
                flexShrink: 0,
                height: '100%'
            }}
        >
            <List component="nav" dense>
                {auth?.isAuthenticated && (
                    <ListItemButton component={RouterLink} to={`/profile/${auth.userDID}`} sx={commonListItemSx} selected={isPathActive(`/profile/${auth.userDID}`)}>
                        <ListItemIcon sx={{ minWidth: 32 }}><AccountCircle /></ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItemButton>
                )}
            </List>
        </Box>
    );
}

export default Sidebar;
