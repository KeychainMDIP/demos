import React from 'react';

function CollectionCard({ collection }: { collection: any }) {
    const cardStyle: React.CSSProperties = {
        width: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        border: collection.sold ? '1px solid #0ff' : collection.published ? '1px solid #0f0' : '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
    };

    const imgContainerStyle: React.CSSProperties = {
        width: '100%',
        height: '200px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    };

    const imgStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        borderRadius: '50%',
    };

    const titleStyle: React.CSSProperties = {
        marginTop: '8px',
        fontSize: '14px',
        color: '#000',
    };

    return (
        <div style={cardStyle}>
            <div style={imgContainerStyle}>
                <img src={`/api/ipfs/${collection.thumbnail.cid}`} style={imgStyle} alt={collection.name} />
            </div>
            <p style={titleStyle}>{collection.name}</p>
            <p style={titleStyle}>{collection.items} items</p>
        </div>
    );
};

export default CollectionCard;
