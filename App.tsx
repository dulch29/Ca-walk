import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GetStartedScreen from './src/screens/GetStartedScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import StoreDetailScreen from './src/screens/StoreDetailScreen';
import DistanceWalletScreen from './src/screens/DistanceWalletScreen';
import MissionsScreen from './src/screens/MissionsScreen';
import MyCouponsScreen from './src/screens/MyCouponsScreen';
import { colors, font } from './src/theme';

type RootStack = {
  GetStarted: undefined;
  Login: undefined;
  Main: undefined;
  Map: undefined;
  Store: { storeId: string };
  Wallet: undefined;
  Missions: undefined;
  Coupons: undefined;
};

type Props<T extends keyof RootStack> = NativeStackScreenProps<RootStack, T>;

const Stack = createNativeStackNavigator<RootStack>();
const Tab = createBottomTabNavigator();

const ROUTE = {
  wallet: 'Wallet',
  missions: 'Missions',
  coupons: 'Coupons',
  map: 'Map',
} as const;

function HomeTab() {
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  return (
    <HomeScreen
      onNavigate={(target, storeId) =>
        target === 'store'
          ? nav.navigate('Store', { storeId: storeId ?? '' })
          : nav.navigate(ROUTE[target])
      }
    />
  );
}

// shortcut: Record and Me are placeholders, replace when their designs arrive
function Placeholder({ title }: { title: string }) {
  return (
    <View style={styles.center}>
      <Text style={font.title}>{title}</Text>
      <Text style={font.small}>เร็วๆ นี้</Text>
    </View>
  );
}
const RecordTab = () => <Placeholder title="Record" />;
const MeTab = () => <Placeholder title="Me" />;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Record" component={RecordTab} />
      <Tab.Screen name="Me" component={MeTab} />
    </Tab.Navigator>
  );
}

const toMain = (navigation: Props<'Login'>['navigation']) =>
  navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

const GetStarted = ({ navigation }: Props<'GetStarted'>) => (
  <GetStartedScreen
    onStart={() => navigation.navigate('Login')}
    onLogin={() => navigation.navigate('Login')}
  />
);
const Login = ({ navigation }: Props<'Login'>) => (
  <LoginScreen onDone={() => toMain(navigation)} />
);
const MapRoute = ({ navigation }: Props<'Map'>) => (
  <MapScreen
    onBack={navigation.goBack}
    onOpenStore={storeId => navigation.navigate('Store', { storeId })}
  />
);
const StoreRoute = ({ navigation, route }: Props<'Store'>) => (
  <StoreDetailScreen
    storeId={route.params.storeId}
    onBack={navigation.goBack}
    onGo={() => navigation.navigate('Map')}
  />
);
const WalletRoute = ({ navigation }: Props<'Wallet'>) => (
  <DistanceWalletScreen onBack={navigation.goBack} />
);
const MissionsRoute = ({ navigation }: Props<'Missions'>) => (
  <MissionsScreen
    onBack={navigation.goBack}
    onGo={() => navigation.navigate('Map')}
  />
);
const CouponsRoute = ({ navigation }: Props<'Coupons'>) => (
  <MyCouponsScreen onBack={navigation.goBack} />
);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.root} edges={['top']}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GetStarted" component={GetStarted} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Map" component={MapRoute} />
            <Stack.Screen name="Store" component={StoreRoute} />
            <Stack.Screen name="Wallet" component={WalletRoute} />
            <Stack.Screen name="Missions" component={MissionsRoute} />
            <Stack.Screen name="Coupons" component={CouponsRoute} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
