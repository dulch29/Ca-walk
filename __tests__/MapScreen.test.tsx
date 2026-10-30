import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TextInput, View } from 'react-native';
import MapScreen from '../src/screens/MapScreen';

const mockGetNearbyPlaces = jest.fn();
const mockSearchPlaces = jest.fn();
const mockGetWalkingRoute = jest.fn();
const mockRequestCurrentLocation = jest.fn();
const mockSetSelectedDestination = jest.fn();

let mockLocationFix: any = null;

jest.mock('../src/context/AppContext', () => ({
  useAppContext: () => ({
    locationFix: mockLocationFix,
    currentLocation: mockLocationFix,
    requestCurrentLocation: mockRequestCurrentLocation,
    requestLocationPermission: jest.fn(async () => true),
    setSelectedDestination: mockSetSelectedDestination,
  }),
}));

jest.mock('../src/services/osmLocationService', () => ({
  formatDistance: (meters: number) => `${meters} ม.`,
  getNearbyPlaces: (...args: any[]) => mockGetNearbyPlaces(...args),
  searchPlaces: (...args: any[]) => mockSearchPlaces(...args),
  getWalkingRoute: (...args: any[]) => mockGetWalkingRoute(...args),
}));

const mockFlyTo = jest.fn();
const mockFitBounds = jest.fn();
const mockZoomTo = jest.fn();

jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return {
    Map: ({ children, ...props }: any) => (
      <NativeView testID="map-view" {...props}>{children}</NativeView>
    ),
    Camera: ReactModule.forwardRef((_props: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({
        flyTo: mockFlyTo,
        fitBounds: mockFitBounds,
        zoomTo: mockZoomTo,
      }));
      return null;
    }),
    Marker: ({ children, id }: any) => <NativeView testID={id}>{children}</NativeView>,
    GeoJSONSource: ({ children, ...props }: any) => (
      <NativeView testID="route-source" {...props}>{children}</NativeView>
    ),
    Layer: () => null,
  };
});

jest.mock('../src/components/CatAvatar', () => () => null);

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => {
    resolve = next;
  });
  return { promise, resolve };
}

const fix = {
  latitude: 13.74,
  longitude: 100.53,
  accuracy: 5,
  timestamp: Date.now(),
  speedKmh: 0,
};

const place = (id: string, name: string, distanceMeters: number) => ({
  id,
  name,
  displayName: `${name}, Bangkok`,
  category: 'cafe',
  coordinates: [100.53 + distanceMeters / 1_000_000, 13.74] as [number, number],
  distanceMeters,
});

function allText(renderer: ReactTestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .filter(value => typeof value === 'string' || typeof value === 'number')
    .join(' ');
}

function pressByText(
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) {
  const textNode = renderer.root
    .findAllByType(Text)
    .find(node => node.props.children === label);
  if (!textNode) {
    throw new Error(`Missing text: ${label}`);
  }
  let parent = textNode.parent;
  while (parent && typeof parent.props.onPress !== 'function') {
    parent = parent.parent;
  }
  if (!parent) {
    throw new Error(`Missing press target: ${label}`);
  }
  parent.props.onPress();
}

function pressByAccessibilityLabel(
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) {
  const target = renderer.root.findAll(
    node => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
  )[0];
  if (!target) {
    throw new Error(`Missing accessibility target: ${label}`);
  }
  target.props.onPress();
}

async function renderMap() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <MapScreen onBack={jest.fn()} onOpenStore={jest.fn()} onStartRecord={jest.fn()} />,
    );
  });
  return renderer;
}

