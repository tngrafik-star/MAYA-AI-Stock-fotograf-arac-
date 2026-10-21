// Links existing Lemon Squeezy subscriptions to profiles that were created
// before the billing migration (lemon_subscription_id was not stored then).
//
//   node scripts/backfill-lemon-subscriptions.js          # dry run, prints the plan
//   node scripts/backfill-lemon-subscriptions.js --apply  # writes to Supabase
//
// Needs LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, VITE_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY and the LEMON_SQUEEZY_VARIANT_* ids in .env.
// Profiles are matched by the subscription's customer email.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, planFromVariant } from '../lib/billing.js';

dotenv.config();

const apply = process.argv.includes('--apply');
const required = ['LEMON_SQUEEZY_API_KEY', 'LEMON_SQUEEZY_STORE_ID', 'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing env: ${missing.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Prefer the subscription that still grants access when a customer has several
const STATUS_RANK = { active: 0, on_trial: 1, past_due: 2, cancelled: 3, paused: 4, unpaid: 5, expired: 6 };

async function fetchSubscriptions() {
  const subscriptions = [];
  let url = `https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]=${encodeURIComponent(process.env.LEMON_SQUEEZY_STORE_ID)}&page[size]=100`;
  while (url) {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.api+json",
        "Authorization": `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
      }
    });
    if (!response.ok) {
      throw new Error(`Lemon Squeezy API ${response.status}: ${await response.text()}`);
    }
    const body = await response.json();
    subscriptions.push(...(body.data || []));
    url = body.links?.next || null;
  }
  return subscriptions;
}

async function main() {
  const subscriptions = await fetchSubscriptions();
  console.log(`Found ${subscriptions.length} Lemon Squeezy subscriptions.`);

  const bestByEmail = new Map();
  for (const sub of subscriptions) {
    const email = (sub.attributes.user_email || '').trim().toLowerCase();
    if (!email) continue;
    const current = bestByEmail.get(email);
    const rank = STATUS_RANK[sub.attributes.status] ?? 9;
    if (!current || rank < (STATUS_RANK[current.attributes.status] ?? 9)) {
      bestByEmail.set(email, sub);
    }
  }

  let linked = 0;
  for (const [email, sub] of bestByEmail) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, plan, lemon_subscription_id')
      .ilike('email', email);

    if (error) throw error;
    if (!profiles || profiles.length !== 1) {
      console.warn(`⚠️ ${email}: ${profiles?.length || 0} matching profiles, skipped.`);
      continue;
    }

    const profile = profiles[0];
    if (profile.lemon_subscription_id) {
      continue;
    }

    const attrs = sub.attributes;
    const plan = planFromVariant(attrs.variant_id);
    const updates = {
      lemon_subscription_id: String(sub.id),
      lemon_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
      subscription_status: attrs.status,
      subscription_ends_at: attrs.ends_at || null
    };
    if (attrs.status === 'expired') {
      updates.plan = 'free';
      updates.generations_limit = PLAN_LIMITS.free;
    } else if (plan) {
      updates.plan = plan;
      updates.generations_limit = PLAN_LIMITS[plan];
    }

    console.log(`${apply ? '✅' : '→'} ${email}: subscription ${sub.id} (${attrs.status}), plan ${profile.plan} → ${updates.plan || profile.plan}`);
    if (apply) {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (updateError) {
        console.error(`❌ ${email}: ${updateError.message}`);
        continue;
      }
    }
    linked++;
  }

  console.log(apply ? `Linked ${linked} profiles.` : `Dry run: ${linked} profiles would be linked. Re-run with --apply to write.`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
