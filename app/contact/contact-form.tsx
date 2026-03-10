"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";

type ContactFormProps = {
  siteKey: string;
};

type SubmitState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: (errorCode?: string | number) => boolean | void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const initialState: SubmitState = {
  type: "idle",
  message: ""
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "送信に失敗しました。時間をおいて再度お試しください。";
}

function getTurnstileErrorMessage(errorCode?: string | number) {
  const normalizedCode = typeof errorCode === "number" ? String(errorCode) : errorCode ?? "";
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  switch (normalizedCode) {
    case "110100":
    case "110110":
    case "400020":
      return "Turnstile の site key 設定が不正です。Cloudflare Turnstile の widget 設定を確認してください。";
    case "110200":
      return `このドメイン (${hostname}) は Turnstile で許可されていません。Cloudflare Turnstile の Hostname Management に追加してください。`;
    case "400070":
      return "Turnstile の site key が無効化されています。Cloudflare Turnstile の widget 設定を確認してください。";
    case "200500":
      return "Turnstile の iframe 読み込みに失敗しました。広告ブロッカー、VPN、ネットワーク制限を確認してください。";
    default: {
      if (normalizedCode.startsWith("300") || normalizedCode.startsWith("600")) {
        return "Turnstile のチャレンジに失敗しました。ページを再読み込みするか、別ブラウザや別ネットワークでお試しください。";
      }

      if (normalizedCode.startsWith("110")) {
        return `Turnstile の設定エラーです。Cloudflare 側の設定を確認してください。${normalizedCode ? ` (code: ${normalizedCode})` : ""}`;
      }

      if (normalizedCode.startsWith("200")) {
        return `Turnstile の読み込みに失敗しました。拡張機能、VPN、ネットワーク制限を確認してください。${normalizedCode ? ` (code: ${normalizedCode})` : ""}`;
      }

      return `Turnstile の読み込みに失敗しました。ページを再読み込みして再度お試しください。${normalizedCode ? ` (code: ${normalizedCode})` : ""}`;
    }
  }
}

export default function ContactForm({ siteKey }: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(initialState);

  useEffect(() => {
    if (!siteKey || !isScriptReady || !widgetContainerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (nextToken) => {
        setToken(nextToken);
        setSubmitState((currentState) => {
          if (currentState.type === "error" && currentState.message === "Turnstile 認証を完了してください。") {
            return initialState;
          }

          return currentState;
        });
      },
      "expired-callback": () => {
        setToken("");
      },
      "error-callback": (errorCode) => {
        setToken("");
        setSubmitState({
          type: "error",
          message: getTurnstileErrorMessage(errorCode)
        });
        return true;
      }
    });

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [isScriptReady, siteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!siteKey) {
      setSubmitState({
        type: "error",
        message: "Turnstile のサイトキーが設定されていません。"
      });
      return;
    }

    if (!token) {
      setSubmitState({
        type: "error",
        message: "Turnstile 認証を完了してください。"
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState(initialState);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          message,
          token
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        ok?: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "送信に失敗しました。");
      }

      setName("");
      setEmail("");
      setMessage("");
      setToken("");
      setSubmitState({
        type: "success",
        message: "送信しました。担当者が内容を確認します。"
      });
      formRef.current?.reset();
      window.turnstile?.reset(widgetIdRef.current ?? undefined);
    } catch (error) {
      setToken("");
      setSubmitState({
        type: "error",
        message: getErrorMessage(error)
      });
      window.turnstile?.reset(widgetIdRef.current ?? undefined);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
        onError={() => {
          setSubmitState({
            type: "error",
            message: "Turnstile のスクリプト読み込みに失敗しました。通信制限や広告ブロッカーを確認してください。"
          });
        }}
      />

      <form className="contact-form" ref={formRef} onSubmit={handleSubmit}>
        <div className="contact-field">
          <label htmlFor="contact-name">お名前</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="例: 山田 太郎"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">メールアドレス</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="example@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">お問い合わせ内容</label>
          <textarea
            id="contact-message"
            name="message"
            placeholder="対象ページや確認したい点を記載してください"
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>

        <div className="contact-turnstile">
          <span>ボット判定</span>
          <div className="contact-turnstile-shell">
            <div ref={widgetContainerRef} />
          </div>
        </div>

        {submitState.type !== "idle" ? (
          <div
            className={`contact-feedback ${submitState.type === "success" ? "is-success" : "is-error"}`}
            role={submitState.type === "error" ? "alert" : "status"}
          >
            {submitState.message}
          </div>
        ) : null}

        <div className="contact-actions">
          <button className="button button-primary contact-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "送信する"}
          </button>
          <span className="archive-note">送信前に Turnstile 認証を完了してください。</span>
        </div>
      </form>
    </>
  );
}
