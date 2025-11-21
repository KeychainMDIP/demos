import React from 'react';

function ProfileCard({ profile }: { profile: any }) {
    const cardStyle: React.CSSProperties = {
        width: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        border: '3px solid #00f',
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
                <img src={`/api/ipfs/${profile.pfp.cid}`} style={imgStyle} alt={profile.name} />
            </div>
            <p style={titleStyle}>{profile.name}</p>
            <p style={titleStyle}>{profile.collections} {profile.collections === 1 ? 'collection' : 'collections'}</p>
        </div>
    );
};

export default ProfileCard;
