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
import { useApi } from "../contexts/ApiContext.js";

function ViewSettingsTransactions({ profile }: { profile: any }) {
    const api = useApi();
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
        return <></>;
    }

    function AssetLink({ did }: { did: string }) {
        const [title, setTitle] = useState<string>("");

        useEffect(() => {
            const fetchAsset = async () => {
                try {
                    const getAsset = await api.get(`/asset/${did}`);
                    const { asset } = getAsset.data;

                    setTitle(asset.title || "unknown asset");
                } catch (error: any) {
                    setTitle("unknown asset");
                }
            };

            fetchAsset();
        }, [did]);

        return (
            <>&nbsp;
                <a href={`/asset/${did}`}>"{title}"</a>
            </>
        );
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
                    if (record.details.editions === 0) {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Minted`}<AssetLink did={record.details.did} />{'.'}
                            </div>
                        );
                    } else if (record.details.editions === 1) {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Minted a single edition of`}<AssetLink did={record.details.did} />{'.'}
                            </div>
                        );
                    }
                    else {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Minted ${record.details.editions} editions of`}<AssetLink did={record.details.did} />{'.'}
                            </div>
                        );
                    }
                }

                if (record.type === 'unmint') {
                    if (record.details.editions === 0) {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Unminted`}<AssetLink did={record.details.did} />{'.'}
                            </div>
                        );
                    } else if (record.details.editions === 1) {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Unminted a single edition of`}<AssetLink did={record.details.did} />{'.'}
                            </div>
                        );
                    }
                    else {
                        setMessage(
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {`Unminted ${record.details.editions} editions of`}<AssetLink did={record.details.did} />{'.'}
                            </div>
                        );
                    }
                }

                if (record.type === 'purchase') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Purchased`}<AssetLink did={record.details.did} />{'.'}
                        </div>
                    );
                }

                if (record.type === 'sale') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Sold`}<AssetLink did={record.details.did} />{'.'}
                        </div>
                    );
                }

                if (record.type === 'royalty') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Received royalty for`}<AssetLink did={record.details.did} />{'.'}
                        </div>
                    );
                }

                if (record.type === 'upload') {
                    setMessage(
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {`Uploaded ${record.details.filesUploaded} files (${record.details.bytesUploaded} bytes).`}
                        </div>
                    );
                }
            };

            fetchInfo();
        }, [record]);

        return (
            <TableRow>
                <TableCell>{time}</TableCell>
                <TableCell align="right" style={{ fontFamily: 'monospace' }}>{credits}</TableCell>
                <TableCell align="right" style={{ fontFamily: 'monospace' }}>{balance}</TableCell>
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
                        <TableCell align="right">Credits</TableCell>
                        <TableCell align="right">Balance</TableCell>
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
