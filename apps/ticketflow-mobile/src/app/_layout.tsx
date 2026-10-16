import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../contexts/AppContext";
import { RootNavigator } from "../navigation/RootNavigator";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
