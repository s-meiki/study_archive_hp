import ContactForm from "./contact-form";

const contactGuidance = [
  {
    title: "対象",
    body: "勉強会アーカイブ、掲載資料、運用上の確認事項に関する連絡を受け付けます。"
  },
  {
    title: "返信",
    body: "内容確認後、必要に応じて担当者からメールで連絡します。"
  },
  {
    title: "注意事項",
    body: "個人情報や症例情報は最小限に留め、匿名化されていない情報は記載しないでください。"
  }
];

const contactNotes = [
  {
    title: "フォーム送信",
    body: "Cloudflare Turnstile によるボット判定後、Discord Webhook に問い合わせ内容を通知します。"
  },
  {
    title: "推奨内容",
    body: "該当ページ URL、対象の開催日、確認したい内容を含めると対応しやすくなります。"
  }
];

export default function ContactPage() {
  const siteKey = process.env.NEXT_PUBLIC_CF_SITE_KEY ?? "";

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <div className="brand-copy">
            <span className="brand-label">Clinical Academic Working Group</span>
            <span className="brand-name">臨床学術ワーキンググループ</span>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="topbar-link" href="/index.html">
            アーカイブ一覧へ
          </a>
          <a className="topbar-link" href="/annual-meetings-2026.html">
            学会年会一覧へ
          </a>
        </div>
      </header>

      <main className="contact-main">
        <section className="hero contact-hero" aria-labelledby="contact-title">
          <div className="panel contact-hero-copy">
            <div className="eyebrow">Contact</div>
            <div className="hero-brandline">公開アーカイブに関する連絡窓口</div>
            <h1 id="contact-title">
              内容確認が必要な点を、
              <br />
              ここから送る。
            </h1>
            <p className="lead">
              掲載情報の修正依頼、運用連絡、公開ページに関する問い合わせを受け付けます。
              送信内容は担当者向けの Discord 通知として共有されます。
            </p>
            <div className="hero-stats" aria-label="問い合わせフォームの概要">
              <span className="stat-chip">項目: 氏名 / メール / 内容</span>
              <span className="stat-chip">Bot Check: Cloudflare Turnstile</span>
              <span className="stat-chip">通知先: Discord Webhook</span>
            </div>
          </div>

          <aside className="panel contact-side-panel" aria-labelledby="contact-side-heading">
            <div>
              <div className="section-kicker">Guidance</div>
              <h2 id="contact-side-heading">送信前に確認してほしいこと</h2>
              <p>既存の教育用コンテンツ方針に合わせ、問い合わせ時も匿名化と情報最小化を前提にします。</p>
            </div>
            <ul className="contact-side-list">
              {contactGuidance.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <div className="notice" role="note">
          <strong>運用メモ</strong>
          <span>医療相談の受付窓口ではありません。学術アーカイブに関する内容に限定して利用してください。</span>
        </div>

        <section className="contact-grid">
          <div className="panel contact-panel">
            <div className="section-kicker">Contact Form</div>
            <h2>問い合わせフォーム</h2>
            <p>入力後に Turnstile 認証を完了すると送信できます。送信成否はこの画面上に表示します。</p>
            <ContactForm siteKey={siteKey} />
          </div>

          <aside className="panel contact-side-panel" aria-labelledby="contact-note-heading">
            <div>
              <div className="section-kicker">Notes</div>
              <h2 id="contact-note-heading">処理の流れ</h2>
              <p>サーバー側で Turnstile を検証し、通過した内容だけを Discord Webhook に転送します。</p>
            </div>
            <div className="contact-help">
              {contactNotes.map((item) => (
                <div className="contact-help-card" key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
