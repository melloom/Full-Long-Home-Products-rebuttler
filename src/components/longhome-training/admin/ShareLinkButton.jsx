import React, { useState, useEffect } from 'react';
import { getOrCreateInviteToken, getInviteUrl } from '../../../services/inviteService';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '../../../services/firebase/config';
import './ShareLinkButton.css';

const ShareLinkButton = ({ companyId }) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [companySlug, setCompanySlug] = useState('');

  const LEGACY_LONG_HOME_ID = 'oLuxoJq8SHXXEWm9KSEU';

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;
      
      try {
        const db = getDb();
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          // Normalize Long Home: accept legacy id or slug
          const slug = (companyData.slug === 'long-home' || companyId === LEGACY_LONG_HOME_ID) ? 'long-home' : (companyData.slug || companyId);
          setCompanySlug(slug);
          
          // Generate or get the invite token using the normalized slug
          const token = await getOrCreateInviteToken(companyId, slug);
          const url = getInviteUrl(token, slug);
          setInviteUrl(url);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  const handleCopyLink = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      // Use normalized slug if available, otherwise keep companyId
      const effectiveSlug = companySlug || (companyId === LEGACY_LONG_HOME_ID ? 'long-home' : companyId);
      // Ensure we have the latest token
      const token = await getOrCreateInviteToken(companyId, effectiveSlug);
      const url = getInviteUrl(token, effectiveSlug);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Failed to copy link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!companyId) {
    return null;
  }

  return (
    <button
      className="share-link-button"
      onClick={handleCopyLink}
      disabled={loading}
      title="Copy shareable link for workers"
    >
      {loading ? (
        <>⏳ Generating...</>
      ) : copied ? (
        <>✓ Link Copied!</>
      ) : (
        <>🔗 Copy Share Link</>
      )}
    </button>
  );
};

export default ShareLinkButton;

