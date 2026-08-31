const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("Genererer RSA-4096 nøglepar og X.509 certifikat til Enable Banking...");

let openssl = "openssl";
const gitOpenssl = "C:\\Program Files\\Git\\usr\\bin\\openssl.exe";
if (fs.existsSync(gitOpenssl)) {
  openssl = `"${gitOpenssl}"`;
}

try {
  // 1. Generate 4096-bit RSA private key
  execSync(`${openssl} genrsa -out private.key 4096`, { stdio: "inherit" });

  // 2. Generate self-signed public certificate (X.509)
  execSync(
    `${openssl} req -new -x509 -days 3650 -key private.key -out public.crt -subj "/C=DK/ST=Hovedstaden/L=Copenhagen/O=SavantHomebanking/CN=homebanking.local"`,
    { stdio: "inherit" }
  );

  // 3. Extract public.key
  execSync(`${openssl} rsa -in private.key -pubout -out public.key`, { stdio: "inherit" });

  console.log("\n✓ Genereret private.key (4096-bit RSA, gemmes lokalt)");
  console.log("✓ Genereret public.crt (X.509 Certifikat til Enable Banking)");
  console.log("✓ Genereret public.key (Public Key PEM)");
  console.log("\n--- Offentligt Certifikat (public.crt) ---\n");
  console.log(fs.readFileSync("public.crt", "utf8"));
} catch (err) {
  console.error("Fejl ved generering:", err.message);
}
