import React, { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
    BrowserRouter as Router,
    Link,
    Routes,
    Route,
} from "react-router-dom";
import { Box, Button, Grid, Select, MenuItem, TextField, Typography } from '@mui/material';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<ViewLogin />} />
                <Route path="/logout" element={<ViewLogout />} />
                <Route path="/guests" element={<ViewGuests />} />
                <Route path="/members" element={<ViewMembers />} />
                <Route path="/admin" element={<ViewOwner />} />
                <Route path="/owner" element={<ViewOwner />} />
                <Route path="/profile/:did" element={<ViewProfile />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

function Header({ title }) {
    return (
        <Grid container direction="row" justifyContent="flex-start" alignItems="center" spacing={3}>
            <Grid item>
                <Link to="/">
                    <img src="/demo.png" alt="home" />
                </Link>
            </Grid>
            <Grid item>
                <h1>{title}</h1>
            </Grid>
        </Grid>
    )
}

function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [auth, setAuth] = useState(null);
    const [userDID, setUserDID] = useState('');
    const [userName, setUserName] = useState('');
    const [logins, setLogins] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const response = await axios.get(`/api/check-auth`);
                const auth = response.data;
                setAuth(auth);
                setIsAuthenticated(auth.isAuthenticated);
                setUserDID(auth.userDID);

                if (auth.profile) {
                    setLogins(auth.profile.logins);

                    if (auth.profile.name) {
                        setUserName(auth.profile.name);
                    }
                }
            }
            catch (error) {
                window.alert(error);
            }
        };

        init();
    }, []);

    async function login() {
        navigate('/login');
    }

    async function logout() {
        navigate('/logout');
    }

    if (!auth) {
        return (
            <div className="App">
                <Header title="Les Troyens are warming up..." />
            </div>
        )
    }

    return (
        <div className="App">
            <Header title="Les Troyens (2008) - Interactive Music Album" />
            <Grid container style={{ width: '800px' }}>
                <Grid item xs={true} style={{ textAlign: 'left' }}>
                    {isAuthenticated ? (
                        <Button variant="contained" color="secondary" onClick={logout}>
                            Depart
                        </Button>
                    ) : (
                        <Button variant="contained" color="secondary" onClick={login}>
                            Enter
                        </Button>
                    )}
                </Grid>
            </Grid>

            {isAuthenticated ? (
                <Box><b><br />
                    {logins > 1 ? (
                        `Welcome back, ${userName || userDID}`
                    ) : (
                        `Welcome, ${userDID}`
                    )}
                    </b><br /><br />
                    This is Les Troyens interactive music album, a smart digital asset with its own unique decentralized identity and and MDIP Keymaster API to interact with content owners, administrators, and the community of listeners. Be sure to add your name to your Album Profile! Once you are upgraded to full membership, The Album will send you a membership credential and you will be able to see other Les Troyens listeners.
                    <ul>
                        <li><Link to={`/profile/${userDID}`}>My Profile</Link></li>
                        {auth.isMember &&
                            <li><Link to='/members'>Community Members</Link></li>
                        }
                        {auth.isAdmin &&
                            <li><Link to='/admin'>Community Access Log</Link></li>
                        }
                    </ul>
		    <b>About Les Troyens:</b><br />
		    <p>Les Troyens is a semi-professional men choir that performed in Montreal from 2005 to 2008. The choir was directed by the group's only woman, professional pianist Pascale Verstrepen. <b>It's a fact:</b> SelfID's own Christian Saucier elected to sing for this recording rather than sing as part of a 300 people choir at Carnegie Hall in NYC. Pascale: If you ever see this - please contact me at christian[at]selfid.com.</p>
		    <table><tr><td><h4>1- Trut Avant Il Faut Boire </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmSyZEnEgNgFn29jyMFNUhk2AwhKEXorhTJCN8e7CgFDSo" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>2- Alle Psalite </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmUDvJ8WuoSFGfMLnvEy9n7B2oRFXFvjT81ZraMw1odDTL" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>3- Stella Splendens </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmbCAxazJqejGXqZyDzTmAwexS2Rzxj3VFX5LUdseQmB1h" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>4- Gloire Immortelle </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmYrtHEw991phb1ahfHA5BLetaUKCqN1ADybJ2PmAsH93c" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>5- Cantique de Jean Racine </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmfXmEmpc97jNL2pvKBazztsWyfuZvsttiH23U7MmknL8R" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>6- Amazing Grace </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmSHA9sTiJGbswBYWXB7qg38CncAzvhdoeiMNSDaG2iQx4" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>7- Bruckner's Ave Maria </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmbBupMni96NUTvxcU9AZcxREvJcS85RZEPpQ6Ava829wc" type="audio/mp3"></source></audio></td>
		    </tr><tr><td><h4>8- Calme des Nuits </h4></td>
		    	<td><audio controls><source src="https://ipfs.mdip.yourself.dev/ipfs/QmbhgrxCtFACQCtkRuMCka9FL3Lwj6e6eZ8i5cxdrUXKSu" type="audio/mp3"></source></audio></td>
		    </tr></table>
		    <hr/><p>This interactive album is powered by <a href="https://keychain.org">MDIP</a>.</p>
                </Box>
            ) : (
                <Box>
                    <p>This is an interactive music album, secured and powered by MDIP, the Multi-Dimensional Identity Protocol. The music album is given a unique decentralized identity (DID) along with a dedicated MDIP Keymaster interface to interact with content owners, administrators, and the community of listeners. Anyone with an MDIP DID can respond to the album's challenge and gain access to its content.</p><p>Find out more about MDIP at <a href="https://keychain.org">keychain.org</a>.</p>
                </Box>
            )}
        </div>
    )
}

