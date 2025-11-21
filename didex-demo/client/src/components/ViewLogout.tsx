import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useApi } from "../contexts/ApiContext.js";
import { useAuth } from "../contexts/AuthContext";

function ViewLogout() {
    const navigate = useNavigate();
    const api = useApi();
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
