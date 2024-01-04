<template>
    <section class="group">
        <header>
            <div class="w-55% flex gap-5px items-center">
                <!-- <component :is="`display-${field?.meta?.display}`" v-bind="field?.meta?.display_options" :type="field?.type" :value="fieldValue" /> -->
                <span v-if="layoutOptions?.showIndex">{{ groupIndex + 1 }} -</span>
                <div class="capitalize" @click="valueOpenEditGroupTitle = true">{{ groupTitle }}</div>
            </div>
            <div class="flex relative">
                <v-button 
                    class="button-header" 
                    @click="handleCreateItem"
                    v-tooltip.bottom="'Create Item'"
                    icon
                >
                    <v-icon name="add" />
                </v-button>
                <v-menu show-arrow>
                    <template #activator="{ toggle, active }">
                        <v-button 
                            class="button-header"
                            :class="{ active }"
                            @click="toggle"
                            v-tooltip.bottom="'Edit Group'" 
                            icon
                        >
                            <v-icon name="more_vert" />
                        </v-button>
                    </template>
                    <v-list @click="emit('editGroup')" class="hover:text-[var(--project-color)] list-menu-item">
                        <v-icon name="edit" class="icon-menu"/> 
                        <span class="text-14px ml-5px">Edit Group</span>
                    </v-list>
                    <v-list @click="handleDeleteGroup" class="hover:text-[var(--theme--danger)] list-menu-item">
                        <v-icon name="delete" class="icon-menu"/> 
                        <span class="text-14px ml-5px">Delete Group</span>
                    </v-list>
                </v-menu>
            </div>
        </header>
        <main class="overflow-y-auto">
            <draggable
                class="cards"
                :list="items"
                item-key="id"
                :data-group="fieldValue"
                group="cards"
                :animation="150"
                @change="change"
                >
                <template #item="{ element, index }">
                    <card
                        :layout-options="layoutOptions"
                        :item="element"
                        :data-item-id="element[primaryKeyField?.field]"
                        :collectionKey="collectionKey"
                        :primary-key-field="primaryKeyField"
                        :open-change-log="openChangeLog"
                        :open-drawer-item-edit="openDrawerItemEdit"
                        @click="handleEditItem(element ,index)"
                        @delete-item="handleDeleteItem(index)"
                        @edit-item="handleEditItem(element ,index)"
                        @open-change-log="$emit('openChangeLog', element)"
                    />
                </template>
            </draggable>
        </main>
        <div
            v-if="totalPages > 1"
            class="pagination mt-auto"
        >
            <v-pagination
                :length="totalPages"
                :total-visible="3"
                show-first-last
                :model-value="page"
                @update:model-value="page = $event"
            />
        </div>
    </section>
</template>
<script setup lang="ts">
import { computed, defineComponent, onMounted, PropType, ref, toRefs, watch } from "vue";
import { useApi, useCollection, useItems, useSync } from "@directus/extensions-sdk";
import { Field, Filter, LogicalFilterAND } from "@directus/types";
import { LayoutOptions } from "../types";
import Draggable from "vuedraggable";
import Card from "./card.vue";
interface Props {
	layoutOptions?: LayoutOptions;
	collection: string;
    primaryKeyField?: Record<string, any> | null;
	page?: number | null;
	filter?: Filter | null;
	search?: string | null;
	limit?: number | null;
	sort?: string | null;
	totalPages?: number | null;
	field?: string | null;
	fieldValue: string | null;
	isRefresh?: boolean;
    openChangeLog?: boolean;
    openDrawerItemEdit?: boolean;
    newItemData?: object
	groupCollection?: string | null;
	groupedItems?: Group[];
	groupTitle?: string | null;
    groupIndex?: number | null;
	changeGroupSort: (event: ChangeEvent<Group>) => void;
	addGroup: (title: string) => Promise<void>;
	editGroup: (id: string | number, title: string) => Promise<void>;
	deleteGroup: (id: string | number) => Promise<void>;
	isRelational?: boolean;
	sortField?: string | null;
	userField?: string | null;
	groupsSortField?: string | null;
    reloadGroup?: boolean | false;
}

const props = withDefaults(defineProps<Props>(), {
	layoutOptions: null,
	collection: null,
    primaryKeyField: null,
	filter: null,
	search: null,
	limit: 5,
	sort: null,
	isRefresh: false,

	groupCollection: null,
	fieldsInCollection: () => [],
	groupedItems: () => [],
	groupTitle: null,
	isRelational: true,
	sortField: null,
	userField: null,
	groupsSortField: null,
});

const emit = defineEmits([
    'clickItem',
    'update:isRefresh',
    'createItem',
    'editItem',
    'openChangeLog',
    'deleteGroup',
    'editGroup'
])
const valueOpenEditGroupTitle = ref(false)
const {
    primaryKeyField,
    fieldValue,
    field,
    sort,
    filter: originFilter,
    collection: collectionKey,
    search,
    layoutOptions,
} = toRefs(props);

