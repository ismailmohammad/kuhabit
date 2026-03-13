import { Link } from "react-router-dom";
import styled from "styled-components";
import KindlingShield from "../../assets/kindling/kindling-shield.png";

const Wrap = styled.main`
  max-width: 920px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  color: #f0f0f0;
`;

const Title = styled.h1`
  margin: 0 0 0.75rem;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
`;

const ShieldImg = styled.img`
  width: clamp(340px, 68vw, 500px);
  height: auto;
  display: block;
  margin: 0.25rem auto 0.7rem;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(93, 168, 255, 0.25));
`;

const Meta = styled.p`
  margin: 0 0 1.5rem;
  color: #a8a8a8;
`;

const Section = styled.section`
  margin: 1.2rem 0 0;
`;

const H2 = styled.h2`
  margin: 0 0 0.45rem;
  font-size: 1.15rem;
`;

const P = styled.p`
  margin: 0.2rem 0 0.5rem;
  color: #d0d0d0;
  line-height: 1.65;
`;

const List = styled.ul`
  margin: 0.35rem 0 0.7rem 1.1rem;
  color: #d0d0d0;
  line-height: 1.65;
`;

const Foot = styled.div`
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #2f2f2f;
  color: #a8a8a8;
`;

export default function PrivacyPolicyPage() {
  return (
    <Wrap>
      <Title>Privacy Policy</Title>
      <ShieldImg src={KindlingShield} alt="" aria-hidden="true" />
      <Meta>
        Effective date: March 13, 2026
      </Meta>
      <P>
        This Privacy Policy explains how Stokely collects, uses, stores, and protects personal information for users in Canada, with a <strong>privacy-minimization approach</strong>.
      </P>

      <Section>
        <H2>1. Scope and Canadian Privacy Laws</H2>
        <P>
          We handle personal information in line with applicable Canadian privacy law, including the Personal Information Protection and Electronic Documents Act (PIPEDA), and substantially similar provincial private-sector laws where applicable.
        </P>
      </Section>

      <Section>
        <H2>2. Information We Collect</H2>
        <List>
          <li>Account information: username, password hash, optional email address, email verification state, account creation timestamp.</li>
          <li>Habit information: habit names, notes, recurrence settings, reminder times, completion logs, and streak/freeze metadata.</li>
          <li>Security/session information: session identifiers and session activity timestamps.</li>
          <li>Limited technical metadata: we process request/network details for security and abuse prevention, but <strong>we do not retain raw session IP addresses or full user-agent strings in persisted session records</strong>.</li>
          <li>Push-notification information: push endpoint, subscription keys, device label, and delivery/failure status metadata.</li>
          <li>Email verification/reset metadata: hashed token records and expiry timestamps.</li>
          <li>On-device browser storage: UI preferences and, if selected, local vault key persistence in IndexedDB.</li>
        </List>
      </Section>

      <Section>
        <H2>3. End-to-End Encryption (E2EE)</H2>
        <P>
          If you enable E2EE, habit names and notes are encrypted in the client before transmission. <strong>We do not collect or store your E2EE passphrase.</strong>
        </P>
        <P>
          We do store E2EE metadata needed for client-side verification (for example, salt and verifier values).
        </P>
        <P>
          Important: your passphrase cannot be recovered by us. If lost, encrypted data may become unreadable.
        </P>
      </Section>

      <Section>
        <H2>4. Why We Use Your Information</H2>
        <List>
          <li>To create and secure your account.</li>
          <li>To provide habit tracking, reminders, and related app features.</li>
          <li>To provide optional email verification and password recovery.</li>
          <li>To maintain service security, prevent abuse, and troubleshoot reliability issues.</li>
        </List>
      </Section>

      <Section>
        <H2>5. Consent</H2>
        <P>
          By using Stokely and providing personal information, you consent to collection, use, and disclosure as described in this policy, subject to legal and contractual limits.
        </P>
        <P>
          You can withdraw consent in some cases, but this may limit service functionality (for example, disabling optional email recovery or push notifications).
        </P>
      </Section>

      <Section>
        <H2>6. Disclosure and Service Providers</H2>
        <P>
          <strong>We do not sell personal information.</strong> We may use third-party service providers (for hosting, database, email delivery, and push infrastructure) to operate the service. They process information only as needed to provide those services.
        </P>
      </Section>

      <Section>
        <H2>7. Cross-Border Processing</H2>
        <P>
          Your information may be processed or stored outside your province or outside Canada by infrastructure providers. When this happens, it may be subject to lawful access requests under those jurisdictions.
        </P>
      </Section>

      <Section>
        <H2>8. Retention and Deletion</H2>
        <P>
          We keep personal information for as long as needed to provide the service and meet legal or operational obligations. If you delete your account, account-associated records are removed from active systems according to our deletion workflow.
        </P>
      </Section>

      <Section>
        <H2>9. Security Safeguards</H2>
        <P>
          We use administrative, technical, and physical safeguards appropriate to the sensitivity of information, including <strong>password hashing</strong>, authenticated sessions, CSRF protections, and transport-layer protections.
        </P>
      </Section>

      <Section>
        <H2>10. Your Rights (Canada)</H2>
        <P>
          Subject to applicable law, you may request access to or correction of personal information we hold about you, and may submit privacy complaints.
        </P>
      </Section>

      <Section>
        <H2>11. Contact</H2>
        <P>
          Email: privacy@stokely.quest
        </P>
      </Section>

      <Section>
        <H2>12. Changes to This Policy</H2>
        <P>
          We may update this policy from time to time. Updated versions will be posted with a revised effective date.
        </P>
      </Section>

      <Foot>
        <Link to="/" style={{ color: "#9dd7ff" }}>Back to Home</Link>
      </Foot>
    </Wrap>
  );
}
