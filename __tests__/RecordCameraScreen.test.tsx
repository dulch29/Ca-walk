import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { BackHandler, Linking, Text, View } from 'react-native';
import RecordCameraScreen from '../src/screens/RecordCameraScreen';

let mockHasPermission = true;
let mockCanRequestPermission = true;
const mockRequestPermission = jest.fn();
const mockCapturePhotoToFile = jest.fn();

jest.mock('react-native-vision-camera', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return {
    Camera: ReactModule.forwardRef(({ children, ...props }: any, _ref: any) => (
      <NativeView testID="camera-preview" {...props}>
        {children}
      </NativeView>
    )),
    useCameraPermission: () => ({
      hasPermission: mockHasPermission,
      canRequestPermission: mockCanRequestPermission,
      requestPermission: mockRequestPermission,
    }),
    usePhotoOutput: () => ({ capturePhotoToFile: mockCapturePhotoToFile }),
  };
});

function pressByAccessibilityLabel(
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) {
  const target = renderer.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
  if (!target) {
    throw new Error(`Missing press target: ${label}`);
  }
  target.props.onPress();
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

function allText(renderer: ReactTestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .filter(value => typeof value === 'string')
    .join(' ');
}

describe('RecordCameraScreen', () => {
  beforeEach(() => {
    mockHasPermission = true;
    mockCanRequestPermission = true;
    jest.clearAllMocks();
    mockCapturePhotoToFile.mockResolvedValue({
      filePath: '/tmp/session-photo.jpg',
    });
  });

  it('uses the native back camera with pinch-to-zoom enabled', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={jest.fn()} />,
      );
    });

    const preview = renderer.root
      .findAllByType(View)
      .find(node => node.props.testID === 'camera-preview');

    expect(preview?.props.device).toBe('back');
    expect(preview?.props.isActive).toBe(true);
    expect(preview?.props.enableNativeZoomGesture).toBe(true);
  });

  it('captures directly to a file without app-controlled shutter sound', async () => {
    const onCaptured = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={onCaptured} />,
      );
    });

    await act(async () => {
      pressByAccessibilityLabel(renderer, 'ถ่ายรูป');
      await Promise.resolve();
    });

    expect(mockCapturePhotoToFile).toHaveBeenCalledWith(
      { enableShutterSound: false },
      {},
    );
    expect(onCaptured).toHaveBeenCalledWith('file:///tmp/session-photo.jpg');
  });

  it('requests camera permission before opening the preview', async () => {
    mockHasPermission = false;
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={jest.fn()} />,
      );
    });

    expect(
      renderer.root
        .findAllByType(View)
        .some(node => node.props.testID === 'camera-preview'),
    ).toBe(false);

    await act(async () => pressByText(renderer, 'อนุญาต'));
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('opens system settings when camera permission cannot be requested again', async () => {
    mockHasPermission = false;
    mockCanRequestPermission = false;
    const openSettings = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={jest.fn()} />,
      );
    });

    await act(async () => pressByText(renderer, 'เปิดการตั้งค่า'));
    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });

  it('keeps the shutter busy until the photo metadata callback finishes', async () => {
    let resolveCaptured!: () => void;
    const onCaptured = jest.fn(
      () => new Promise<void>(resolve => (resolveCaptured = resolve)),
    );
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={onCaptured} />,
      );
    });

    await act(async () => {
      pressByAccessibilityLabel(renderer, 'ถ่ายรูป');
      await Promise.resolve();
    });
    const shutter = () =>
      renderer.root.findAll(
        node => node.props.accessibilityLabel === 'ถ่ายรูป',
      )[0];
    const back = () =>
      renderer.root.findAll(
        node => node.props.accessibilityLabel === 'ย้อนกลับ',
      )[0];
    expect(shutter().props.accessibilityState).toEqual({ disabled: true });
    expect(back().props.accessibilityState).toEqual({ disabled: true });

    await act(async () => resolveCaptured());
    expect(shutter().props.accessibilityState).toEqual({ disabled: false });
    expect(back().props.accessibilityState).toEqual({ disabled: false });
  });

  it('blocks Android back while the captured photo metadata is pending', async () => {
    let hardwareBackHandler:
      | Parameters<typeof BackHandler.addEventListener>[1]
      | undefined;
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        hardwareBackHandler = handler;
        return { remove };
      });
    let resolveCaptured!: () => void;
    const onCaptured = jest.fn(
      () => new Promise<void>(resolve => (resolveCaptured = resolve)),
    );
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={onCaptured} />,
      );
    });

    expect(hardwareBackHandler?.({} as never)).toBe(false);
    await act(async () => {
      pressByAccessibilityLabel(renderer, 'ถ่ายรูป');
      await Promise.resolve();
    });
    expect(hardwareBackHandler?.({} as never)).toBe(true);

    await act(async () => resolveCaptured());
    expect(hardwareBackHandler?.({} as never)).toBe(false);
    expect(remove).toHaveBeenCalled();
    addEventListener.mockRestore();
  });

  it('clears a previous capture error when retry succeeds', async () => {
    mockCapturePhotoToFile
      .mockRejectedValueOnce(new Error('camera busy'))
      .mockResolvedValueOnce({ filePath: '/tmp/session-photo.jpg' });
    const onCaptured = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <RecordCameraScreen onBack={jest.fn()} onCaptured={onCaptured} />,
      );
    });

    await act(async () => {
      pressByAccessibilityLabel(renderer, 'ถ่ายรูป');
      await Promise.resolve();
    });
    expect(allText(renderer)).toContain('camera busy');

    await act(async () => {
      pressByAccessibilityLabel(renderer, 'ถ่ายรูป');
      await Promise.resolve();
    });
    expect(mockCapturePhotoToFile).toHaveBeenCalledTimes(2);
    expect(onCaptured).toHaveBeenCalledWith('file:///tmp/session-photo.jpg');
    expect(allText(renderer)).not.toContain('camera busy');
  });
});
