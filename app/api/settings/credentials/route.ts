import { NextResponse } from "next/server";
import { EnableBankingClient } from "@/lib/enable-banking";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const client = new EnableBankingClient();
    const status = client.getConfigurationStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { appId, keyId, redirectUrl } = await req.json();

    if (!appId) {
      return NextResponse.json({ error: "Application ID skal udfyldes." }, { status: 400 });
    }

    const effectiveKeyId = keyId && keyId.trim() !== "" ? keyId.trim() : appId.trim();
    const envPath = path.resolve(".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    // Replace or add ENABLE_BANKING_APP_ID and ENABLE_BANKING_KEY_ID
    if (envContent.includes("ENABLE_BANKING_APP_ID=")) {
      envContent = envContent.replace(/ENABLE_BANKING_APP_ID=.*/g, `ENABLE_BANKING_APP_ID="${appId.trim()}"`);
    } else {
      envContent += `\nENABLE_BANKING_APP_ID="${appId.trim()}"`;
    }

    if (envContent.includes("ENABLE_BANKING_KEY_ID=")) {
      envContent = envContent.replace(/ENABLE_BANKING_KEY_ID=.*/g, `ENABLE_BANKING_KEY_ID="${effectiveKeyId}"`);
    } else {
      envContent += `\nENABLE_BANKING_KEY_ID="${effectiveKeyId}"`;
    }

    if (redirectUrl && redirectUrl.trim() !== "") {
      if (envContent.includes("ENABLE_BANKING_REDIRECT_URL=")) {
        envContent = envContent.replace(/ENABLE_BANKING_REDIRECT_URL=.*/g, `ENABLE_BANKING_REDIRECT_URL="${redirectUrl.trim()}"`);
      } else {
        envContent += `\nENABLE_BANKING_REDIRECT_URL="${redirectUrl.trim()}"`;
      }
      process.env.ENABLE_BANKING_REDIRECT_URL = redirectUrl.trim();
    }

    fs.writeFileSync(envPath, envContent, "utf8");

    // Also update process.env in memory
    process.env.ENABLE_BANKING_APP_ID = appId.trim();
    process.env.ENABLE_BANKING_KEY_ID = effectiveKeyId;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
