import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import {
    Box,
} from '@mui/material';

import { ApiProvider } from './contexts/ApiContext';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Home from './components/Home.js';
import ViewLogin from './components/ViewLogin.js';
import ViewLogout from './components/ViewLogout.js';
import ViewProfile from './components/ViewProfile.js';
import ViewSettings from "./components/ViewSettings.js";
import ViewUsers from './components/ViewUsers.js';
import ViewCollection from "./components/ViewCollection";
import ViewAsset from "./components/ViewAsset.js";
import NotFound from './components/NotFound.js';
import JsonViewer from "./components/JsonViewer.js";
import './App.css';

function AppLayout() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '95%' }}>
            <Header />
            <Box sx={{ display: 'flex', flexGrow: 1, width: '100%' }}>
                <Sidebar />
                <Box
                    sx={{
                        width: '100%',
                        margin: '0 auto',
                        minHeight: '100vh'
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<ViewLogin />} />
                        <Route path="/logout" element={<ViewLogout />} />
                        <Route path="/profile/:did" element={<ViewProfile />} />
                        <Route path="/settings/:did" element={<ViewSettings />} />
                        <Route path="/collection/:did" element={<ViewCollection />} />
                        <Route path="/asset/:did" element={<ViewAsset />} />
                        <Route path="/users" element={<ViewUsers />} />
                        <Route path="/search" element={<JsonViewer />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
}

function App() {
    return (
        <ApiProvider>
            <AuthProvider>
                <SnackbarProvider>
                    <Router>
                        <AppLayout />
                    </Router>
                </SnackbarProvider>
            </AuthProvider>
        </ApiProvider>
    );
}

export default App;
