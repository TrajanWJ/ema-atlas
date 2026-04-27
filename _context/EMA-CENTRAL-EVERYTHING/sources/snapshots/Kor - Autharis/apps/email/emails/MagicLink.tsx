import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  CTA,
  Divider,
  Heading,
  Layout,
  Muted,
  Paragraph,
  layoutStyles,
  tokens,
} from "./_components/Layout.js";

export interface MagicLinkProps {
  firstName?: string;
  magicUrl: string;
  requestIp?: string;
  requestUserAgent?: string;
  expiryMinutes?: number;
}

export const subject = "Your sign-in link for Autharis";

export const sampleProps: MagicLinkProps = {
  firstName: "Mira",
  magicUrl: "https://autharis.com/auth/magic?t=9f2b7c8a-ex-ex-ex-ex",
  requestIp: "198.51.100.42",
  requestUserAgent: "Chrome on macOS",
  expiryMinutes: 10,
};

export default function MagicLink(props: MagicLinkProps = sampleProps) {
  const { firstName, magicUrl, requestIp, requestUserAgent, expiryMinutes = 10 } = props;
  return (
    <Layout preview={`Sign in to Autharis — link expires in ${expiryMinutes} minutes`}>
      <Heading>Your sign-in link</Heading>
      <Paragraph>{firstName ? `Hi ${firstName},` : "Hi,"}</Paragraph>
      <Paragraph>
        Tap the button below to finish signing in. For your security, this link expires in{" "}
        <strong>{expiryMinutes} minutes</strong> and can only be used once.
      </Paragraph>
      <CTA href={magicUrl} label="Sign in to Autharis" />
      <Muted>
        Or paste this link:{" "}
        <a href={magicUrl} style={{ color: tokens.ink3, wordBreak: "break-all" }}>
          {magicUrl}
        </a>
      </Muted>
      <Divider />
      <Section>
        <Text style={layoutStyles.muted}>
          Requested from {requestUserAgent ?? "an unknown device"}
          {requestIp ? ` · IP ${requestIp}` : ""}.
        </Text>
        <Text style={layoutStyles.muted}>
          If you didn't request this, you can safely ignore the email — no one can sign in without
          this link.
        </Text>
      </Section>
    </Layout>
  );
}
