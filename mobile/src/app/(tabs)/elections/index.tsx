import { router } from 'expo-router';
import { useStore } from '@/core/store';
import { ElectionList } from '@/components/ElectionList';
import { Button, Card, H1, Screen, Small, shortDate } from '@/components/ui';

// My elections: the elections found for the saved outward code. Nothing is fetched until a ballot is opened.
export default function MyElections() {
  const { saved, ready, clearElections } = useStore();
  return (
    <Screen>
      <H1>My elections</H1>
      {!ready ? null : saved ? (
        <>
          <ElectionList outcode={saved.outcode} elections={saved.elections} placeUrl={saved.placeUrl} />
          <Small>Found on {shortDate(saved.savedAt)}. Search again on Home to update it.</Small>
          <Button label="Forget this area" kind="secondary" onPress={clearElections} hint="Removes the saved area from this phone" />
        </>
      ) : (
        <Card>
          <Small>No area saved yet. Enter your postcode on Home and the elections there will appear here.</Small>
          <Button label="Go to Home" kind="secondary" onPress={() => router.navigate('/')} />
        </Card>
      )}
    </Screen>
  );
}
