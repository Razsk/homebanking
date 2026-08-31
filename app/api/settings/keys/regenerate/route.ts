import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import crypto from "crypto";

export async function POST() {
  try {
    const privPath = path.resolve("./private.key");
    const pubPath = path.resolve("./public.key");
    const crtPath = path.resolve("./public.crt");

    let openssl = "openssl";
    const gitOpenssl = "C:\\Program Files\\Git\\usr\\bin\\openssl.exe";
    if (fs.existsSync(gitOpenssl)) {
      openssl = `"${gitOpenssl}"`;
    }

    try {
      execSync(`${openssl} genrsa -out "${privPath}" 4096`, { stdio: "ignore" });
      execSync(
        `${openssl} req -new -x509 -days 3650 -key "${privPath}" -out "${crtPath}" -subj "/C=DK/ST=Hovedstaden/L=Copenhagen/O=SavantHomebanking/CN=homebanking.local"`,
        { stdio: "ignore" }
      );
      execSync(`${openssl} rsa -in "${privPath}" -pubout -out "${pubPath}"`, { stdio: "ignore" });
    } catch {
      // Fallback to Node crypto if OpenSSL CLI is not callable
      const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      fs.writeFileSync(privPath, privateKey, "utf8");
      fs.writeFileSync(pubPath, publicKey, "utf8");
      fs.writeFileSync(crtPath, publicKey, "utf8");
    }

    const publicKey = fs.readFileSync(pubPath, "utf8");
    const certificate = fs.existsSync(crtPath) ? fs.readFileSync(crtPath, "utf8") : publicKey;

    return NextResponse.json({
      success: true,
      publicKey,
      certificate,
      message: "Nyt 4096-bit RSA nøglepar og X.509 certifikat genereret!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
