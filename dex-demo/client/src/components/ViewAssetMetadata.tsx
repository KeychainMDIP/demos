import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Button,
    Table,
    TableBody,
    TableContainer,
    TableCell,
    TableRow,
} from "@mui/material";
import { formatDate } from "../utils.js";
import UserBadge from "./UserBadge.js";

function ViewAssetMetadata({ asset }: { asset: any }) {
    const { did } = useParams();
    const navigate = useNavigate();
    const [firstDid, setFirstDid] = useState<string | null>(null);
    const [prevDid, setPrevDid] = useState<string | null>(null);
    const [nextDid, setNextDid] = useState<string | null>(null);
    const [lastDid, setLastDid] = useState<string | null>(null);

    function findAdjacentDids() {
        const list = asset.collection?.assets || [];

        let prevDid = null;
        let nextDid = null;
        let firstDid = null;
        let lastDid = null;

        for (let i = 0; i < list.length; i++) {
            if (list[i] === did) {
                if (i > 0) {
                    prevDid = list[i - 1];
                }
                if (i < list.length - 1) {
                    nextDid = list[i + 1];
                }
                break;
            }
        }

        firstDid = list[0];

        if (firstDid === did) {
            firstDid = null;
        }

        lastDid = list[list.length - 1];

        if (lastDid === did) {
            lastDid = null;
        }

        return { firstDid, prevDid, nextDid, lastDid };
    }

    useEffect(() => {
        const init = async () => {
            const { firstDid, prevDid, nextDid, lastDid } = findAdjacentDids();

            setFirstDid(firstDid);
            setPrevDid(prevDid);
            setNextDid(nextDid);
            setLastDid(lastDid);
        };

        init();
    }, [asset]);

    return (
        <TableContainer>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        {asset.token?.matrix ? (
                            <TableCell><a href={`/asset/${asset.token?.matrix}`}>{asset.title || 'no title'}</a></TableCell>
                        ) : (
                            <TableCell>{asset.title || 'no title'}</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Collection</TableCell>
                        {asset.collection?.name ? (
                            <TableCell>
                                <div style={{ display: 'inline-block' }}>
                                    {!asset.token && (
                                        <>
                                            <Button
                                                color="inherit"
                                                disabled={!firstDid}
                                                onClick={() => navigate(`/asset/${firstDid}`)}>
                                                {'<<'}
                                            </Button>
                                            <Button
                                                color="inherit"
                                                disabled={!prevDid}
                                                onClick={() => navigate(`/asset/${prevDid}`)}>
                                                {'<'}
                                            </Button>
                                        </>
                                    )}
                                    <a href={`/collection/${asset.collection.did}`}>{asset.collection.name}</a>
                                    {!asset.token && (
                                        <>
                                            <Button
                                                color="inherit"
                                                disabled={!nextDid}
                                                onClick={() => navigate(`/asset/${nextDid}`)}>
                                                {'>'}
                                            </Button>
                                            <Button
                                                color="inherit"
                                                disabled={!lastDid}
                                                onClick={() => navigate(`/asset/${lastDid}`)}>
                                                {'>>'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        ) : (
                            <TableCell>no collection</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Creator</TableCell>
                        {asset.creator ? (
                            <TableCell><UserBadge user={asset.creator} /></TableCell>
                        ) : (
                            <TableCell>no creator</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Owner</TableCell>
                        {asset.owner ? (
                            <TableCell><UserBadge user={asset.owner} /></TableCell>
                        ) : (
                            <TableCell>no owner</TableCell>
                        )}
                    </TableRow>
                    <TableRow>
                        <TableCell>Created</TableCell>
                        <TableCell>{formatDate(asset.created)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Updated</TableCell>
                        <TableCell>{formatDate(asset.updated)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>File size</TableCell>
                        <TableCell>{asset.image.bytes} bytes</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Image size</TableCell>
                        <TableCell>{asset.image.width} x {asset.image.height} pixels</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Image type</TableCell>
                        <TableCell>{asset.image.type}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default ViewAssetMetadata;
