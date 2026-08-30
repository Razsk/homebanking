import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST() {
  try {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const privPath = path.resolve("./private.key");
    const pubPath = path.resolve("./public.key");

    fs.writeFileSync(privPath, privateKey, "utf8");
    fs.writeFileSync(pubPath, publicKey, "utf8");

    return NextResponse.json({
      success: true,
      publicKey: publicKey,
      message: "Nyt RSA-2048 nøglepar genereret. Husk at uploade den nye public.key til Enable Banking.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
