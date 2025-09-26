import React, { useEffect, useState } from 'react';
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
                <a href={`/asset/${profile.pfp.did}`} >
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
                </a>
            } <a href={`/profile/${profile.did}`} >{profile.name}</a>
        </div>
    );
}

export default UserBadge;
