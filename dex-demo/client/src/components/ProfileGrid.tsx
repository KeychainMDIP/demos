import React from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from './ProfileCard.js';

function ProfileGrid({ profiles }: { profiles: any[] }) {

    if (!profiles || profiles.length === 0) {
        return <p style={{ textAlign: 'center' }}>0 profiles</p>;
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {profiles.map((profile, index) => (
                <Link key={index} to={`/profile/${profile.did}`} style={{ margin: '8px', textDecoration: 'none' }}>
                    <ProfileCard key={index} profile={profile} />
                </Link>
            ))}
        </div>
    );
};

export default ProfileGrid;
