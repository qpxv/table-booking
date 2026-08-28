// Generates a fresh VAPID key pair for Web Push. Run once, then paste the
// output into .env (and the deployment's env vars):
//
//   npx tsx scripts/generate-vapid-keys.ts
//
// Regenerating the keys invalidates every existing PushSubscription row, so
// only do it deliberately.

import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("VAPID_PUBLIC_KEY=" + publicKey);
console.log("VAPID_PRIVATE_KEY=" + privateKey);
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + publicKey);
