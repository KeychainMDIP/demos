import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { AxiosInstance } from "axios";
import { useAuth } from '../contexts/AuthContext';

function Header({ api }: { api: AxiosInstance }) {
    const navigate = useNavigate();
    const auth = useAuth();

    function login() {
        navigate('/login');
    }

    function logout() {
        navigate('/logout');
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                px: 2,
                width: '100%'
            }}
        >
            <Box>
                <Link to='/' style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" component="h4">
                        MDIP
                    </Typography>
                    <Box
                        component="img"
                        src="/demo.png"
                        alt="MDIP"
                        sx={{ width: 48, height: 48 }}
                    />
                </Link>
            </Box>

            <Typography variant="h4" component="h4">
                DEX Demo
            </Typography>

            {auth.isAuthenticated ? (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={logout}
                >
                    Logout
                </Button>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={login}
                >
                    Login
                </Button>
            )}
        </Box>
    )
}

export default Header;
