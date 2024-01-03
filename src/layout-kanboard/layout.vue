<template>
	<div class="kanboard">
		<draggable
			:model-value="groupedItems"
			group="groups"
			item-key="id"
			draggable=".draggable"
			:animation="150"
			class="draggable"
			:class="{ sortable: groupsSortField !== null }"
			@change="changeGroupSort"
		>
			<template #item="{ element: group, index: index }">
				<group
					:key="group.title"
					:group-title="group.title"
					:group-index="index"
					:field="field"
					:field-value="group.id"
					:collection="collectionKey"
					:layout-options="layoutOptions"
					:filter="filter"
					:search="search"
					:sort="sort"
					:class="{ draggable: group.id !== null }"
					:primary-key-field="primaryKeyField"
					:reloadGroup="reloadGroup"
					:open-change-log="openChangeLog"
					:open-drawer-item-edit="openDrawerItemEdit"
					:new-item-data="dataItemCreated"
					@create-item="handleOpenDrawerCreateItem"
					@edit-item="handleOpenDrawerEditItem"
					@open-change-log="handleOpenDrawerChangeLog"
					@click-item="handleOpenDrawerEditItem"
					@delete-group="handDeleteGroup(group.id)"
					@edit-group="openEditGroup(group)"
				/>
			</template>
		</draggable>
		<div class="add-group" @click="editDialogOpen = '+'">
			<v-icon name="add_box" />
			<span class="ml-8px font-500 text-14px">Add new list</span>
		</div>
		<v-dialog :model-value="editDialogOpen !== null" @esc="cancelChanges()">
			<v-card>
				<v-card-title>
					{{ editDialogOpen === '+' ? t('layouts.kanban.add_group') : t('layouts.kanban.edit_group') }}
				</v-card-title>
				<v-card-text>
					<v-input v-model="editTitle" :placeholder="t('layouts.kanban.add_group_placeholder')" @blur="checkRequiredTitle"/>
					<span v-if="showRequiredTitleGroup" class="text-14px text-[var(--theme--danger)]">Need to enter the group's title</span>
				</v-card-text>
				<v-card-text>
					<v-input v-model="editValue" :placeholder="t('kanboard.layout.add_value_group_placeholder')" @blur="checkRequiredValue"/>
					<span v-if="showRequiredValueGroup" class="text-14px text-[var(--theme--danger)]">Need to enter the group's id</span>
					<span v-if="showRequiredIdDuplicate" class="text-14px text-[var(--theme--danger)]">Id already exists</span>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="cancelChanges()">{{ t('cancel') }}</v-button>
					<v-button @click="saveChanges">{{ editDialogOpen === '+' ? t('create') : t('save') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<!-- create item -->
		<DrawerItem
			v-model:active="openDrawerCreateItem"
			:collection="collectionKey"
			:edits="edits"
			primary-key="+"
			@input="handleCreateItem"
		/>
		<!-- edit item -->
		<DrawerItem
            v-model:active="openDrawerItemEdit"
            :collection="collectionKey"
			:edits="edits"
            circular-field="status"
            @input="handleEditItem"
        >
			<template #actions>
				<div 
					@click="handleNextItem"
					v-tooltip.bottom="'Next Item'"
					:class="{'disable-button-next-pre' : disableNextItem}"
					class="bg-[var(--purple-25)] w-44px h-44px flex flex-col items-center justify-center text-[var(--purple-75)] rounded-50% hover:bg-[var(--purple-50)] cursor-pointer"
				>
					<v-icon name="keyboard_arrow_down"/>
				</div>
				<div 
					@click="handlePreItem"
					v-tooltip.bottom="'Previous Item'"
					:class="{ 'disable-button-next-pre' : disablePrevItem}"
					class="bg-[var(--purple-25)] w-44px h-44px flex flex-col items-center justify-center text-[var(--purple-75)] rounded-50% hover:bg-[var(--purple-50)] cursor-pointer"
				>
					<v-icon name="keyboard_arrow_up"/>
				</div>
			</template>
		</DrawerItem>
		<!-- changelog -->
		<v-drawer
			:model-value="openChangeLog"
			title="CHANGE LOG"
			subtitle="Card's log"
			@cancel="openChangeLog = false"
			class="w-256px customer"
		>
			<div v-for="item, index in listRevisions" :key="index" class="item-change-log" @click="handleOpenChangeLogDetail(item, index)">
				<div class="w-40px h-40px">
					<div v-if="item?.dataUserUpdate?.avatar || item?.activity?.user?.avatar" class="w-100% h-100%">
						<v-image v-if="item?.activity?.action === 'update'" class="render-thumbnail" :src="partImage(item?.dataUserUpdate?.avatar)" />
						<v-image v-if="item?.activity?.action === 'create'" class="render-thumbnail" :src="partImage(item?.activity?.user?.avatar)" />
					</div>
					<div v-else class="w-100% h-100% rounded-full bg-slate-200"></div>
				</div>
				<div class="ml-12px">
					<div class="text-14px font-400">
						<span class="font-700">{{ item?.activity?.user?.email }}</span>
						<span v-if="item?.activity?.action === 'update'"> Update Item</span>
						<span v-if="item?.activity?.action === 'create'"> Create Item</span>
					</div>
					<div class="flex items-center text-12px font-400 leading-18px">
						<v-icon name="nest_clock_farsight_analog" />
						<span class="ml-4px">{{ formatDateTime(item?.activity?.timestamp) }}</span>
					</div>
				</div>
			</div>
		</v-drawer>
		<!-- detail changelog -->
		<v-drawer
			:model-value="openChangeLogDetail"
			title="Item Revision"
			:subtitle= "detailRevisionSubtitle ? detailRevisionSubtitle : null"
			@cancel="openChangeLogDetail = false"
		>
			<div class="px-40px">
				<div v-for="item in detailRevisionDataChange" :key="item.key" class="item-detail-revision text-15px">
					<div class="text-16px font-600 mb-8px">{{ convertToDisplayName(item?.key) }} </div>
					<div class="px-10px py-5px text-[var(--theme--danger)] bg-[var(--red-10)]">- <span class="ml-20px">{{ item?.newValue }}</span></div>
					<div class="px-10px py-5px text-[var(--theme--success)] bg-[var(--green-10)]">- <span class="ml-20px">{{ item?.oldValue }}</span></div>
				</div>
			</div>
		</v-drawer>
		<!-- confirm delete group -->
		<v-dialog :model-value="isOpenDialogConfirmDeleteGroup" @esc="cancelDeleteGroup()">
            <div class="confirm-delete">
                <v-card>
                    <v-card-title>Are you sure</v-card-title>
                    <v-card-text>
                        Are you sure you want to Delete this group?. You can’t undo this action
                    </v-card-text>
                    <v-card-actions>
                        <v-button secondary @click="cancelDeleteGroup()">Cancel</v-button>
                        <v-button class="button-confirm-delete" @click="handleConfirmDeleteGroup">Delete</v-button>
                    </v-card-actions>
                </v-card>
            </div>
        </v-dialog>

		<!-- drawer-item, changelog popup -->
	</div>
	<!-- <div class="boards-layout"></div> -->
</template>
<script setup lang="ts">
import { useCollection, useApi, useSync } from "@directus/extensions-sdk";
import { Field, Filter, Item } from "@directus/types";
import { ref, computed, defineComponent, PropType, toRefs, defineOptions, inject } from "vue";
import { useI18n } from 'vue-i18n';
import Group from "./components/group.vue";
import { LayoutOptions } from "./types";
import Draggable from 'vuedraggable';
import { notify } from '../share/utils/notify';
import { formatDateTime, convertToDisplayName } from '../share/utils/formatData'
import { partImage } from '../share/utils/part-image'
import { ValueIteratee } from "lodash";

defineOptions({ inheritAttrs: false });

interface Props {
	layoutOptions?: LayoutOptions;
	collection: string;
	primaryKeyField?: Record<string, any> | null;
	filter?: Filter | null;
	search?: string | null;
	groupCollection?: string | null;
	groupedItems?: Group[];
	groupTitle?: string | null;
	changeGroupSort: (event: ChangeEvent<Group>) => void;
	addGroup: (title: string) => Promise<void>;
	editGroup: (id: string | number, title: string) => Promise<void>;
	deleteGroup: (id: string | number) => Promise<void>;
	isRelational?: boolean;
	sortField?: string | null;
	userField?: string | null;
	groupsSortField?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	layoutOptions: () => ({}),
	collection: null,
	primaryKeyField: null,
	filter: null,
	search: null,

	groupCollection: null,
	fieldsInCollection: () => [],
	groupedItems: () => [],
	groupTitle: null,
	isRelational: true,
	sortField: null,
	userField: null,
	groupsSortField: null,
});

const emit = defineEmits(['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width', 'update:groupTitle']);

const { t } = useI18n();
const api = useApi();
const editDialogOpen = ref<string | number | null>(null);
const editTitle = ref('');
const editValue = ref('')
function openEditGroup(group: Group) {
	console.log('group',group);
	
	editDialogOpen.value = group.id;
	editTitle.value = group.title;
	editValue.value = group.id
}
const showRequiredTitleGroup = ref(false)
const showRequiredValueGroup = ref(false)
const showRequiredIdDuplicate = ref(false)
function cancelChanges() {
	editDialogOpen.value = null;
	editTitle.value = '';
	editValue.value = '';
	showRequiredTitleGroup.value = false
	showRequiredValueGroup.value = false
	showRequiredIdDuplicate.value = false
}

const isOpenDialogConfirmDeleteGroup = ref(false)
const valueIdDeleteGroup = ref(null)
function handDeleteGroup(id: string) {
	isOpenDialogConfirmDeleteGroup.value = true
	valueIdDeleteGroup.value = id
}
function cancelDeleteGroup() {
	isOpenDialogConfirmDeleteGroup.value = false
}
function handleConfirmDeleteGroup() {
	try {
		props.deleteGroup(valueIdDeleteGroup.value);
		notify({
            title: `${valueIdDeleteGroup.value} has been deleted`
        });
		isDeletedGroup.value = true
	}catch(error) {
		notify({
			type: 'error',
            title: error
        });
	}
	props.deleteGroup(valueIdDeleteGroup.value);
	isOpenDialogConfirmDeleteGroup.value = false
}

function checkRequiredTitle() {
	if(editTitle.value) {
		showRequiredTitleGroup.value = false
	}
	else {
		showRequiredTitleGroup.value = true
	}
}

function checkRequiredValue() {
	if(editValue.value) {
		showRequiredValueGroup.value = false
	}
	else {
		showRequiredValueGroup.value = true
	}
}

function saveChanges() {
	const isIdDuplicate  = props?.groupedItems.some(obj => obj.id === editValue.value)	
	if(!editTitle.value) {
		showRequiredTitleGroup.value = true
	}
	else if (!editValue.value) {
		showRequiredValueGroup.value = true
	}
	else if (isIdDuplicate) {
		showRequiredIdDuplicate.value = true
	}
	else {
		if (editDialogOpen.value === '+') {
			props.addGroup(editTitle.value, editValue.value);
		} else if (editDialogOpen.value) {
			props.editGroup(editDialogOpen.value, editTitle.value, editValue.value);
		}
		editDialogOpen.value = null;
		editTitle.value = '';
		editValue.value = '';
		showRequiredTitleGroup.value = false
		showRequiredValueGroup.value = false
		showRequiredIdDuplicate.value = false
	}
}
const openDrawerCreateItem = ref(false)
const openDrawerItemEdit = ref(false)
const reloadGroup = ref(false)
const edits = ref({});
function handleOpenDrawerCreateItem (fieldValue: string) {
	edits.value = {
		[field.value.field]: fieldValue,
	}
	
	openDrawerCreateItem.value = true
}
const dataItemCreated = ref({})
async function handleCreateItem(data: any) {
	
	if (!data) return;
	try {
		reloadGroup.value = false;
		const res = await api.post(`/items/${collectionKey.value}`, data);
		dataItemCreated.value = res.data.data
		reloadGroup.value = true;
		notify({
            title: `Successfully created ${data.title} item`
        });
		
	} catch (error) {
		notify({
            title: error
        });
	}

}
const listItems = ref([])
const valueIndex = ref<Number>(0)
const disablePrevItem = ref(false);
const disableNextItem = ref(false);

function handleOpenDrawerEditItem(items: Array, item: Object, index: Number) {
	listItems.value = items
	valueIndex.value = index
	
	if (listItems.value.length === 1) {
		disablePrevItem.value = true;
		disableNextItem.value = true;
	}
	else if (index === 0) {
		disablePrevItem.value = true;
		disableNextItem.value = false;
	} else if (index === listItems.value.length - 1) {
		disablePrevItem.value = false;
		disableNextItem.value = true;
	} else {
		disablePrevItem.value = false;
		disableNextItem.value = false;
	}
	
	Object.keys(item).forEach((key) => {
		edits.value[key] = item[key];
	});

	openDrawerItemEdit.value = true
}
const openChangeLog = ref(false)
const openChangeLogDetail = ref(false)
const listRevisions = ref([])
async function handleOpenDrawerChangeLog (item: Item) {
	const res = await api.get('revisions', {
        params: {
            fields: ['activity.*','activity.user.*', 'data'],
			sort: ['-activity.timestamp'],
            filter: {
                collection: {
                    _eq: collectionKey.value,
                },
                item: {
                    _eq: item?.[props.primaryKeyField?.field],
                },
                // version: {
                //     _null: true,
                // },
            },
        }
    })
	listRevisions.value = res.data.data
	listRevisions.value.map(async (e) => {
		if(e?.data?.user_updated) {
			const resUserUpdate = await api.get(`users/${e?.data?.user_updated}`, {
				params: {
					fields: ['avatar'],
				}
			})
			e['dataUserUpdate'] = resUserUpdate.data.data
			
		}	
	})
	console.log('listRevisions.value',listRevisions.value);
	openChangeLog.value = true
	
}

const detailRevisionSubtitle = ref('')
const detailRevisionDataChange = ref({})

function handleOpenChangeLogDetail(item, index) {
	detailRevisionSubtitle.value = `${formatDateTime(item?.activity?.timestamp)} by ${item?.activity?.user?.email}`
	
	const differences = [];

	for (let key in item?.data) {
		if (key !== 'id') {
			const oldValue = item?.data[key];
			const newValue = listRevisions.value[index + 1]?.data[key];

			if ((oldValue !== newValue) && 
				((oldValue !== null && oldValue !== undefined) || 
				(newValue !== null && newValue !== undefined))) {
			differences.push({ key, oldValue, newValue });
			}
		}
	}

	for (let key in listRevisions.value[index + 1]?.data) {
		if (key !== 'id') {
			const oldValue = null;
			const newValue = listRevisions.value[index + 1]?.data[key];

			if (!item?.data.hasOwnProperty(key) && 
				((newValue !== null && newValue !== undefined))) {
			differences.push({ key, oldValue, newValue });
			}
		}
	}
	detailRevisionDataChange.value = differences
	openChangeLogDetail.value = true
}

function handleNextItem() {
	openDrawerItemEdit.value = false
	setTimeout(() => {
		handleOpenDrawerEditItem(listItems.value, listItems.value[valueIndex.value + 1], valueIndex.value + 1)
	},100)

}
function handlePreItem() {
	openDrawerItemEdit.value = false

	setTimeout(() => {
		handleOpenDrawerEditItem(listItems.value, listItems.value[valueIndex.value - 1], valueIndex.value - 1)
	},100)
}
async function handleEditItem(data: any) {
	let dataEdit = {};
	let isEmpty = true
	Object.keys(data).forEach(key => {
		if (edits.value[key] !== data[key]) {
			dataEdit[key] = data[key];
			isEmpty = false
		}
	});
    if (isEmpty) {
		openDrawerItemEdit.value = true;
		notify({
				type: 'error',
				title: `Edit canceled`
			});
	}
	else {
		try {
			reloadGroup.value = false;
			const res = await api.patch(`/items/${collectionKey.value}/${edits.value.id}`, dataEdit);
			dataItemCreated.value = res.data.data
			reloadGroup.value = true;
			openDrawerItemEdit.value = false;
			notify({
				title: `${edits.value.title} has been successfully edited`
			});
		} catch (error) {
			notify({
				title: error
			});
		}
	}
}
const { collection: collectionKey, layoutOptions } = toRefs(props);
const collection = useCollection(collectionKey);

const field = computed<Field | undefined>(() =>
	collection.fields.value.find(
		(f) => f.field == layoutOptions.value?.groupField
	)
);
const choices = computed<{ text: string }[]>(
	() => field.value?.meta?.options?.choices || []
);
</script>
<style scoped>
.boards-layout {
	padding: var(--content-padding);
	padding-top: 0;
	display: flex;
	align-items: stretch;
	gap: var(--content-padding);
}
.kanboard {
	display: flex;
	height: calc(100% - 65px - 2 * 24px);
	padding: 0px 32px 24px 32px;
	overflow-x: auto;
	overflow-y: hidden;
	--user-spacing: 16px;

	.draggable {
		display: flex;

		.group {
			display: flex;
			flex-direction: column;
			width: 320px;
			padding: 8px 0;
			background-color: var(--theme--background-subdued);
			border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
			border-radius: var(--theme--border-radius);
			margin-right: 20px;
			transition: border-color var(--transition) var(--fast);

			&:active {
				border-color: var(--theme--form--field--input--border-color-hover);
				cursor: move;
			}
		}
	}
}
.disable-button-next-pre {
	pointer-events: none;
	cursor: not-allowed !important;
	background: var(--purple-10);
	opacity: 0.5;
}
.item-change-log {
	--v-icon-size: 15px;
	display: flex;
	padding: 10px 40px;
}
.item-change-log:hover {
	background-color: var(--blue-10);
}
.render-thumbnail {
    aspect-ratio: 16/9;
    height: 100%;
	width: 100%;
    object-fit: cover;
    border-radius: 50%;
}
.item-detail-revision {
	font-size: 15px;
	margin-bottom: 20px;
}
.item-detail-revision:first-child {
	margin-bottom: 0;
}
.add-group {
	min-width: 252px;
	height: 44px;
	display: flex;
	align-items: center;
	background-color: var(--background-normal-alt);
	padding: 14px 0;
	padding-left: 12px;
	border-radius: 4px;
	cursor: pointer;
}
.confirm-delete .v-card-title {
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
}
.confirm-delete .v-card-text  {
    text-align: center;
    font-size: 16px;
    font-weight: 600;
}
.button-confirm-delete {
	--v-button-background-color: var(--theme--danger);
    --v-button-background-color-hover: var(--danger-125);
    --v-button-background-color-active: var(--theme--danger);
}

</style>