import { useNotificationsStore } from '../../store/notifications';
import { SnackbarRaw } from '../../types/notifications';

let store: any;

export function notify(notification: SnackbarRaw): void {
	if (!store) store = useNotificationsStore();
	store.add(notification);
}
