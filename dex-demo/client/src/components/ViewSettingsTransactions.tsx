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

function ViewSettingsTransactions({ profile }: { profile: any }) {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (profile?.transactions) {
                setTransactions(profile.transactions);
            } else {
                setTransactions([]);
            }
        };

        fetchTransactions();
    }, [profile]);

    if (!profile || !transactions) {
        return;
    }

    function TransactionRow({ record }: { record: any }) {
        const [time, setTime] = useState<string>("");
        const [credits, setCredits] = useState<number>(0);
        const [balance, setBalance] = useState<number>(0);
        const [message, setMessage] = useState<any>(null);

        useEffect(() => {
            const fetchInfo = async () => {
                setMessage(`unknown record type ${record.type}`);
                setTime(formatTime(record.time));
                setCredits(record.credits || 0);
                setBalance(record.balance || 0);


                if (record.type === 'credit') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Added ${record.credits} credits.`}
                        </div>
                    );
                }

                if (record.type === 'mint') {
                    if (record.details.editions === 1) {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Minted a single edition of ${record.details.did}.`}
                            </div>
                        );
                    }
                    else {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Minted ${record.details.editions} editions of ${record.details.did}.`}
                            </div>
                        );
                    }
                }

                if (record.type === 'purchase') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Purchased ${record.details.did} for ${record.credits} credits.`}
                        </div>
                    );
                }

                if (record.type === 'sale') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Sold ${record.details.did} for ${record.credits} credits.`}
                        </div>
                    );
                }

                if (record.type === 'royalty') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Received ${record.credits} credits royalty from ${record.details.did}.`}
                        </div>
                    );
                }

                if (record.type === 'upload') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Uploaded ${record.details.filesUploaded} files (${record.details.bytesUploaded} bytes) for ${record.credits} credits.`}
                        </div>
                    );
                }
            };

            fetchInfo();
        }, [record]);

        return (
            <TableRow>
                <TableCell>{time}</TableCell>
                <TableCell>{credits}</TableCell>
                <TableCell>{balance}</TableCell>
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
                        <TableCell>Credits</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Transaction</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transactions.map((record, index) => (
                        <TransactionRow key={index} record={record} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewSettingsTransactions;
