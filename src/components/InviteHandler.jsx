import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompanyFromToken } from '../services/inviteService';
import LoadingScreen from './LoadingScreen';

const InviteHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleInvite = async () => {
      if (!token) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const companyData = await getCompanyFromToken(token);
        
        if (companyData && companyData.companySlug) {
          // Redirect to the company training page
          navigate(`/company/${companyData.companySlug}`, { replace: true });
        } else {
          setError('Invalid invite link');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error handling invite:', err);
        setError('Failed to process invite link');
        setLoading(false);
      }
    };

    handleInvite();
  }, [token, navigate]);

  if (loading) {
    return <LoadingScreen message="Redirecting to training page..." />;
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        padding: '2rem'
      }}>
        <h2>Invalid Invite Link</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Go to Home
        </button>
      </div>
    );
  }

  return null;
};

export default InviteHandler;

