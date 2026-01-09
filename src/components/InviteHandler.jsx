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

        if (companyData && (companyData.companySlug || companyData.companyId)) {
          // Fast path: invite includes slug and it's Long Home
          if (companyData.companySlug === 'long-home') {
            try { localStorage.setItem('currentCompanySlug', 'long-home'); } catch (e) {}
            console.log('InviteHandler: invite maps to slug long-home; redirecting to /app');
            navigate('/app', { replace: true });
            return;
          }

          // If the invite maps to the legacy Long Home company ID, redirect immediately to /app
          if (companyData.companyId === 'oLuxoJq8SHXXEWm9KSEU') {
            try { localStorage.setItem('currentCompanySlug', 'long-home'); } catch (e) {}
            console.log('InviteHandler: invite maps to legacy Long Home companyId; redirecting to /app');
            navigate('/app', { replace: true });
            return;
          }

          // If invite refers to a companyId, fetch the company doc to inspect slug/landingPath
          if (companyData.companyId) {
            try {
              const db = require('../services/firebase/config').getDb();
              const { doc, getDoc } = require('firebase/firestore');
              const companyRef = doc(db, 'companies', companyData.companyId);
              const companyDoc = await getDoc(companyRef);
              if (companyDoc.exists()) {
                const comp = companyDoc.data();
                const slug = comp.slug || companyData.companyId;

                if (slug === 'long-home' || comp.landingPath === '/app') {
                  try { localStorage.setItem('currentCompanySlug', 'long-home'); } catch (e) {}
                  console.log('InviteHandler: company doc indicates Long Home or landingPath=/app; redirecting to /app');
                  navigate('/app', { replace: true });
                  return;
                }

                console.log('InviteHandler: redirecting to company page by slug:', slug);
                navigate(`/company/${slug}`, { replace: true });
                return;
              }
            } catch (fetchErr) {
              console.error('InviteHandler: Error fetching company by ID:', fetchErr);
            }
          }

          // Fallback: if we have a companySlug, navigate to it
          if (companyData.companySlug) {
            navigate(`/company/${companyData.companySlug}`, { replace: true });
            return;
          }
        }

        setError('Invalid invite link');
        setLoading(false);
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

