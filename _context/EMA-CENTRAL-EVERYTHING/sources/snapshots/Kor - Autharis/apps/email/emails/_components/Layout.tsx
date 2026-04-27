import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * Shared Layout for every Autharis transactional email.
 *
 * Token colors mirrored from `@autharis/tokens` (packages/tokens/src/index.ts).
 * We inline hex here rather than importing because react-email renders in a
 * context that has no CSS variable runtime — `var(--accent)` would not resolve
 * inside an email client, so the brand palette is flattened to literal hex.
 */
export const tokens = {
  // Brand
  brandInk: "#0A0A0B",
  brandInk2: "#1A1A1D",
  brandPaper: "#F6F5F0",
  brandCream: "#EDEBE0",
  brandTerra: "#E8552B",
  brandLime: "#D4F755",
  brandMoss: "#5C8F3A",
  brandSky: "#4B8FC9",
  brandRose: "#F2B5A0",

  // Ink
  ink: "#111113",
  ink2: "#333338",
  ink3: "#555560",
  ink4: "#8A8A92",

  // Lines
  line: "#D9D7CE",
  lineSoft: "#E6E4DA",

  // Semantic
  pos: "#3E7A2A",
  neg: "#C13A22",
  warn: "#B07C0E",

  // Accent
  accent: "#E8552B", // brandTerra
  accentInk: "#FFFFFF",
} as const;

export const fonts = {
  body: "'Geist', 'Inter Tight', system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
  display: "'Inter Tight', 'Geist', system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

const styles = {
  main: {
    backgroundColor: tokens.brandPaper,
    fontFamily: fonts.body,
    color: tokens.ink,
    margin: 0,
    padding: 0,
  } as React.CSSProperties,
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "24px 16px",
    width: "100%",
  } as React.CSSProperties,
  card: {
    backgroundColor: "#FFFFFF",
    border: `1px solid ${tokens.lineSoft}`,
    borderRadius: "14px",
    padding: "32px 28px",
  } as React.CSSProperties,
  header: {
    padding: "8px 4px 20px",
  } as React.CSSProperties,
  wordmark: {
    fontFamily: fonts.display,
    fontSize: "20px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: tokens.brandInk,
    textDecoration: "none",
  } as React.CSSProperties,
  wordmarkDot: {
    color: tokens.brandTerra,
  } as React.CSSProperties,
  footer: {
    padding: "24px 4px 8px",
    color: tokens.ink4,
    fontSize: "12px",
    lineHeight: "18px",
  } as React.CSSProperties,
  footerLink: {
    color: tokens.ink3,
    textDecoration: "underline",
  } as React.CSSProperties,
  hr: {
    borderColor: tokens.lineSoft,
    borderTop: `1px solid ${tokens.lineSoft}`,
    margin: "20px 0",
  } as React.CSSProperties,
  h1: {
    fontFamily: fonts.display,
    fontSize: "26px",
    lineHeight: "32px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: tokens.ink,
    margin: "0 0 12px",
  } as React.CSSProperties,
  p: {
    fontSize: "15px",
    lineHeight: "22px",
    color: tokens.ink2,
    margin: "0 0 14px",
  } as React.CSSProperties,
  muted: {
    fontSize: "13px",
    lineHeight: "20px",
    color: tokens.ink3,
    margin: "0 0 10px",
  } as React.CSSProperties,
  ctaSection: {
    padding: "8px 0 4px",
  } as React.CSSProperties,
  button: {
    backgroundColor: tokens.accent,
    color: tokens.accentInk,
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 20px",
    borderRadius: "999px",
    textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,
  kvLabel: {
    fontSize: "12px",
    color: tokens.ink4,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    margin: "0 0 2px",
  } as React.CSSProperties,
  kvValue: {
    fontSize: "15px",
    color: tokens.ink,
    margin: "0 0 12px",
    fontWeight: 500,
  } as React.CSSProperties,
};

export interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Link href="https://autharis.com" style={styles.wordmark}>
              Autharis<span style={styles.wordmarkDot}>.</span>
            </Link>
          </Section>
          <Section style={styles.card}>{children}</Section>
          <Section style={styles.footer}>
            <Text style={{ margin: "0 0 6px", color: tokens.ink4, fontSize: "12px" }}>
              You're receiving this because you have an account on Autharis.
            </Text>
            <Text style={{ margin: "0", color: tokens.ink4, fontSize: "12px" }}>
              <Link href="https://autharis.com/settings/notifications" style={styles.footerLink}>
                Manage notifications
              </Link>
              {"  ·  "}
              <Link href="https://autharis.com/help" style={styles.footerLink}>
                Help
              </Link>
              {"  ·  "}
              Autharis, Inc.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export interface CTAProps {
  href: string;
  label: string;
}

export function CTA({ href, label }: CTAProps) {
  return (
    <Section style={styles.ctaSection}>
      <Button href={href} style={styles.button}>
        {label}
      </Button>
    </Section>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </>
  );
}

export function Divider() {
  return <Hr style={styles.hr} />;
}

export { styles as layoutStyles };