describe('MapScreen nearby search and routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationFix = null;
    mockRequestCurrentLocation.mockImplementation(() => new Promise(() => {}));
    mockGetNearbyPlaces.mockResolvedValue([]);
    mockSearchPlaces.mockResolvedValue([]);
    mockGetWalkingRoute.mockResolvedValue(null);
  });

  it('waits for validated GPS and never loads nearby with a fallback coordinate', async () => {
    const renderer = await renderMap();

    expect(allText(renderer)).toContain('กำลังหาตำแหน่ง');
    expect(mockGetNearbyPlaces).not.toHaveBeenCalled();
  });

  it('loads 1 km nearby after GPS and changes radius only when pressed', async () => {
    mockLocationFix = fix;
    mockGetNearbyPlaces.mockResolvedValue([place('a', 'Cafe A', 250)]);
    const renderer = await renderMap();

    expect(mockGetNearbyPlaces).toHaveBeenCalledWith(
      [100.53, 13.74],
      1000,
      expect.any(AbortSignal),
    );

    await ReactTestRenderer.act(async () => pressByText(renderer, '3 กม.'));
    expect(mockGetNearbyPlaces).toHaveBeenLastCalledWith(
      [100.53, 13.74],
      3000,
      expect.any(AbortSignal),
    );
    expect(mockGetNearbyPlaces).not.toHaveBeenCalledWith(
      expect.anything(),
      30000,
      expect.anything(),
    );
  });

  it('removes the user marker and leaves ready state when the shared fix expires', async () => {
    mockLocationFix = fix;
    const renderer = await renderMap();

    expect(
      renderer.root
        .findAllByType(View)
        .filter(node => node.props.testID === 'user-location'),
    ).toHaveLength(1);
    expect(allText(renderer)).not.toContain('กำลังหาตำแหน่ง');

    await ReactTestRenderer.act(async () => {
      mockLocationFix = null;
      renderer.update(
        <MapScreen onBack={jest.fn()} onOpenStore={jest.fn()} onStartRecord={jest.fn()} />,
      );
      await Promise.resolve();
    });

    expect(
      renderer.root
        .findAllByType(View)
        .filter(node => node.props.testID === 'user-location'),
    ).toHaveLength(0);
    expect(allText(renderer)).toContain('กำลังหาตำแหน่ง');
    expect(mockRequestCurrentLocation).toHaveBeenCalled();
  });

  it('keeps latest search result when older request resolves last', async () => {
    mockLocationFix = fix;
    const first = deferred<any[]>();
    const second = deferred<any[]>();
    mockSearchPlaces
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const renderer = await renderMap();
    const input = renderer.root.findByType(TextInput);

    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('สวนแรก');
    });
    await ReactTestRenderer.act(async () => {
      renderer.root.findByType(TextInput).props.onSubmitEditing();
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('สวนล่าสุด');
    });
    await ReactTestRenderer.act(async () => {
      renderer.root.findByType(TextInput).props.onSubmitEditing();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => second.resolve([place('b', 'Latest Park', 400)]));
    await ReactTestRenderer.act(async () => first.resolve([place('a', 'Old Park', 300)]));

    expect(allText(renderer)).toContain('Latest Park');
    expect(allText(renderer)).not.toContain('Old Park');
  });

  it('keeps latest route and sends its destination snapshot to Record', async () => {
    mockLocationFix = fix;
    mockGetNearbyPlaces.mockResolvedValue([
      place('a', 'Cafe A', 100),
      place('b', 'Cafe B', 200),
    ]);
    const routeA = deferred<any>();
    const routeB = deferred<any>();
    mockGetWalkingRoute
      .mockReturnValueOnce(routeA.promise)
      .mockReturnValueOnce(routeB.promise);
    const onStartRecord = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <MapScreen onBack={jest.fn()} onOpenStore={jest.fn()} onStartRecord={onStartRecord} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      pressByAccessibilityLabel(renderer, 'เลือก Cafe A');
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => {
      pressByAccessibilityLabel(renderer, 'เลือก Cafe B');
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () =>
      routeB.resolve({
        coordinates: [[100.53, 13.74], [100.531, 13.741]],
        distanceMeters: 220,
        durationSeconds: 180,
      }),
    );
    await ReactTestRenderer.act(async () =>
      routeA.resolve({
        coordinates: [[100.53, 13.74], [100.5305, 13.7405]],
        distanceMeters: 110,
        durationSeconds: 90,
      }),
    );

    const renderedText = allText(renderer).replace(/\s+/g, ' ');
    expect(renderedText).toContain('0.22 กม.');
    expect(renderedText).not.toContain('0.11 กม.');

    ReactTestRenderer.act(() => pressByText(renderer, 'ไปกันเลย'));
    expect(mockSetSelectedDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'b',
        name: 'Cafe B',
        distanceMeters: 220,
        routeCoordinates: [[100.53, 13.74], [100.531, 13.741]],
      }),
    );
    expect(onStartRecord).toHaveBeenCalledTimes(1);
  });

  it('shows nearby error and retries the same selected radius', async () => {
    mockLocationFix = fix;
    mockGetNearbyPlaces
      .mockRejectedValueOnce(new Error('ระบบค้นหาไม่ตอบสนอง'))
      .mockResolvedValueOnce([]);
    const renderer = await renderMap();

    expect(allText(renderer)).toContain('ระบบค้นหาไม่ตอบสนอง');
    await ReactTestRenderer.act(async () => pressByText(renderer, 'ลองใหม่'));
    expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(2);
    expect(allText(renderer)).toContain('ไม่พบร้านในรัศมี 1 กม.');
  });
});
