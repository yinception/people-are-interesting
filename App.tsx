import { PeopleScreen } from './src/features/people/PeopleScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <PeopleScreen />
    </SafeAreaProvider>
  );
}
