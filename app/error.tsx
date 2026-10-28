"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import styles from "./error.module.css";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    console.error("[page] render failed", error);
  }, [error]);

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <section className={styles.content} aria-labelledby="page-error-heading">
      <h1 id="page-error-heading">ページを読み込めませんでした</h1>
      <p>一時的な読み込みエラーが発生しました。時間をおいて再度お試しください。</p>
      <div className={styles.actions}>
        <Button onClick={retry} disabled={pending}>{pending ? "読み込み中…" : "もう一度読み込む"}</Button>
        <Button href="/" variant="secondary">トップページへ</Button>
      </div>
    </section>
  );
}
