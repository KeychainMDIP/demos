import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext";
import { AxiosInstance } from "axios";

function ViewLogout({ api }: { api: AxiosInstance }) {
    const navigate = useNavigate();
    const auth = useAuth();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        const init = async () => {
            try {
                await api.post(`/logout`);
                auth.refreshAuth();
                navigate('/');
            }
            catch (error: any) {
                showSnackbar("Failed to logout", 'error');
                navigate('/');
            }
        };

        init();
    }, [navigate, showSnackbar]);

    return null;
}

export default ViewLogout;
