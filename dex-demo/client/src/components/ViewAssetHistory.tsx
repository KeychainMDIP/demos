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
import { formatTime } from "../utils.js";
import UserBadge from "./UserBadge.js";

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

                if (record.type === 'list') {
                    if (record.details.price) {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <UserBadge did={record.actor} />
                                {`listed edition`}&nbsp;
                                <a href={`/asset/${record.details.did}`}>
                                    #{record.details.edition} of {asset.minted.editions}
                                </a>&nbsp;
                                {`for ${record.details.price} credits.`}
                            </div>
                        );
                    } else {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <UserBadge did={record.actor} />
                                {`delisted edition`}&nbsp;
                                <a href={`/asset/${record.details.did}`}>
                                    #{record.details.edition} of {asset.minted.editions}
                                </a>.
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
