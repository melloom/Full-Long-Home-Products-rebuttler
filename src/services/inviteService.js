import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getDb } from './firebase/config';

/**
 * Generate a unique token for company invites
 */
const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Create or get an invite token for a company
 * @param {string} companyId - The company ID
 * @param {string} companySlug - The company slug for the URL
 * @returns {Promise<string>} - The invite token
 */
export const getOrCreateInviteToken = async (companyId, companySlug) => {
  try {
    const db = getDb();
    const inviteRef = doc(db, 'company-invites', companyId);
    
    // Check if token already exists
    const inviteDoc = await getDoc(inviteRef);
    
    if (inviteDoc.exists()) {
      const data = inviteDoc.data();
      // Update the slug in case it changed
      await setDoc(inviteRef, {
        companySlug: companySlug,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return data.token;
    }
    
    // Create new token
    const token = generateToken();
    await setDoc(inviteRef, {
      token: token,
      companyId: companyId,
      companySlug: companySlug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    });
    
    return token;
  } catch (error) {
    console.error('Error creating invite token:', error);
    throw error;
  }
};

/**
 * Get company information from an invite token
 * @param {string} token - The invite token
 * @returns {Promise<{companyId: string, companySlug: string} | null>}
 */
export const getCompanyFromToken = async (token) => {
  try {
    const db = getDb();
    
    // Query for the token in company-invites collection
    const invitesRef = collection(db, 'company-invites');
    const q = query(invitesRef, where('token', '==', token), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        companyId: data.companyId,
        companySlug: data.companySlug || data.companyId
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting company from token:', error);
    return null;
  }
};

/**
 * Generate the full invite URL
 * @param {string} token - The invite token
 * @returns {string} - The full URL
 */
export const getInviteUrl = (token) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${token}`;
};

