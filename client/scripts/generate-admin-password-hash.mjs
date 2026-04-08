import { hashAdminPassword } from "../lib/admin/password.mjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/generate-admin-password-hash.mjs <password>");
  process.exit(1);
}

console.log(hashAdminPassword(password));