function ViewLogin() {
    const [challengeDID, setChallengeDID] = useState('');
    const [responseDID, setResponseDID] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [challengeURL, setChallengeURL] = useState(null);
    const [challengeCopied, setChallengeCopied] = useState(false);

    const navigate = useNavigate();
    let intervalId;

    useEffect(() => {
        const init = async () => {
            try {
               intervalId = setInterval(async () => {
                    try {
                        const response = await axios.get('/api/check-auth');
                        if (response.data.isAuthenticated) {
                            clearInterval(intervalId);
                            navigate('/');
                        }
                    } catch (error) {
                        console.error('Failed to check authentication:', error);
                    }
                }, 1000); // Check every 3 seconds

                const response = await axios.get(`/api/challenge`);
                const { challenge, challengeURL } = response.data;
                setChallengeDID(challenge);
                setChallengeURL(encodeURI(challengeURL));
            }
            catch (error) {
                window.alert(error);
            }
        };

        init();
	return () => clearInterval(intervalId);
    }, []);

    async function login() {
        setLoggingIn(true);

        try {
            const getAuth = await axios.post(`/api/login`, { challenge: challengeDID, response: responseDID });

            if (getAuth.data.authenticated) {
                navigate('/');
            }
            else {
                alert('login failed');
            }
        }
        catch (error) {
            window.alert(error);
        }

        setLoggingIn(false);
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        }
        catch (error) {
            window.alert('Failed to copy text: ', error);
        }
    };
	
    return (
        <div className="App" style={{ backgroundColor: "#ebdfb3"}}>
	    <Header title="Can you respond to Les Troyens challenge?" />
            <Table style={{ width: '800px' }}>
                <TableBody>
                    <TableRow>
                        <TableCell align="center">
                            {challengeURL &&
                                <a href={challengeURL} target="mdip" rel="noreferrer">
                                    <QRCodeSVG value={challengeURL} />
                                </a>
                            }
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell align="center">
                            <a href="https://github.com/KeychainMDIP/auth-demo"><img src="https://ipfs.mdip.yourself.dev/ipfs/QmX3Mnas5cQa1miegi4bj7Dd2rbqWQKtQsQWwCtHS8NZzn?filename=MDIP%20Auth%20Callout.png"/></a>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}

function ViewLogout() {
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                await axios.post(`/api/logout`);
                navigate('/');
            }
            catch (error) {
                window.alert('Failed to logout: ', error);
            }
        };

        init();
    });
}

function ViewGuests() {
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const response = await axios.get(`/api/check-auth`);
                const auth = response.data;

                if (!auth.isGuest) {
                    navigate('/');
                }
            }
            catch (error) {
                navigate('/');
            }
        };

        init();
    }, [navigate]);

    return (
        <div className="App">
            <Header title="Music Area" />
            <p>Links to music go here</p>
        </div>
    )
}

