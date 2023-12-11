import { ref } from 'vue';
import { defineLayout, useSync } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';
import Options from "./options.vue";
import Actions from "./actions.vue";

export default defineLayout({
	id: 'cdh-kanboard',
	name: 'Kanboard',
	icon: 'view_kanban',
	component: LayoutComponent,
	slots: {
		options: Options,
		sidebar: () => null,
		actions: Actions,
	},
	setup(props, { emit }) {
		const layoutOptions = useSync(props, "layoutOptions", emit);

		const groupByField = layoutOptions.value?.groupByField;
		const headerTemplate = layoutOptions.value?.headerTemplate;
		const cardContentTemplate = layoutOptions.value?.cardContentTemplate;

		console.log('layoutOptions', layoutOptions)
		console.log('groupByField', groupByField)

		return { groupByField, headerTemplate, cardContentTemplate };
	},
});
