import { router } from 'expo-router';
import { Lede, Step, TextButton, Title, useFinishIntro } from '@/components/Onboarding';
import { PlaceFinder } from '@/components/PlaceFinder';

// Welcome, 2 of 3: where you vote. A postcode, or the phone's approximate location, used once.
export default function Place() {
  const finish = useFinishIntro();
  return (
    <Step step={2} of={3} onSkip={finish} skipLabel="Just look around" foot={<TextButton label="Back" onPress={() => router.back()} />}>
      <Title italic="vote?">Where do you </Title>
      <Lede>We’ll find your next election and who’s standing.</Lede>
      <PlaceFinder onFound={() => router.push('/welcome/personalise')} />
    </Step>
  );
}