const api = useApi()
const collection = useCollection(collectionKey)

const fields = computed<string[]>(() =>
    collection.fields.value.map((f) => f.field)
);

const filter = computed<LogicalFilterAND>(() => ({
    _and: [
        { [field.value.field]: { _eq: fieldValue.value } },
    ],
}));

// const sort = computed(() => layoutOptions.value?.sort);

watch([filter, sort, search], (after, before) => {
    if (JSON.stringify(after) != JSON.stringify(before)) {
        // pages.value = [1];
    }
});

const page = ref(1);
const limit = ref(5);



const { items, totalPages, changeManualSort, getItems, getItemCount  } = useItems(collectionKey, {
    limit,
    sort,
    search,
    page,
    filter,
    fields,
});

interface EndEvent extends CustomEvent {
    oldIndex: number;
    newIndex: number;
    from: HTMLElement;
    to: HTMLElement;
    item: HTMLElement;
}

async function change(event, group) {

    const pkField = primaryKeyField.value?.field;

    let item: string | number | undefined = undefined
    let to: string | number | undefined = undefined

    if( event.added ) {

        const id = event.added.element[pkField]
        
        const diff = {
            [pkField]: id,
            [field.value.field]: fieldValue.value,
        };
        const res = await api.patch(`items/${collectionKey.value}`, [diff]);
        item = id
        to = items.value[event.added.newIndex-1]?.[pkField];
        
        const index = items.value.findIndex(obj => {
            return res.data.data.some(item => item.id === obj.id);
        });
        
        if (index !== -1) {
            items.value.splice(index, 1, { ...res.data.data[0] });
        }
    }
    if( event.moved ) {
        const group = Object.assign({}, items.value)
        item = event.moved.element?.[pkField];
        to = group[event.moved.oldIndex]?.[pkField];

        const before = group[event.moved.newIndex+1]?.[pkField];
        const after = group[event.moved.oldIndex+1]?.[pkField];

        // to = ((event.moved.oldIndex - event.moved.newIndex) > 1) ? after : before;

        to = (event.moved.oldIndex - event.moved.newIndex) > 1 ? before : to
        to = (event.moved.newIndex - event.moved.oldIndex) > 1 ? after : to
    }

    if (item !== undefined && to !== undefined) {
        // changeManualSort({ item, to });
        const endpoint = computed(() => `/utils/sort/${collectionKey.value}`)
		await api.post(endpoint.value, { item, to })

        sort.value = sort.value
    }
}

watch(()=> props.newItemData, () => {
    let data = items.value
    let editItem = false
    data.forEach((item,index) => {
        if(props.newItemData.id === item.id){
            data[index] = props.newItemData
            editItem = true
        }
    })
    if( !editItem && props.newItemData?.[field.value.field] === fieldValue.value) {
        data=[...data, props.newItemData]
    }
    items.value = data
    getItemCount();
})

function handleCreateItem() {
    emit('createItem', fieldValue)
}
function handleDeleteItem (index: number) {
    let data = items.value
    data.splice(index,1);
    
    items.value = data
    getItemCount();
}
function handleEditItem (item: Item, index: number) {
    emit('editItem',items.value, item, index)
}
const isArrayCard = ref([])
const indexGroup = ref(null)
const data = ref([])
function handleDeleteGroup() {
    emit('deleteGroup')
}
</script>
<style scoped>
section {
    background-color: #000;
    border-radius: var(--theme--border-radius);
    flex: 0 0 320px;
    display: flex;
    flex-flow: column nowrap;
    align-items: stretch;
}

header {
    padding: 16px;
    padding-top: 0;
    display: flex;
    justify-content: space-between;
}
main {
    flex-grow: 1;
}
.edit-title-group {
    width: 100%;
    --theme--form--field--input--height: 30px;
    --theme--form--field--input--padding: 5px;
}
.cards {
    padding: 16px;
    gap: 15px;
    display: flex;
    flex-flow: column nowrap;
    flex-grow: 1;
    min-height: 100%;
}

.cards>* {
    display: flex;
    flex: 0 0 auto;
}
.button-header {
    --v-button-min-width:32px;
    --v-button-width: 32px;
    --v-button-height: 32px;
    --v-button-background-color: none;
    --v-icon-color: var(--fc-neutral-text-color);
    --v-button-background-color-hover: none;
    --v-button-background-color-active: none;
}
.button-header:hover {
    --v-icon-color: var(--theme--foreground);
}
.list-menu-item {
    cursor: pointer;
    margin: 8px;
}
.icon-menu {
    --v-icon-size: 16px;
}
.v-pagination {
    padding-top: 10px;
    justify-content: center;
}
</style>