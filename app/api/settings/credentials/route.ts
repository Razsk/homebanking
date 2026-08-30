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
    const { appId, keyId } = await req.json();

    if (!appId || !keyId) {
      return NextResponse.json({ error: "Både Application ID og Key ID skal udfyldes." }, { status: 400 });
    }

    const envPath = path.resolve(".env");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    // Replace or add ENABLE_BANKING_APP_ID and ENABLE_BANKING_KEY_ID
    if (envContent.includes("ENABLE_BANKING_APP_ID=")) {
      envContent = envContent.replace(/ENABLE_BANKING_APP_ID=.*/g, `ENABLE_BANKING_APP_ID="${appId.trim()}"`);
    } else {
      envContent += `\nENABLE_BANKING_APP_ID="${appId.trim()}"`;
    }

    if (envContent.includes("ENABLE_BANKING_KEY_ID=")) {
      envContent = envContent.replace(/ENABLE_BANKING_KEY_ID=.*/g, `ENABLE_BANKING_KEY_ID="${keyId.trim()}"`);
    } else {
      envContent += `\nENABLE_BANKING_KEY_ID="${keyId.trim()}"`;
    }

    fs.writeFileSync(envPath, envContent, "utf8");

    // Also update process.env in memory
    process.env.ENABLE_BANKING_APP_ID = appId.trim();
    process.env.ENABLE_BANKING_KEY_ID = keyId.trim();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
