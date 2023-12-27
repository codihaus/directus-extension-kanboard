<template>
    <section class="group">
        <header>
            <div class="w-55% flex gap-5px items-center">
                <!-- <component :is="`display-${field?.meta?.display}`" v-bind="field?.meta?.display_options" :type="field?.type" :value="fieldValue" /> -->
                <div v-if="!valueOpenEditGroupTitle" class="cursor-pointer capitalize" @click="valueOpenEditGroupTitle = true">{{ groupTitle }}</div>
                <div v-if="valueOpenEditGroupTitle" class="edit-title-group flex items-center">
                    <v-input v-model="valueGroupTitle"/>
                    <div class="text-12px text-white ml-5px px-5px py-2px bg-indigo-500 rounded-4px" @click="handleSaveEditGroup( fieldValue, valueGroupTitle)">Save</div>
                </div>
            </div>
            <div class="flex">
                <div class="delete_group" @click="$emit('deleteGroup')">
                    <v-icon name="delete" />
                </div>
                <div class="create_item" @click="$emit('createItem', fieldValue)">
                    <v-icon name="add" />
                </div>
            </div>
        </header>
        <main class="overflow-y-auto">
            <draggable
                class="cards"
                :list="items"
                item-key="id"
                :data-group="fieldValue"
                group="cards"
                @change="change"
                >
                                        <!-- @click="handleEditItem(element ,index)" -->
                <template #item="{ element, index }">
                    <card
                        :layout-options="layoutOptions"
                        :item="element"
                        :data-item-id="element[primaryKeyField?.field]"
                        :collectionKey="collectionKey"
                        :primary-key-field="primaryKeyField"
                        @delete-item="handleDeleteItem"
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
import { computed, defineComponent, PropType, ref, toRefs, watch } from "vue";
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
const valueGroupTitle = ref(props.groupTitle)
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



const { items, totalPages, changeManualSort, getItems  } = useItems(collectionKey, {
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
        await api.patch(`items/${collectionKey.value}`, [diff]);
        item = id
        to = items.value[event.added.newIndex-1]?.[pkField];
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
watch(()=> props.reloadGroup, (newValue) => {
    if(newValue === true) {
        getItems();   
    }
})
function handleDeleteItem () {
    getItems()
}
function handleEditItem (item: Item, index: number) {
    emit('editItem',items.value, item, index)
}
function handleSaveEditGroup(id: string | number, value: string){
    emit('editGroup', id, value)
    
    valueOpenEditGroupTitle.value = false
}
</script>
<style scoped>
section {
    background-color: var(--theme--background-normal);
    border-radius: var(--theme--border-radius);
    flex: 0 0 320px;
    display: flex;
    flex-flow: column nowrap;
    align-items: stretch;
}

header {
    padding: 16px 16px 0 16px;
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
    gap: 10px;
    display: flex;
    flex-flow: column nowrap;
    flex-grow: 1;
}

.cards>* {
    display: flex;
    flex: 0 0 auto;
}

.cards>*:last-child {
    flex-grow: 1;
}
</style>