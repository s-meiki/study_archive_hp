import type { ReactNode } from "react";
import SiteFooter from "./site-footer";
import { siteLegal, siteNavigation } from "./site-legal";

type LegalStat = {
  label: string;
  value: string;
};

type LegalSummaryCard = {
  title: string;
  description: string;
};

type LegalMetaItem = {
  label: string;
  value: ReactNode;
};

type LegalNavItem = {
  href: string;
  label: string;
};

type LegalLinkItem = {
  href: string;
  label: string;
  external?: boolean;
};

type LegalLinkGroup = {
  kicker: string;
  title: string;
  links: LegalLinkItem[];
};

type LegalPageShellProps = {
  children: ReactNode;
  heroClassName?: string;
  intro: string;
  linkGroups: LegalLinkGroup[];
  metaItems: LegalMetaItem[];
  navItems: LegalNavItem[];
  pageLabel: string;
  stats: LegalStat[];
  summaryCards: LegalSummaryCard[];
  title: string;
  titleId: string;
};

export default function LegalPageShell({
  children,
  heroClassName,
  intro,
  linkGroups,
  metaItems,
  navItems,
  pageLabel,
  stats,
  summaryCards,
  title,
  titleId
}: LegalPageShellProps) {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <div className="brand-copy">
            <span className="brand-label">Clinical Academic Working Group</span>
            <span className="brand-name">{siteLegal.shortSiteName}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="topbar-link" href={siteNavigation.archiveUrl}>
            アーカイブ一覧へ
          </a>
          <a className="topbar-link" href={siteNavigation.annualMeetingsUrl}>
            学会年会一覧へ
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main className="legal-main">
        <section className={`panel legal-panel legal-hero${heroClassName ? ` ${heroClassName}` : ""}`} aria-labelledby={titleId}>
          <div className="section-kicker">{pageLabel}</div>
          <h1 id={titleId}>{title}</h1>
          <p className="legal-copy legal-hero-copy">{intro}</p>
          <div className="legal-stat-grid" aria-label={`${title}の基本情報`}>
            {stats.map((stat) => (
              <div className="legal-stat-card" key={stat.label}>
                <span className="legal-stat-label">{stat.label}</span>
                <strong className="legal-stat-value">{stat.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="legal-summary-grid" aria-label={`${title}の要点`}>
          {summaryCards.map((card) => (
            <article className="panel legal-summary-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </article>
          ))}
        </section>

        <section className="legal-grid">
          <article className="panel legal-article">{children}</article>

          <aside className="legal-sidebar" aria-label="補助情報">
            <div className="legal-sidebar-rail">
              <section className="panel legal-panel legal-sidebar-panel">
                <div className="section-kicker">Overview</div>
                <h2>基本情報</h2>
                <dl className="legal-meta-list">
                  {metaItems.map((item) => (
                    <div className="legal-meta-row" key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <nav className="panel legal-panel legal-sidebar-panel" aria-label="ページ内目次">
                <div className="section-kicker">In This Page</div>
                <h2>目次</h2>
                <ul className="legal-nav-list">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <a href={item.href}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>

              {linkGroups.map((group) => (
                <section className="panel legal-panel legal-sidebar-panel" key={group.title}>
                  <div className="section-kicker">{group.kicker}</div>
                  <h2>{group.title}</h2>
                  <div className="legal-link-list">
                    {group.links.map((link) => (
                      <a
                        href={link.href}
                        key={link.href}
                        rel={link.external ? "noreferrer noopener" : undefined}
                        target={link.external ? "_blank" : undefined}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
