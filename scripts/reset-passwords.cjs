#!/usr/bin/env node
/* scripts/reset-passwords.cjs

Generates strong passwords (unless provided via env vars) and sets them for
admin@longhome.com, companyadmin@longhome.com, superadmin@longhome.com using
the Firebase Admin SDK and the service-account JSON in the repo.

USAGE:
  GENERATE=1 node scripts/reset-passwords.cjs   # generate strong passwords
  ADMIN_PASS=... COMPANY_PASS=... SUPER_PASS=... node scripts/reset-passwords.cjs

Do NOT commit any passwords. This script prints the new passwords to stdout only.
*/

const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');

// Service account path (relative to repository root)
const serviceAccountPath = path.resolve(__dirname, '..', 'long-home-c034d-firebase-adminsdk-fbsvc-2f4753ff70.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('Failed to load service account JSON at', serviceAccountPath);
  console.error(err.message);
  process.exit(1);
}

function genPassword(length = 20) {
  // safe URL-friendly base64 without +/=
  return crypto.randomBytes(Math.ceil(length * 3 / 4)).toString('base64').replace(/\+/g,'A').replace(/\//g,'B').replace(/=/g,'C').slice(0, length);
}

const accounts = [
  { email: 'admin@longhome.com', env: 'ADMIN_PASS' },
  { email: 'companyadmin@longhome.com', env: 'COMPANY_PASS' },
  { email: 'superadmin@longhome.com', env: 'SUPER_PASS' },
];

(async () => {
  // Determine passwords
  const out = {};
  for (const a of accounts) {
    let pass = process.env[a.env];
    if (!pass) {
      // If GENERATE=1 or no env var provided, generate a strong password.
      pass = genPassword(24);
    }
    out[a.email] = pass;
  }

  console.log('\nSetting passwords for the following users:');
  for (const e of Object.keys(out)) console.log(' -', e);
  console.log('\nNew passwords will be printed below. Copy them securely; do NOT commit them to git.');

  const results = [];
  for (const a of accounts) {
    try {
      const user = await admin.auth().getUserByEmail(a.email);
      await admin.auth().updateUser(user.uid, { password: out[a.email] });
      results.push({ email: a.email, ok: true, uid: user.uid });
      console.log(`\n✅ ${a.email} (uid=${user.uid}) updated. New password: ${out[a.email]}`);
    } catch (err) {
      results.push({ email: a.email, ok: false, error: err.message });
      console.error(`\n❌ ${a.email} error:`, err.message);
    }
  }

  console.log('\nSummary:');
  for (const r of results) {
    if (r.ok) console.log(` - ${r.email}: success`);
    else console.log(` - ${r.email}: FAILED (${r.error})`);
  }

  console.log('\nDone.');
  process.exit(0);
})();
