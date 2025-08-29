import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { AccountCircle, People } from '@mui/icons-material';
import { AxiosInstance } from "axios";
import { useAuth } from "../contexts/AuthContext";

function Sidebar({ api }: { api: AxiosInstance }) {
    const auth = useAuth();
    const location = useLocation();

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
                    <ListItemButton component={RouterLink} to={`/profile/${auth.userDID}`} sx={commonListItemSx} selected={isPathActive(`/profile/${auth.userDID}`)}>
                        <ListItemIcon sx={{ minWidth: 32 }}><AccountCircle /></ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItemButton>
                )}
                {auth.isAdmin && (
                    <ListItemButton component={RouterLink} to={`/users`} sx={commonListItemSx} selected={isPathActive(`/users`)}>
                        <ListItemIcon sx={{ minWidth: 32 }}><People /></ListItemIcon>
                        <ListItemText primary="Users" />
                    </ListItemButton>
                )}
            </List>
        </Box>
    );
}

export default Sidebar;
