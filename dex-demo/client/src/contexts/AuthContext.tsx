import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

export interface AuthState {
    isAuthenticated: boolean;
    userDID: string | null;
    isOwner: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isMember: boolean;
    profile?: {
        logins?: number;
        name?: string;
        [key: string]: any;
    } | null;
    error?: string;
    [key: string]: any;
};

type AuthContextType = AuthState & { refreshAuth: () => void };
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        userDID: null,
        isOwner: false,
        isAdmin: false,
        isModerator: false,
        isMember: false,
        loading: true,
        error: undefined,
    });

    const refreshAuth = () => {
        setState(s => ({ ...s, loading: true }));
        axios.get("/api/check-auth")
            .then(res => {
                setState({
                    ...res.data,
                    loading: false,
                    error: undefined,
                });
            })
            .catch(err => {
                setState({
                    isAuthenticated: false,
                    userDID: null,
                    isOwner: false,
                    isAdmin: false,
                    isModerator: false,
                    isMember: false,
                    loading: false,
                    error: err.message,
                });
            });
    };

    useEffect(() => {
        refreshAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
