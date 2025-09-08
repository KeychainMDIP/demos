import React from 'react';
import { Link } from 'react-router-dom';
import AssetCard from './AssetCard.js';

function AssetGrid({ assets }: { assets: any[] }) {

    if (!assets || assets.length === 0) {
        return <p style={{ textAlign: 'center' }}>0 items</p>;
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {assets.map((asset, index) => (
                <Link key={index} to={`/collection/${asset.did}`} style={{ margin: '8px', textDecoration: 'none' }}>
                    <AssetCard key={index} asset={asset} />
                </Link>
            ))}
        </div>
    );
};

export default AssetGrid;
