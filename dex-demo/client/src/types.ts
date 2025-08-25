export interface AuthState {
    isAuthenticated: boolean;
    userDID: string | null;
    isOwner: boolean;
    profile?: {
        logins?: number;
        name?: string;
        [key: string]: any;
    } | null;
    error?: string;
    [key: string]: any;
}
