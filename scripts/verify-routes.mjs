import { existsSync } from 'fs';
import { resolve } from 'path';

const CRITICAL_ROUTES = [
  'src/app/i/[slug]/page.tsx',
  'src/app/invite/[inviteId]/page.tsx',
  'src/app/invite/[inviteId]/admin/page.tsx',
  'src/app/invite/[inviteId]/admin/dashboard/page.tsx',
  'src/app/invitation/[id]/page.tsx',
  'src/app/api/rsvp/route.ts',
  'src/app/api/guestbook/route.ts',
  'src/app/api/invite/[inviteId]/route.ts',
];

const missing = [];

for (const route of CRITICAL_ROUTES) {
  const fullPath = resolve(route);
  if (existsSync(fullPath)) {
    console.log(`  OK  ${route}`);
  } else {
    console.log(`  MISSING  ${route}`);
    missing.push(route);
  }
}

console.log('');

if (missing.length > 0) {
  console.log(`FAILED - ${missing.length} critical route(s) missing:`);
  for (const m of missing) {
    console.log(`  - ${m}`);
  }
  process.exit(1);
} else {
  console.log(`OK - all ${CRITICAL_ROUTES.length} critical routes verified`);
}
