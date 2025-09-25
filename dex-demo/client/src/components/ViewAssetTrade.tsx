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
import { useSnackbar } from "../contexts/SnackbarContext.js";
import { useAuth } from "../contexts/AuthContext.js";
import { useApi } from "../contexts/ApiContext.js";

function ViewAssetTrade({ asset }: { asset: any }) {
    const auth = useAuth();
    const api = useApi();
    const { showSnackbar } = useSnackbar();
    const [editions, setEditions] = useState<any[]>([]);

    useEffect(() => {
        const fetchEditions = async () => {
            const userDID = auth.isAuthenticated ? auth.userDID : null;
            const editionList = asset.minted?.tokens || []

            for (const edition of editionList) {
                edition.userIsOwner = edition.owner.did === userDID;
            }

            setEditions(editionList);
        };

        fetchEditions();
    }, [asset]);

    if (!asset || !editions) {
        return <div>Loading...</div>;
    }

    function EditionRow({ edition }: { edition: any }) {
        const [title, setTitle] = useState<string>("");
        const [price, setPrice] = useState<number>(0);

        useEffect(() => {
            const fetchInfo = async () => {
                setTitle(edition.title);
                setPrice(edition.price);
            };

            fetchInfo();
        }, [edition]);

        return (
            <TableRow>
                <TableCell>{title}</TableCell>
                <TableCell>{price}</TableCell>
            </TableRow>
        );
    };

    return (
        <TableContainer component={Paper} style={{ maxHeight: '600px', overflow: 'auto' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Edition</TableCell>
                        <TableCell>Price (credits)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {editions.map((edition, index) => (
                        <EditionRow key={index} edition={edition} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetTrade;
