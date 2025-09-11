import React, { createContext, useContext } from "react";
import axios, { AxiosInstance } from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

export const ApiContext = createContext<AxiosInstance>(api);

export const useApi = () => useContext(ApiContext);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
);
