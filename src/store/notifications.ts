import { Snackbar, SnackbarRaw } from '../types/notifications';
import { reverse, sortBy } from 'lodash';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';
import { Notification } from '@directus/types';

export const useNotificationsStore = defineStore({
    id: 'notificationsStore',
    state: () => ({
		dialogs: [] as Snackbar[],
		queue: [] as Snackbar[],

	}),
    actions: {
        add(notification: SnackbarRaw) {
			const id = nanoid();
			const timestamp = Date.now();

			if (notification.dialog === true) {
				notification.persist = true;

				this.dialogs = [
					...this.dialogs,
					{
						...notification,
						id,
						timestamp,
					},
				];
			} else {
				this.queue = [
					...this.queue,
					{
						...notification,
						id,
						timestamp,
					},
				];
			}

			if (notification.persist !== true) {
				setTimeout(() => {
					this.remove(id);
				}, 3000);
			}

			return id;
		},
	},
});