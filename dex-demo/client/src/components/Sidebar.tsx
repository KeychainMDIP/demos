import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { AccountCircle, People, Settings } from '@mui/icons-material';
import { AxiosInstance } from "axios";
import { useAuth } from "../contexts/AuthContext";

function Sidebar({ api }: { api: AxiosInstance }) {
    const auth = useAuth();
    const location = useLocation();

    const listItemSx = {
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

    const listIconSx = {
        minWidth: 32
    };

    const isPathActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    if (auth.loading || !auth.isAuthenticated) {
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
                {auth.isAuthenticated && (
                    <ListItemButton component={RouterLink} to={`/profile/${auth.userDID}`} sx={listItemSx} selected={isPathActive(`/profile/${auth.userDID}`)}>
                        <ListItemIcon sx={listIconSx}><AccountCircle /></ListItemIcon>
                        <ListItemText primary={auth.profile?.name || 'Profile'} />
                    </ListItemButton>
                )}
                {auth.isAuthenticated && (
                    <ListItemButton component={RouterLink} to={`/settings/${auth.userDID}`} sx={listItemSx} selected={isPathActive(`/settings/${auth.userDID}`)}>
                        <ListItemIcon sx={listIconSx}><Settings /></ListItemIcon>
                        <ListItemText primary={'Settings'} />
                    </ListItemButton>
                )}
                {auth.isAdmin && (
                    <ListItemButton component={RouterLink} to={`/users`} sx={listItemSx} selected={isPathActive(`/users`)}>
                        <ListItemIcon sx={listIconSx}><People /></ListItemIcon>
                        <ListItemText primary="Users" />
                    </ListItemButton>
                )}
            </List>
        </Box>
    );
}

export default Sidebar;
