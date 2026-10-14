import Constants from 'expo-constants';
import { Card, H1, H3, LinkRow, Screen, Small } from '@/components/ui';

const SITE = 'https://whatsittome.org';

// More: the website's own pages, opened in the in-app browser. The app holds no content of its own.
export default function More() {
  return (
    <Screen>
      <H1>More</H1>
      <Card style={{ gap: 0 }}>
        <LinkRow label="Learn" url={`${SITE}/learn`} hint="Opens on the website" />
        <LinkRow label="How voting works" url={`${SITE}/how-to-vote`} hint="Opens on the website" />
        <LinkRow label="How this works" url={`${SITE}/about`} hint="Opens on the website" />
        <LinkRow label="Who we are" url={`${SITE}/who-we-are`} hint="Opens on the website" />
        <LinkRow label="Privacy and data use" url={`${SITE}/privacy`} hint="Opens on the website" />
        <LinkRow label="Accessibility" url={`${SITE}/accessibility`} hint="Opens on the website" />
        <LinkRow label="Tell us what you think" url={`${SITE}/feedback`} hint="Opens the feedback form on the website" />
      </Card>
      <Card>
        <H3>What this app keeps</H3>
        <Small>Your household answers and the first part of your postcode, on this phone only. Ballots you open and money figures are kept on the phone too, so they still read offline. Nothing about you is sent to What’s It To Me?: the app asks the website for the same ballots and figures it gives everyone, and works out what applies to you here.</Small>
      </Card>
      <Small>What’s It To Me? {Constants.expoConfig?.version ?? ''}. Independent: it does not represent any government, council or political party.</Small>
    </Screen>
  );
}
