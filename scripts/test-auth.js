const fs = require('fs');
const jwt = require('jsonwebtoken');

let envText = '';
try { envText = fs.readFileSync('.env', 'utf8'); } catch (e) {}
const env = {};
envText.split('\n').forEach((line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k && !k.startsWith("#")) env[k] = v;
  }
});

const appId = env.ENABLE_BANKING_APP_ID;
const keyId = env.ENABLE_BANKING_KEY_ID || appId;
const redirectUrl = env.ENABLE_BANKING_REDIRECT_URL;
const privKey = fs.readFileSync("./private.key", "utf8");

const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: "enablebanking.com",
  aud: "api.enablebanking.com",
  iat: now,
  exp: now + 3600,
};

const token = jwt.sign(payload, privKey, {
  algorithm: "RS256",
  keyid: keyId,
});

console.log('Using App ID / Key ID:', keyId);
console.log('Using Redirect URL:', redirectUrl);

const validUntil = new Date(Date.now() + 179 * 24 * 60 * 60 * 1000).toISOString();
const body = JSON.stringify({
  access: { valid_until: validUntil },
  aspsp: { name: 'Nordea', country: 'DK' },
  redirect_url: redirectUrl,
  state: 'test_state',
});

fetch("https://api.enablebanking.com/accounts/9da0a936-7d64-4d93-9ce9-4e6dee0ac0d3", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
})
  .then(async (res) => {
    console.log("Account HTTP Status:", res.status);
    const text = await res.text();
    console.log("Account response:", text);
  })
  .catch((err) => {
    console.error("Fetch error:", err);
  });

fetch("https://api.enablebanking.com/accounts/9da0a936-7d64-4d93-9ce9-4e6dee0ac0d3/balances", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
})
  .then(async (res) => {
    console.log("Balances HTTP Status:", res.status);
    const text = await res.text();
    console.log("Balances response:", text);
  });

fetch("https://api.enablebanking.com/accounts/9da0a936-7d64-4d93-9ce9-4e6dee0ac0d3/transactions", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
})
  .then(async (res) => {
    console.log("Transactions HTTP Status:", res.status);
    const text = await res.text();
    console.log("Transactions response:", text);
  });
