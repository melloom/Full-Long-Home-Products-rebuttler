import React, { useEffect, useMemo, useState, useRef } from 'react';
import { getFirestore, collection, getDocs, writeBatch, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import rebuttalsService from '../../../services/rebuttalsService';
import './AdminSettings.css';

const LOCAL_STORAGE_KEY_PREFIX = 'adminSettings:';

const getStorageKey = (companyId) => `${LOCAL_STORAGE_KEY_PREFIX}${companyId || 'global'}`;

const defaultSettings = {
  theme: 'light',
  enableCustomerService: true,
  enableFAQ: true,
  enableRebuttals: true,
  
  companyDisplayName: '',
  companyLegalName: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
  hqAddress: '',
  serviceAreasText: '',
  businessHoursNote: '',
  enableMaintenanceMode: false,
  maintenanceMessage: '',
  enableSalesforce: false,
  salesforceWebhookUrl: '',
  salesforceAuthToken: '',
  leadDefaultAssigneeEmail: '',
  leadCcEmails: '',
};

const AdminSettings = ({ companyId, companyName }) => {
  const storageKey = useMemo(() => getStorageKey(companyId), [companyId]);
  const [settings, setSettings] = useState(defaultSettings);
  const [status, setStatus] = useState('');
  const [dangerConfirm, setDangerConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState('');
  const fileInputRef = useRef(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchiveProgress, setUnarchiveProgress] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {}
  }, [storageKey]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      // Persist maintenance mode to Firestore for app-wide toggle
      const db = getFirestore();
      const maintenanceRef = doc(db, 'system', 'maintenance');
      setDoc(maintenanceRef, {
        enabled: !!settings.enableMaintenanceMode,
        message: settings.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatus('Saved');
      setTimeout(() => setStatus(''), 1500);
    } catch (e) {
      setStatus('Error saving');
    }
  };

  const handleBackupRebuttals = async () => {
    try {
      setStatus('Backing up...');
      const [active, archived, categories] = await Promise.all([
        rebuttalsService.getAllRebuttals(),
        rebuttalsService.getArchivedRebuttals(),
        rebuttalsService.getCategories()
      ]);
      const payload = {
        meta: {
          companyId: companyId || null,
          companyName: companyName || null,
          exportedAt: new Date().toISOString()
        },
        activeRebuttals: active,
        archivedRebuttals: archived,
        categories
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rebuttals-backup-${companyName || 'global'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Backup downloaded');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error(e);
      setStatus('Backup failed');
    }
  };

  const handleDeleteAllRebuttals = async () => {
    if (isDeleting) return;
    const required = (companyName || 'DELETE').toLowerCase();
    if (dangerConfirm.trim().toLowerCase() !== required) {
      setStatus(`Type "${companyName || 'DELETE'}" to confirm`);
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteProgress('Fetching documents...');
      const db = getFirestore();

      const [rebuttalsSnap, archivedSnap] = await Promise.all([
        getDocs(collection(db, 'rebuttals')),
        getDocs(collection(db, 'archived_rebuttals'))
      ]);

      const total = rebuttalsSnap.size + archivedSnap.size;
      if (total === 0) {
        setDeleteProgress('Nothing to delete');
        setIsDeleting(false);
        return;
      }

      const chunk = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      let processed = 0;
      const deleteChunk = async (docs) => {
        const batch = writeBatch(db);
        docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        processed += docs.length;
        setDeleteProgress(`Deleted ${processed} / ${total}`);
      };

      const activeDocs = rebuttalsSnap.docs;
      const archivedDocs = archivedSnap.docs;
      for (const group of chunk(activeDocs, 450)) {
        // eslint-disable-next-line no-await-in-loop
        await deleteChunk(group);
      }
      for (const group of chunk(archivedDocs, 450)) {
        // eslint-disable-next-line no-await-in-loop
        await deleteChunk(group);
      }

      setDeleteProgress('Completed');
      setStatus('All rebuttals deleted');
    } catch (e) {
      console.error(e);
      setDeleteProgress('Delete failed');
      setStatus('Delete failed');
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatus(''), 2500);
    }
  };

  const handleDeleteArchivedOnly = async () => {
    if (isDeleting) return;
    const required = (companyName || 'DELETE').toLowerCase();
    if (dangerConfirm.trim().toLowerCase() !== required) {
      setStatus(`Type "${companyName || 'DELETE'}" to confirm`);
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteProgress('Fetching archived rebuttals...');
      const db = getFirestore();
      const archivedSnap = await getDocs(collection(db, 'archived_rebuttals'));
      const total = archivedSnap.size;
      if (total === 0) {
        setDeleteProgress('No archived rebuttals');
        setIsDeleting(false);
        return;
      }
      const chunk = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      let processed = 0;
      for (const group of chunk(archivedSnap.docs, 450)) {
        const batch = writeBatch(db);
        group.forEach(d => batch.delete(d.ref));
        // eslint-disable-next-line no-await-in-loop
        await batch.commit();
        processed += group.length;
        setDeleteProgress(`Deleted ${processed} / ${total}`);
      }
      setDeleteProgress('Completed');
      setStatus('Archived rebuttals deleted');
    } catch (e) {
      console.error(e);
      setDeleteProgress('Delete failed');
      setStatus('Delete failed');
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatus(''), 2500);
    }
  };

  const handlePurgeEmptyCategories = async () => {
    try {
      setStatus('Purging empty categories...');
      const db = getFirestore();
      const categoriesWithStats = await rebuttalsService.getCategories();
      const empty = categoriesWithStats.filter(c => (c.rebuttalCount || 0) === 0);
      if (empty.length === 0) {
        setStatus('No empty categories');
        setTimeout(() => setStatus(''), 1500);
        return;
      }
      const batch = writeBatch(db);
      empty.forEach(c => {
        const ref = doc(db, 'categories', c.id);
        batch.delete(ref);
      });
      await batch.commit();
      setStatus(`Purged ${empty.length} empty categories`);
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error(e);
      setStatus('Purge failed');
    }
  };

  const onPickBackupFile = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFromBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    setRestoreProgress('Reading file...');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const db = getFirestore();
      setRestoreProgress('Writing categories...');
      if (Array.isArray(data.categories)) {
        for (let i = 0; i < data.categories.length; i += 400) {
          const batch = writeBatch(db);
          const slice = data.categories.slice(i, i + 400);
          slice.forEach(cat => {
            const id = cat.id || doc(collection(db, 'categories')).id;
            const { id: _omit, ...rest } = cat;
            batch.set(doc(db, 'categories', id), rest, { merge: true });
          });
          // eslint-disable-next-line no-await-in-loop
          await batch.commit();
        }
      }
      setRestoreProgress('Writing rebuttals...');
      if (Array.isArray(data.activeRebuttals)) {
        for (let i = 0; i < data.activeRebuttals.length; i += 400) {
          const batch = writeBatch(db);
          const slice = data.activeRebuttals.slice(i, i + 400);
          slice.forEach(r => {
            const id = r.id || doc(collection(db, 'rebuttals')).id;
            const { id: _omit, ...rest } = r;
            batch.set(doc(db, 'rebuttals', id), rest, { merge: true });
          });
          // eslint-disable-next-line no-await-in-loop
          await batch.commit();
        }
      }
      setRestoreProgress('Writing archived rebuttals...');
      if (Array.isArray(data.archivedRebuttals)) {
        for (let i = 0; i < data.archivedRebuttals.length; i += 400) {
          const batch = writeBatch(db);
          const slice = data.archivedRebuttals.slice(i, i + 400);
          slice.forEach(r => {
            const id = r.id || doc(collection(db, 'archived_rebuttals')).id;
            const { id: _omit, ...rest } = r;
            batch.set(doc(db, 'archived_rebuttals', id), rest, { merge: true });
          });
          // eslint-disable-next-line no-await-in-loop
          await batch.commit();
        }
      }
      setRestoreProgress('Completed');
      setStatus('Restore completed');
    } catch (e) {
      console.error(e);
      setRestoreProgress('Restore failed');
      setStatus('Restore failed');
    } finally {
      setIsRestoring(false);
      event.target.value = '';
      setTimeout(() => setStatus(''), 2500);
    }
  };

  const handleRestoreArchivedToActive = async () => {
    if (isUnarchiving) return;
    const required = (companyName || 'DELETE').toLowerCase();
    if (dangerConfirm.trim().toLowerCase() !== required) {
      setStatus(`Type "${companyName || 'DELETE'}" to confirm`);
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      setIsUnarchiving(true);
      setUnarchiveProgress('Fetching archived rebuttals...');
      const db = getFirestore();
      const archivedSnap = await getDocs(collection(db, 'archived_rebuttals'));
      const total = archivedSnap.size;
      if (total === 0) {
        setUnarchiveProgress('No archived rebuttals');
        setIsUnarchiving(false);
        return;
      }
      const docs = archivedSnap.docs;
      const chunk = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      let processed = 0;
      for (const group of chunk(docs, 200)) {
        const batch = writeBatch(db);
        group.forEach(d => {
          const data = d.data();
          const { archivedAt, archivedReason, originalCategory, ...rest } = data;
          const newRef = doc(collection(db, 'rebuttals'));
          batch.set(newRef, {
            ...rest,
            createdAt: rest.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          batch.delete(d.ref);
        });
        // eslint-disable-next-line no-await-in-loop
        await batch.commit();
        processed += group.length;
        setUnarchiveProgress(`Restored ${processed} / ${total}`);
      }
      setUnarchiveProgress('Completed');
      setStatus('Archived rebuttals restored');
    } catch (e) {
      console.error(e);
      setUnarchiveProgress('Restore failed');
      setStatus('Restore failed');
    } finally {
      setIsUnarchiving(false);
      setTimeout(() => setStatus(''), 2500);
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <div className="settings-title">⚙️ Settings</div>
        <div className="settings-subtitle">
          {companyName ? `Manage settings for ${companyName}` : 'Manage admin dashboard preferences'}
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🏢</span>
            <h3 className="settings-card-title">Company</h3>
          </div>
          <div className="settings-card-body">
            <div className="kv">
              <span className="kv-key">Company ID</span>
              <span className="kv-value"><code>{companyId || 'N/A'}</code></span>
            </div>
            <div className="kv">
              <span className="kv-key">Company Name</span>
              <span className="kv-value"><strong>{companyName || 'N/A'}</strong></span>
            </div>
            <div className="field">
              <label className="field-label">Display name</label>
              <input
                className="field-input"
                value={settings.companyDisplayName}
                onChange={(e) => updateSetting('companyDisplayName', e.target.value)}
                placeholder="Long Home"
              />
            </div>
            <div className="field">
              <label className="field-label">Legal name</label>
              <input
                className="field-input"
                value={settings.companyLegalName}
                onChange={(e) => updateSetting('companyLegalName', e.target.value)}
                placeholder="Long Home Products, Inc."
              />
            </div>
          </div>
        </section>

        <section className="settings-card danger-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">⚠️</span>
            <h3 className="settings-card-title">Danger zone</h3>
          </div>
          <div className="settings-card-body">
            <div className="danger-actions">
              <button className="btn" onClick={handleBackupRebuttals}>Backup all rebuttals to JSON</button>
              <div>
                <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleRestoreFromBackup} />
                <button className="btn" onClick={onPickBackupFile} disabled={isRestoring}>
                  {isRestoring ? 'Restoring…' : 'Restore from backup JSON'}
                </button>
                {restoreProgress && <div className="progress-text">{restoreProgress}</div>}
              </div>
              <button className="btn" onClick={handlePurgeEmptyCategories}>Purge empty categories</button>
              <div className="danger-delete">
                <div className="field">
                  <label className="field-label">Type "{companyName || 'DELETE'}" to confirm</label>
                  <input
                    className="field-input"
                    value={dangerConfirm}
                    onChange={(e) => setDangerConfirm(e.target.value)}
                    placeholder={companyName || 'DELETE'}
                  />
                </div>
                <button className="btn btn-danger" onClick={handleDeleteAllRebuttals} disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Delete ALL rebuttals'}
                </button>
                {deleteProgress && <div className="progress-text">{deleteProgress}</div>}
                <button className="btn btn-danger" onClick={handleDeleteArchivedOnly} disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Delete archived rebuttals only'}
                </button>
                <button className="btn" onClick={handleRestoreArchivedToActive} disabled={isUnarchiving}>
                  {isUnarchiving ? 'Restoring…' : 'Restore all archived to active'}
                </button>
                {unarchiveProgress && <div className="progress-text">{unarchiveProgress}</div>}
              </div>
            </div>
          </div>
        </section>

        

        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🧩</span>
            <h3 className="settings-card-title">Features</h3>
          </div>
          <div className="settings-card-body">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.enableRebuttals}
                onChange={(e) => updateSetting('enableRebuttals', e.target.checked)}
              />
              <span>Enable Rebuttals</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.enableCustomerService}
                onChange={(e) => updateSetting('enableCustomerService', e.target.checked)}
              />
              <span>Enable Customer Service</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.enableFAQ}
                onChange={(e) => updateSetting('enableFAQ', e.target.checked)}
              />
              <span>Enable FAQ</span>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">📞</span>
            <h3 className="settings-card-title">Contact & Address</h3>
          </div>
          <div className="settings-card-body">
            <div className="field">
              <label className="field-label">Phone</label>
              <input
                className="field-input"
                value={settings.companyPhone}
                onChange={(e) => updateSetting('companyPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                className="field-input"
                type="email"
                value={settings.companyEmail}
                onChange={(e) => updateSetting('companyEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
            <div className="field">
              <label className="field-label">Website</label>
              <input
                className="field-input"
                type="url"
                value={settings.companyWebsite}
                onChange={(e) => updateSetting('companyWebsite', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="field">
              <label className="field-label">HQ Address</label>
              <textarea
                className="field-input"
                rows="3"
                value={settings.hqAddress}
                onChange={(e) => updateSetting('hqAddress', e.target.value)}
                placeholder="123 Main St, City, ST 12345"
              />
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🗺️</span>
            <h3 className="settings-card-title">Service Areas</h3>
          </div>
          <div className="settings-card-body">
            <div className="field">
              <label className="field-label">ZIPs/States (comma or newline separated)</label>
              <textarea
                className="field-input"
                rows="4"
                value={settings.serviceAreasText}
                onChange={(e) => updateSetting('serviceAreasText', e.target.value)}
                placeholder={'DC, MD, VA\n20001, 20002, 22202'}
              />
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">⏰</span>
            <h3 className="settings-card-title">Business Hours</h3>
          </div>
          <div className="settings-card-body">
            <div className="field">
              <label className="field-label">Hours note</label>
              <textarea
                className="field-input"
                rows="3"
                value={settings.businessHoursNote}
                onChange={(e) => updateSetting('businessHoursNote', e.target.value)}
                placeholder={'Mon–Fri 8am–6pm, Sat 9am–1pm, Sun closed'}
              />
            </div>
          </div>
        </section>

        

        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🤝</span>
            <h3 className="settings-card-title">CRM & Integrations</h3>
          </div>
          <div className="settings-card-body">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.enableSalesforce}
                onChange={(e) => updateSetting('enableSalesforce', e.target.checked)}
              />
              <span>Enable Salesforce sync</span>
            </label>
            <div className="field">
              <label className="field-label">Salesforce webhook URL</label>
              <input
                className="field-input"
                type="url"
                value={settings.salesforceWebhookUrl}
                onChange={(e) => updateSetting('salesforceWebhookUrl', e.target.value)}
                placeholder="/api/sendToSalesforce"
              />
            </div>
            <div className="field">
              <label className="field-label">Salesforce auth token</label>
              <input
                className="field-input"
                value={settings.salesforceAuthToken}
                onChange={(e) => updateSetting('salesforceAuthToken', e.target.value)}
                placeholder="token or key"
              />
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🛠️</span>
            <h3 className="settings-card-title">Maintenance Mode</h3>
          </div>
          <div className="settings-card-body">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.enableMaintenanceMode}
                onChange={(e) => updateSetting('enableMaintenanceMode', e.target.checked)}
              />
              <span>Enable maintenance mode for this company</span>
            </label>
            <div className="field">
              <label className="field-label">Maintenance message</label>
              <input
                className="field-input"
                value={settings.maintenanceMessage}
                onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                placeholder="We'll be back soon."
              />
            </div>
          </div>
        </section>

        
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave}>Save changes</button>
        {status && <span className="save-status">{status}</span>}
      </div>
    </div>
  );
};

export default AdminSettings;

