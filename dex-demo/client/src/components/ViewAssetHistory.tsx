import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    Paper,
} from '@mui/material';
import { format } from "date-fns";
import { useApi } from "../contexts/ApiContext.js";

function UserBadge({ user, did, fontSize = '1.0em' }: { user?: any, did?: string, fontSize?: string }) {
    const api = useApi();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (did) {
                try {
                    const getProfile = await api.get(`/profile/${did}`);
                    setProfile(getProfile.data);
                } catch (error) {
                    console.log(error);
                }
            }
            else {
                setProfile(user);
            }
        };

        fetchProfile();
    }, [did]);

    if (!profile) {
        return <></>;
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: fontSize, marginLeft: '0.5em', marginRight: '0.5em' }}>
            {profile.pfp?.cid &&
                <img
                    src={`/api/ipfs/${profile.pfp.cid}`}
                    alt=""
                    style={{
                        width: '30px',
                        height: '30px',
                        objectFit: 'cover',
                        marginRight: '10px',
                        borderRadius: '50%',
                    }}
                />
            } <a href={`/profile/${profile.did}`} >{profile.name}</a>
        </div>
    );
}

function ViewAssetHistory({ asset }: { asset: any }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (asset?.minted?.history) {
                setHistory(asset.minted.history);
            }
        };

        fetchHistory();
    }, [asset]);

    if (!asset || !history) {
        return;
    }

    function formatTime(timestamp: string) {
        const date = new Date(timestamp);
        return format(date, "yyyy-MM-dd HH:mm:ss");
    }

    function HistoryRow({ record }: { record: any }) {
        const [time, setTime] = useState<string>("");
        const [message, setMessage] = useState<any>(null);

        useEffect(() => {
            const fetchInfo = async () => {
                setMessage(`unknown record type ${record.type}`);
                setTime(formatTime(record.time));

                if (record.type === 'mint') {
                    if (asset.minted) {
                        if (asset.minted.editions === 1) {
                            setMessage(
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <UserBadge did={record.actor} />{"minted a single edition."}
                                </div>
                            );
                        }
                        else {
                            setMessage(
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <UserBadge did={record.actor} />{`minted ${asset.minted.editions} editions.`}
                                </div>
                            );
                        }
                    }
                    else {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <UserBadge did={record.actor} />{"minted the token."}
                            </div>
                        );
                    }
                }
            };

            fetchInfo();
        }, [record]);

        return (
            <TableRow>
                <TableCell>{time}</TableCell>
                <TableCell>{message}</TableCell>
            </TableRow>
        );
    };

    return (
        <TableContainer component={Paper} style={{ maxHeight: '600px', overflow: 'auto' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Event</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {history.map((record, index) => (
                        <HistoryRow key={index} record={record} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetHistory;
