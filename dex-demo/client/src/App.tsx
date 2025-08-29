import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import {
    Box,
} from '@mui/material';
import axios from 'axios';
import { SnackbarProvider } from './contexts/SnackbarContext.js';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Home from './components/Home.js';
import ViewLogin from './components/ViewLogin.js';
import ViewLogout from './components/ViewLogout.js';
import ViewProfile from './components/ViewProfile.js';
import NotFound from './components/NotFound.js';
import JsonViewer from "./components/JsonViewer.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

function AppLayout() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: '900px' }}>
            <Header api={api} />
            <Box sx={{ display: 'flex', flexGrow: 1, width: '100%' }}>
                <Sidebar api={api} />
                <Box
                    sx={{
                        width: '100%',
                        margin: '0 auto',
                        minHeight: '100vh'
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Home api={api} />} />
                        <Route path="/login" element={<ViewLogin api={api} />} />
                        <Route path="/logout" element={<ViewLogout api={api} />} />
                        <Route path="/profile/:did" element={<ViewProfile api={api} />} />
                        <Route path="/search" element={<JsonViewer api={api} />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
}

function App() {
    return (
        <SnackbarProvider>
            <AuthProvider>
                <Router>
                    <AppLayout />
                </Router>
            </AuthProvider>
        </SnackbarProvider>
    );
}

export default App;
