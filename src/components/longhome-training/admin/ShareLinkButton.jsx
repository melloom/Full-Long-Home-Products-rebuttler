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

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;
      
      try {
        const db = getDb();
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          const slug = companyData.slug || companyId;
          setCompanySlug(slug);
          
          // Generate or get the invite token
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
      // Ensure we have the latest token
      const token = await getOrCreateInviteToken(companyId, companySlug || companyId);
      const url = getInviteUrl(token, companySlug || companyId);
      
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

