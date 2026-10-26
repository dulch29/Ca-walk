import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
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
import RecordScreen, { RunSummary } from './src/screens/RecordScreen';
import RecordSummaryScreen from './src/screens/RecordSummaryScreen';
import RecordStoryScreen from './src/screens/RecordStoryScreen';
import RecordCameraScreen from './src/screens/RecordCameraScreen';
import MeScreen from './src/screens/MeScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ActivityHistoryScreen from './src/screens/ActivityHistoryScreen';
import ActivityDetailScreen from './src/screens/ActivityDetailScreen';
import CouponHistoryScreen from './src/screens/CouponHistoryScreen';
import { AppProvider } from './src/context/AppContext';
import { colors } from './src/theme';

type RootStack = {
  GetStarted: undefined;
  Login: undefined;
  Main: undefined;
  Map: undefined;
  Store: { storeId: string };
  Wallet: undefined;
  Missions: undefined;
  Coupons: undefined;
  RecordSummary: { summary: RunSummary };
  RecordStory: { summary: RunSummary };
  RecordCamera: undefined;
  Profile: undefined;
  Settings: undefined;
  History: undefined;
  ActivityDetail: { activityId: string };
  CouponHistory: undefined;
};

type Props<T extends keyof RootStack> = NativeStackScreenProps<RootStack, T>;
type Nav = NativeStackNavigationProp<RootStack>;

const Stack = createNativeStackNavigator<RootStack>();
const Tab = createBottomTabNavigator();

// shortcut: last quest photo kept in memory only, move to app state/storage when backend lands
let lastPhotoUri: string | undefined;

const ROUTE = {
  wallet: 'Wallet',
  missions: 'Missions',
  coupons: 'Coupons',
  map: 'Map',
} as const;

function HomeTab() {
  const nav = useNavigation<Nav>();
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

function RecordTab() {
  const nav = useNavigation<Nav>();
  return (
    <RecordScreen
      onFinish={summary => nav.navigate('RecordSummary', { summary })}
      onCamera={() => nav.navigate('RecordCamera')}
    />
  );
}

function MeTab() {
  const nav = useNavigation<Nav>();
  return (
    <MeScreen
      onProfile={() => nav.navigate('Profile')}
      onSettings={() => nav.navigate('Settings')}
      onHistory={() => nav.navigate('History')}
      onCouponHistory={() => nav.navigate('CouponHistory')}
    />
  );
}

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

const GetStarted = ({ navigation }: Props<'GetStarted'>) => (
  <GetStartedScreen
    onStart={() => navigation.navigate('Login')}
    onLogin={() => navigation.navigate('Login')}
  />
);
const Login = ({ navigation }: Props<'Login'>) => (
  <LoginScreen
    onDone={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
  />
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
const RecordSummaryRoute = ({ navigation, route }: Props<'RecordSummary'>) => (
  <RecordSummaryScreen
    summary={route.params.summary}
    onBack={navigation.goBack}
    onStory={() =>
      navigation.navigate('RecordStory', { summary: route.params.summary })
    }
  />
);
const RecordStoryRoute = ({ navigation, route }: Props<'RecordStory'>) => (
  <RecordStoryScreen
    summary={route.params.summary}
    photoUri={lastPhotoUri}
    onClose={navigation.goBack}
  />
);
const RecordCameraRoute = ({ navigation }: Props<'RecordCamera'>) => (
  <RecordCameraScreen
    onBack={navigation.goBack}
    onCaptured={uri => {
      lastPhotoUri = uri;
      navigation.goBack();
    }}
  />
);
const ProfileRoute = ({ navigation }: Props<'Profile'>) => (
  <ProfileEditScreen onBack={navigation.goBack} />
);
const SettingsRoute = ({ navigation }: Props<'Settings'>) => (
  <SettingsScreen
    onBack={navigation.goBack}
    onLogout={() =>
      navigation.reset({ index: 0, routes: [{ name: 'GetStarted' }] })
    }
  />
);
const HistoryRoute = ({ navigation }: Props<'History'>) => (
  <ActivityHistoryScreen
    onBack={navigation.goBack}
    onOpen={activityId => navigation.navigate('ActivityDetail', { activityId })}
  />
);
const ActivityDetailRoute = ({
  navigation,
  route,
}: Props<'ActivityDetail'>) => (
  <ActivityDetailScreen
    activityId={route.params.activityId}
    onBack={navigation.goBack}
  />
);
const CouponHistoryRoute = ({ navigation }: Props<'CouponHistory'>) => (
  <CouponHistoryScreen onBack={navigation.goBack} />
);

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.root}>
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
              <Stack.Screen name="RecordSummary" component={RecordSummaryRoute} />
              <Stack.Screen name="RecordStory" component={RecordStoryRoute} />
              <Stack.Screen name="RecordCamera" component={RecordCameraRoute} />
              <Stack.Screen name="Profile" component={ProfileRoute} />
              <Stack.Screen name="Settings" component={SettingsRoute} />
              <Stack.Screen name="History" component={HistoryRoute} />
              <Stack.Screen
                name="ActivityDetail"
                component={ActivityDetailRoute}
              />
              <Stack.Screen name="CouponHistory" component={CouponHistoryRoute} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
