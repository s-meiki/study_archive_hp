import type { ReactNode } from "react";
import { Card, CardHeader } from "../ui/card";
import { Stat } from "../ui/stat";
import styles from "./legal-page.module.css";

export type LegalStat = {
  label: string;
  value: ReactNode;
};

export type LegalSummaryCard = {
  title: string;
  description: string;
};

export type LegalMetaItem = {
  label: string;
  value: ReactNode;
};

export type LegalNavItem = {
  href: string;
  label: string;
};

export type LegalLinkItem = {
  href: string;
  label: string;
  external?: boolean;
};

export type LegalLinkGroup = {
  title: string;
  links: LegalLinkItem[];
};

type LegalPageProps = {
  children: ReactNode;
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

/** 利用規約・プライバシーポリシーで共用する法務ページシェル。 */
export function LegalPage({
  children,
  intro,
  linkGroups,
  metaItems,
  navItems,
  pageLabel,
  stats,
  summaryCards,
  title,
  titleId
}: LegalPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>{pageLabel}</p>
        <h1 id={titleId}>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </div>

      <section className={styles.statsRow} aria-label={`${title}の基本情報`}>
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <section className={styles.summaryGrid} aria-label={`${title}の要点`}>
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <h2 className={styles.summaryTitle}>{card.title}</h2>
            <p className={styles.summaryDescription}>{card.description}</p>
          </Card>
        ))}
      </section>

      <div className={styles.grid}>
        <Card className={styles.article}>{children}</Card>

        <aside className={styles.sidebar} aria-label="補助情報">
          <Card>
            <CardHeader title="目次" />
            <nav aria-label="ページ内目次">
              <ul className={styles.navList}>
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a className="text-link" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Card>

          <Card>
            <CardHeader title="基本情報" />
            <dl className={styles.metaList}>
              {metaItems.map((item) => (
                <div className={styles.metaRow} key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {linkGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader title={group.title} />
              <div className={styles.linkList}>
                {group.links.map((link) => (
                  <a
                    className="text-link"
                    href={link.href}
                    key={link.href}
                    rel={link.external ? "noreferrer noopener" : undefined}
                    target={link.external ? "_blank" : undefined}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
}

type LegalSectionProps = {
  children: ReactNode;
  id: string;
  index: string;
  lead?: string;
  title: string;
};

/** 条番号付きの本文セクション。法務本文の文言は呼び出し側で不変のまま渡す。 */
export function LegalSection({ children, id, index, lead, title }: LegalSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIndex} aria-hidden="true">
          {index}
        </span>
        <div className={styles.sectionHeadCopy}>
          <h2>{title}</h2>
          {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

type LegalDetailGridProps = {
  items: Array<{ label: string; value: ReactNode }>;
};

/** 「運営者情報」等の dt/dd 一覧。 */
export function LegalDetailGrid({ items }: LegalDetailGridProps) {
  return (
    <dl className={styles.detailGrid}>
      {items.map((item) => (
        <div className={styles.detailRow} key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type LegalReferenceLinksProps = {
  label: string;
  links: Array<{ href: string; label: string }>;
};

/** 外部サービスの参照先リンク一覧（プライバシーポリシー用）。 */
export function LegalReferenceLinks({ label, links }: LegalReferenceLinksProps) {
  return (
    <div className={styles.referenceBlock}>
      <span className={styles.referenceLabel}>{label}</span>
      <div className={styles.referenceLinks}>
        {links.map((link) => (
          <a className={styles.referenceLink} href={link.href} key={link.href} rel="noreferrer noopener" target="_blank">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
