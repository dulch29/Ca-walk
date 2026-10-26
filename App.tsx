import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Svg, { Circle, Path } from 'react-native-svg';
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

function renderTabIcon(name: string, isFocused: boolean) {
  const color = isFocused ? '#262A22' : '#8A8F85';
  if (name === 'Home') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
        <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </Svg>
    );
  }
  if (name === 'Record') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Circle cx="8" cy="7.5" r="1.8" fill={color} />
        <Circle cx="12" cy="5.5" r="1.8" fill={color} />
        <Circle cx="16" cy="7.5" r="1.8" fill={color} />
        <Circle cx="5" cy="11.5" r="1.5" fill={color} />
        <Circle cx="19" cy="11.5" r="1.5" fill={color} />
        <Path
          d="M12 11c-2.8 0-4.8 1.8-4.8 4.2 0 1.8 1.4 3.3 4.8 3.3s4.8-1.5 4.8-3.3c0-2.4-2-4.2-4.8-4.2z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function FloatingPillTabBar({ state, navigation }: BottomTabBarProps) {
  const tabs = [
    { name: 'Home', label: 'Home' },
    { name: 'Record', label: 'Record' },
    { name: 'Me', label: 'Me' },
  ];

  return (
    <View style={tabStyles.bottomBarContainer}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        const route = state.routes[index];

        const onPress = () => {
          if (!route) {
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <Pressable
            key={tab.name}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            style={tabStyles.tabItem}
          >
            {renderTabIcon(tab.name, isFocused)}
            <Text
              style={[
                tabStyles.tabLabel,
                isFocused && tabStyles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const renderFloatingTabBar = (props: BottomTabBarProps) => (
  <FloatingPillTabBar {...props} />
);

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={renderFloatingTabBar}
      screenOptions={{
        headerShown: false,
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
            <Stack.Navigator
              initialRouteName="Main"
              screenOptions={{ headerShown: false }}
            >
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

const tabStyles = StyleSheet.create({
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FAF7EE',
    borderTopWidth: 1.2,
    borderTopColor: '#ECE4D8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 10,
    elevation: 10,
    shadowColor: '#262A22',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8F85',
  },
  tabLabelActive: {
    fontWeight: '800',
    color: '#262A22',
  },
});
