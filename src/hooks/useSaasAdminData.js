import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { getDb } from '../services/firebase/config';

export const useSaasAdminData = () => {
  const { currentUser, authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyAdmins, setCompanyAdmins] = useState({});
  const [deletedCompanies, setDeletedCompanies] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);

  const checkAuth = async () => {
    if (authLoading) return;
    
    setLoading(true);
    setError(null);
    
    if (!currentUser) {
      setError('No user logged in');
      setLoading(false);
      return;
    }

    try {
      // First check if user is a super admin
      const superAdminRef = doc(getDb(), 'super-admins', currentUser.uid);
      const superAdminDoc = await getDoc(superAdminRef);
      
      if (superAdminDoc.exists()) {
        const superAdminData = superAdminDoc.data();
        console.log('🔍 useSaasAdminData: Found super admin in Firestore:', superAdminData);
        
        const adminUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'super-admin',
          ...superAdminData
        };
        
        setAdminUser(adminUser);
        setLoading(false);
        return;
      }

      // Check if user exists in regular admins collection
      const adminDoc = await getDoc(doc(getDb(), 'admins', currentUser.uid));
      if (!adminDoc.exists()) {
        setError('Admin access not found');
        setLoading(false);
        return;
      }

      const adminData = adminDoc.data();
      if (adminData.role !== 'super-admin') {
        setError('Super admin access required');
        setLoading(false);
        return;
      }

      setAdminUser({ id: currentUser.uid, ...adminData });
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to verify admin access');
      setLoading(false);
    }
  };

  const loadData = async (scopeCompanyId) => {
    if (!adminUser) {
      console.log('⚠️ No admin user found, skipping data load');
      return;
    }

    try {
      console.log('🔄 Starting data load process...');
      setLoading(true);
      setError(null);

      const db = getDb();

      // Load all data in parallel for better performance
            const [
        companiesSnapshot,
        platformsSnapshot,
        usersSnapshot,
        registrationRequestsSnapshot
      ] = await Promise.all([
        // Load companies (without orderBy to avoid issues with missing createdAt fields)
        getDocs(collection(db, 'companies')).catch(async (err) => {
          console.log('⚠️ Error loading companies with orderBy, trying without:', err.message);
          return await getDocs(collection(db, 'companies'));
        }),
        // Load platforms  
        getDocs(collection(db, 'platforms')).catch(async (err) => {
          console.log('⚠️ Error loading platforms with orderBy, trying without:', err.message);
          return await getDocs(collection(db, 'platforms'));
        }),
        // Load all users
        getDocs(collection(db, 'users')).catch(async (err) => {
          console.log('⚠️ Error loading users with orderBy, trying without:', err.message);
          return await getDocs(collection(db, 'users'));
        }),
        // Load registration requests
        getDocs(collection(db, 'company-registration-requests')).catch(async (err) => {
          console.log('⚠️ Error loading registration requests:', err.message);
          return { docs: [] };
        })
      ]);

      // Process companies data
      const companiesData = companiesSnapshot.docs.map(doc => {
        const data = doc.data();
        const company = {
        id: doc.id,
          ...data,
          // Ensure consistent date handling
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || data.createdAt,
          // Add computed fields
          userCount: 0, // Will be updated after loading admins
          adminCount: 0,
          status: data.status || 'active'
        };
        console.log('🔍 Loaded company:', company.name, 'Status:', company.status, 'Original status:', data.status);
        return company;
      });
      setCompanies(companiesData);
      console.log('✅ Loaded', companiesData.length, 'companies');

      // Process platforms data
      const platformsData = platformsSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure features are in the correct format (object with boolean values)
        let features = data.features;
        if (features) {
          if (Array.isArray(features)) {
            // Convert array to object format
            const featuresObject = {};
            features.forEach(feature => {
              featuresObject[feature] = true;
            });
            features = featuresObject;
          }
        } else {
          // Add default features if none exist
          features = {
            'User Management': true,
            'Content Library': true,
            'Progress Tracking': true,
            'Analytics Dashboard': true,
            'Mobile Responsive': true,
            'Custom Branding': true,
            'Email Notifications': true,
            'API Access': true
          };
        }
        
        return {
          id: doc.id,
          ...data,
          features: features
        };
      });
      setPlatforms(platformsData);
      console.log('✅ Loaded', platformsData.length, 'platforms');

      // Process registration requests data
      const registrationRequestsData = registrationRequestsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        };
      });
      setRegistrationRequests(registrationRequestsData);
      console.log('✅ Loaded', registrationRequestsData.length, 'registration requests');

      // Process users data
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      console.log('✅ Loaded', usersData.length, 'users');

      // Load company admins and users (this will update company user counts)
      await loadCompanyAdmins(companiesData);

      // Load deleted companies
      await loadDeletedCompanies();

      console.log('🎉 Data loading completed successfully');

    } catch (err) {
      console.error('❌ Critical error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyAdmins = async (companiesData) => {
    try {
      console.log('🔄 Loading company admins for', companiesData.length, 'companies');
      console.log('Companies data:', companiesData.map(c => ({ id: c.id, name: c.name })));
      
      const adminsData = {};
      const db = getDb();
      
      // First, get all super admin UIDs to filter them out
      const superAdminsSnapshot = await getDocs(collection(db, 'super-admins'));
      const superAdminUids = new Set(superAdminsSnapshot.docs.map(doc => doc.id));
      console.log(`🔍 Found ${superAdminUids.size} super admins to filter out`);
      
      // First, let's check what collections exist and their structure
      console.log('🔍 Checking database collections...');
      
      // Use Promise.all for parallel loading
      const adminPromises = companiesData.map(async (company) => {
        try {
          console.log(`🔄 Loading users for company: ${company.name} (${company.id})`);
          console.log(`📋 Company object:`, company);
          
          // Try different query approaches to handle potential issues
          // Helper function to try different field names for company ID
          const queryCollectionForCompany = async (collectionName, companyId) => {
            console.log(`🔍 Querying ${collectionName} for company ID: "${companyId}"`);
            
            // Primary query with companyId field
            try {
              const snapshot = await getDocs(query(
                collection(db, collectionName),
                where('companyId', '==', companyId)
              ));
              
              console.log(`📊 Found ${snapshot.docs.length} documents in ${collectionName}`);
              
              if (snapshot.docs.length > 0) {
                snapshot.docs.forEach((doc, index) => {
                  const data = doc.data();
                  console.log(`  ${index + 1}. ${data.name || data.email} (${data.role || 'No Role'})`);
                });
                return snapshot;
              }
            } catch (err) {
              console.log(`⚠️ Query failed for ${collectionName}:`, err.message);
            }
            
            console.log(`❌ No documents found in ${collectionName} for company ${companyId}`);
            return { docs: [] };
          };

          // Query multiple collections for different types of admins/users
          const [adminsSnapshot, companyAdminsSnapshot, usersSnapshot] = await Promise.all([
            queryCollectionForCompany('admins', company.id),
            queryCollectionForCompany('company-admins', company.id),
            queryCollectionForCompany('users', company.id)
          ]);

          console.log(`📊 Found ${adminsSnapshot.docs.length} regular admins, ${companyAdminsSnapshot.docs.length} company admins, and ${usersSnapshot.docs.length} users for ${company.name}`);

          // Process regular admins
          const admins = adminsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              type: 'admin',
              displayRole: 'Admin'
            };
          });

          // Process company admins
          const companyAdmins = companyAdminsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              type: 'admin',
              displayRole: 'Company Admin'
            };
          });

          // Process regular users
          const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
          id: doc.id,
              ...data,
              type: 'user',
              displayRole: data.role || 'User'
            };
          });

          // Combine all admin types and users, then filter out super admins
          const allCompanyUsers = [...admins, ...companyAdmins, ...users]
            .filter(user => {
              const userId = user.uid || user.id;
              const isSuperAdmin = superAdminUids.has(userId);
              if (isSuperAdmin) {
                console.log(`🚫 Filtering out super admin: ${user.email || user.name} (${userId})`);
              }
              return !isSuperAdmin;
            })
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return dateB - dateA;
            });

          console.log(`✅ Total users for ${company.name}: ${allCompanyUsers.length} (super admins filtered out)`);
          return { companyId: company.id, users: allCompanyUsers };
        } catch (err) {
          console.error(`❌ Error loading users for company ${company.id} (${company.name}):`, err);
          return { companyId: company.id, users: [] };
        }
      });

      const results = await Promise.all(adminPromises);
      
      // Convert results to adminsData object
      results.forEach(({ companyId, users }) => {
        adminsData[companyId] = users;
      });
      
      setCompanyAdmins(adminsData);
      
      // Log final results
      const totalUsers = Object.values(adminsData).reduce((sum, users) => sum + users.length, 0);
      console.log('✅ Company admins loaded successfully:', Object.keys(adminsData).length, 'companies,', totalUsers, 'total users');
      console.log('📊 Final adminsData structure:', Object.entries(adminsData).map(([companyId, users]) => ({
        companyId,
        userCount: users.length,
        adminCount: users.filter(u => u.type === 'admin').length
      })));
      
    } catch (err) {
      console.error('❌ Error loading company admins:', err);
      setError('Failed to load company administrators');
    }
  };

  const loadDeletedCompanies = async () => {
    try {
      console.log('🔄 Loading deleted companies...');
      const deletedQuery = query(
        collection(getDb(), 'deletedCompanies'),
        orderBy('deletedAt', 'desc')
      );
      const deletedSnapshot = await getDocs(deletedQuery);
      const deletedData = deletedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeletedCompanies(deletedData);
      console.log(`✅ Loaded ${deletedData.length} deleted companies`);
    } catch (err) {
      // Handle specific Firebase permission errors gracefully
      if (err.code === 'permission-denied' || err.message.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ No access to deleted companies - user may not be super admin');
        setDeletedCompanies([]); // Set empty array instead of leaving undefined
      } else {
        console.error('❌ Error loading deleted companies:', err);
        // Don't throw the error to prevent it from breaking the entire data loading process
      }
    }
  };

  const createCompany = async (companyData) => {
    try {
      const companyRef = await addDoc(collection(getDb(), 'companies'), {
        ...companyData,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      // Reload data
      await loadData();
      return companyRef.id;
    } catch (err) {
      console.error('Error creating company:', err);
      throw err;
    }
  };

  const createPlatform = async (platformData) => {
    try {
      const platformRef = await addDoc(collection(getDb(), 'platforms'), {
        ...platformData,
        createdAt: serverTimestamp()
      });
      
      // Reload data
      await loadData();
      return platformRef.id;
    } catch (err) {
      console.error('Error creating platform:', err);
      throw err;
    }
  };

  const updateCompany = async (companyId, updateData) => {
    try {
      console.log('🔍 Updating company:', companyId, 'with data:', updateData);
      console.log('🔍 Status being saved:', updateData.status);
      await updateDoc(doc(getDb(), 'companies', companyId), updateData);
      console.log('✅ Company updated successfully');
      await loadData();
    } catch (err) {
      console.error('Error updating company:', err);
      throw err;
    }
  };

  const updatePlatform = async (platformId, updateData) => {
    try {
      await updateDoc(doc(getDb(), 'platforms', platformId), updateData);
      await loadData();
    } catch (err) {
      console.error('Error updating platform:', err);
      throw err;
    }
  };

  const deleteCompany = async (companyId) => {
    try {
      // Backup company data first
      await backupCompanyData(companyId);
      
      // Delete the company
      await deleteDoc(doc(getDb(), 'companies', companyId));
      
      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error deleting company:', err);
      throw err;
    }
  };

  const backupCompanyData = async (companyId) => {
    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      const backupData = {
        ...company,
        deletedAt: serverTimestamp(),
        originalId: companyId
      };

      await addDoc(collection(getDb(), 'deletedCompanies'), backupData);
    } catch (err) {
      console.error('Error backing up company data:', err);
    }
  };

  const restoreCompany = async (backupId) => {
    try {
      const backupDoc = await getDoc(doc(getDb(), 'deletedCompanies', backupId));
      if (!backupDoc.exists()) {
        throw new Error('Backup not found');
      }

      const backupData = backupDoc.data();
      const { originalId, deletedAt, ...companyData } = backupData;

      // Create new company with restored data
      const newCompanyRef = await addDoc(collection(getDb(), 'companies'), {
        ...companyData,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      // Delete the backup
      await deleteDoc(doc(getDb(), 'deletedCompanies', backupId));

      // Reload data
      await loadData();
      
      return newCompanyRef.id;
    } catch (err) {
      console.error('Error restoring company:', err);
      throw err;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (adminUser) {
      loadData();
    }
  }, [adminUser]);

  return {
    loading,
    error,
    adminUser,
    companies,
    platforms,
    users,
    companyAdmins,
    deletedCompanies,
    registrationRequests,
    createCompany,
    createPlatform,
    updateCompany,
    updatePlatform,
    deleteCompany,
    restoreCompany,
    loadData
  };
};