import { headers } from "next/headers";
import { NextResponse } from "next/server";

type ContactPayload = {
  email?: unknown;
  message?: unknown;
  name?: unknown;
  token?: unknown;
};

type TurnstileResponse = {
  "error-codes"?: string[];
  success: boolean;
};

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 4000;
const DISCORD_DESCRIPTION_LIMIT = 3800;

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function verifyTurnstile(token: string, ipAddress: string | null) {
  const secretKey = process.env.CF_SECRET_KEY;

  if (!secretKey) {
    throw new Error("CF_SECRET_KEY is not configured.");
  }

  const requestBody = new URLSearchParams({
    secret: secretKey,
    response: token
  });

  if (ipAddress) {
    requestBody.set("remoteip", ipAddress);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: requestBody.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Turnstile verification request failed.");
  }

  return (await response.json()) as TurnstileResponse;
}

async function sendDiscordWebhook(name: string, email: string, message: string) {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("WEBHOOK_URL is not configured.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      allowed_mentions: {
        parse: []
      },
      embeds: [
        {
          title: "新しい問い合わせ",
          color: 3555932,
          description: truncate(message, DISCORD_DESCRIPTION_LIMIT),
          fields: [
            {
              name: "お名前",
              value: truncate(name, MAX_NAME_LENGTH),
              inline: true
            },
            {
              name: "メールアドレス",
              value: truncate(email, MAX_EMAIL_LENGTH),
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Webhook delivery failed.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload;
    const name = normalizeText(payload.name);
    const email = normalizeText(payload.email);
    const message = normalizeText(payload.message);
    const token = normalizeText(payload.token);

    if (!name || !email || !message || !token) {
      return NextResponse.json({ error: "未入力の項目があります。" }, { status: 400 });
    }

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "お名前は80文字以内で入力してください。" }, { status: 400 });
    }

    if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
      return NextResponse.json({ error: "メールアドレスの形式を確認してください。" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "お問い合わせ内容は4000文字以内で入力してください。" }, { status: 400 });
    }

    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const verificationResult = await verifyTurnstile(token, ipAddress);

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          error: "Turnstile 検証に失敗しました。再度お試しください。",
          turnstileErrors: verificationResult["error-codes"] ?? []
        },
        { status: 400 }
      );
    }

    await sendDiscordWebhook(name, email, message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] request failed", error);

    return NextResponse.json(
      {
        error: "送信に失敗しました。時間をおいて再度お試しください。"
      },
      { status: 500 }
    );
  }
}
