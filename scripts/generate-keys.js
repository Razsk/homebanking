const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

console.log("Genererer RSA-2048 nøglepar til Enable Banking...");

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

const privPath = path.join(process.cwd(), "private.key");
const pubPath = path.join(process.cwd(), "public.key");

fs.writeFileSync(privPath, privateKey, "utf8");
fs.writeFileSync(pubPath, publicKey, "utf8");

console.log("✓ Genereret private.key (gemmes lokalt, må ALDRIG deles)");
console.log("✓ Genereret public.key (uploades til https://enablebanking.com dashboard)");
console.log("\nOffentlig nøgle (public.key):\n");
console.log(publicKey);
