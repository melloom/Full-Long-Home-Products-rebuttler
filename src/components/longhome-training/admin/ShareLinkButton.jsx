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

  // Fallback copy for older browsers
  const fallbackCopy = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (e) {
      console.error('Fallback copy failed:', e);
      return false;
    }
  };

  const handleCopyLink = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Use normalized slug if available, otherwise keep companyId
      const effectiveSlug = companySlug || (companyId === LEGACY_LONG_HOME_ID ? 'long-home' : companyId);
      // Ensure we have the latest token
      const token = await getOrCreateInviteToken(companyId, effectiveSlug);
      const url = getInviteUrl(token, effectiveSlug);

      // Prefer modern Clipboard API when available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
        } catch (e) {
          console.warn('Clipboard API writeText failed, falling back:', e);
          const ok = fallbackCopy(url);
          if (!ok) throw e;
        }
      } else {
        // Older browsers
        const ok = fallbackCopy(url);
        if (!ok) throw new Error('Copy not supported');
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      // Show the URL in a prompt as a last-resort so users can manually copy it
      const manual = inviteUrl || '';
      if (manual) {
        // prevent focus stealing in some browsers
        setTimeout(() => window.prompt('Copy this link (press Ctrl/Cmd+C):', manual), 0);
      } else {
        alert('Failed to copy link. Please try again.');
      }
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

