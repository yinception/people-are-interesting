import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  confirmLabel: string;
  destructive?: boolean;
  message: string;
  title: string;
}

// react-native-web does not ship Alert, so web falls back to the native browser dialogs.
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
}

export function confirmAction({
  confirmLabel,
  destructive = false,
  message,
  title,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { onDismiss: () => resolve(false) }
    );
  });
}
