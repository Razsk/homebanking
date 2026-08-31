import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const pubPath = path.resolve('./public.key');
    const crtPath = path.resolve('./public.crt');
    const privPath = path.resolve('./private.key');

    return NextResponse.json({
      publicKey: fs.existsSync(pubPath) ? fs.readFileSync(pubPath, 'utf8') : '',
      certificate: fs.existsSync(crtPath) ? fs.readFileSync(crtPath, 'utf8') : '',
      hasPrivateKey: fs.existsSync(privPath),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { publicKey, certificate, privateKey } = await req.json();

    const pubPath = path.resolve('./public.key');
    const crtPath = path.resolve('./public.crt');
    const privPath = path.resolve('./private.key');

    if (publicKey && typeof publicKey === "string" && publicKey.trim()) {
      fs.writeFileSync(pubPath, `${publicKey.trim()}\n`, "utf8");
    }

    if (certificate && typeof certificate === "string" && certificate.trim()) {
      fs.writeFileSync(crtPath, `${certificate.trim()}\n`, "utf8");
    }

    if (privateKey && typeof privateKey === "string" && privateKey.trim()) {
      fs.writeFileSync(privPath, `${privateKey.trim()}\n`, "utf8");
    }

    return NextResponse.json({
      success: true,
      message: 'Nøgler og certifikater er opdateret i projektet!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
