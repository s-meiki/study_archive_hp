import ContactForm from "./contact-form";

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
        <section className="contact-simple" aria-labelledby="contact-title">
          <div className="panel contact-panel contact-simple-panel">
            <div className="section-kicker">Contact Form</div>
            <h1 id="contact-title">問い合わせ</h1>
            <p className="contact-simple-copy">
              勉強会アーカイブに関する連絡だけを受け付けます。内容確認後、必要に応じてメールで返信します。
            </p>
            <div className="notice contact-simple-note" role="note">
              <strong>注意</strong>
              <span>個人情報や匿名化されていない症例情報は入力しないでください。</span>
            </div>
            <ContactForm siteKey={siteKey} />
          </div>
        </section>
      </main>
    </div>
  );
}