function ViewMembers() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const response = await axios.get(`/api/users`);
                setUsers(response.data);
            }
            catch (error) {
                navigate('/');
            }
        };

        init();
    }, [navigate]);

    return (
        <div className="App">
            <Header title="Community Members Area" />
            <h2>Registered Community Members:</h2>
            <Table style={{ width: '800px' }}>
                <TableBody>
                    {users.map((did, index) => (
                        <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell><Link to={`/profile/${did}`}>{did}</Link></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function ViewAdmins() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const response = await axios.get(`/api/check-auth`);
                const auth = response.data;

                if (!auth.isAdmin) {
                    navigate('/');
                }
            }
            catch (error) {
                navigate('/');
            }
        };

        init();
    }, [navigate]);

    return (
        <div className="App">
            <Header title="Admins Area" />
            <p>Admins have the ability to set roles for other users</p>
            <h2>Users</h2>
            <Table style={{ width: '800px' }}>
                <TableBody>
                    {users.map((did, index) => (
                        <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell><Link to={`/profile/${did}`}>{did}</Link></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

        </div>
    )
}

function ViewOwner() {
    const [adminInfo, setAdminInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const response = await axios.get(`/api/admin`);
                setAdminInfo(response.data);
            }
            catch (error) {
                navigate('/');
            }
        };

        init();
    }, [navigate]);

    return (
        <div className="App">
            <Header title="Community Access Log" />
            <h2>User Community Database:</h2>
            <pre>{JSON.stringify(adminInfo, null, 4)}</pre>
        </div>
    )
}

function ViewProfile() {
    const { did } = useParams();
    const navigate = useNavigate();
    const [auth, setAuth] = useState(null);
    const [profile, setProfile] = useState(null);
    const [currentName, setCurrentName] = useState("");
    const [newName, setNewName] = useState("");
    const [roleList, setRoleList] = useState([]);
    const [currentRole, setCurrentRole] = useState("");
    const [newRole, setNewRole] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                const getAuth = await axios.get(`/api/check-auth`);
                const auth = getAuth.data;

                setAuth(auth);

                const getProfile = await axios.get(`/api/profile/${did}`);
                const profile = getProfile.data;

                setProfile(profile);

                if (profile.name) {
                    setCurrentName(profile.name);
                    setNewName(profile.name);
                }

                if (profile.role) {
                    setCurrentRole(profile.role);
                    setNewRole(profile.role);
                }

                setRoleList(['Admin', 'Member', 'Guest']);
            }
            catch (error) {
                navigate('/');
            }
        };

        init();
    }, [did, navigate]);

    async function saveName() {
        try {
            const name = newName.trim();
            await axios.put(`/api/profile/${profile.did}/name`, { name });
            setNewName(name);
            setCurrentName(name);
            profile.name = name;
        }
        catch (error) {
            window.alert(error);
        }
    }

    async function saveRole() {
        try {
            const role = newRole;
            await axios.put(`/api/profile/${profile.did}/role`, { role });
            setNewRole(role);
            setCurrentRole(role);
            profile.role = role;
        }
        catch (error) {
            window.alert(error);
        }
    }

    function formatDate(time) {
        const date = new Date(time);
        const now = new Date();
        const days = differenceInDays(now, date);

        return `${format(date, 'yyyy-MM-dd HH:mm:ss')} (${days} days ago)`;
    }

    if (!profile) {
        return (
            <div className="App">
                <Header title="Profile" />
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="App">
            <Header title="Profile" />
            <Table style={{ width: '800px' }}>
                <TableBody>
                    <TableRow>
                        <TableCell>DID:</TableCell>
                        <TableCell>
                            <Typography style={{ fontFamily: 'Courier' }}>
                                {profile.did}
                            </Typography>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>First login:</TableCell>
                        <TableCell>{formatDate(profile.firstLogin)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Last login:</TableCell>
                        <TableCell>{formatDate(profile.lastLogin)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Login count:</TableCell>
                        <TableCell>{profile.logins}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Name:</TableCell>
                        <TableCell>
                            {profile.isUser && currentRole !== 'Owner' ? (
                                <Grid container direction="row" justifyContent="flex-start" alignItems="center" spacing={3}>
                                    <Grid item>
                                        <TextField
                                            label=""
                                            style={{ width: '300px' }}
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            fullWidth
                                            margin="normal"
                                            inputProps={{ maxLength: 20 }}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Button variant="contained" color="secondary" onClick={saveName} disabled={newName === currentName}>
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                            ) : (
                                currentName
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Role:</TableCell>
                        <TableCell>
                            {auth.isAdmin && currentRole !== 'Owner' ? (
                                <Grid container direction="row" justifyContent="flex-start" alignItems="center" spacing={3}>
                                    <Grid item>
                                        <Select
                                            style={{ width: '300px' }}
                                            value={newRole}
                                            fullWidth
                                            displayEmpty
                                            onChange={(event) => setNewRole(event.target.value)}
                                        >
                                            <MenuItem value="" disabled>
                                                Select role
                                            </MenuItem>
                                            {roleList.map((role, index) => (
                                                <MenuItem value={role} key={index}>
                                                    {role}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid item>
                                        <Button variant="contained" color="secondary" onClick={saveRole} disabled={newRole === currentRole}>
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                            ) : (
                                currentRole
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}

function NotFound() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/");
    });
}

export default App;
