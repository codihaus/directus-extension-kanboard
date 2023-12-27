<template>
    <v-menu>
        <template #activator="{ toggle }">
            <div v-tooltip.top="'sort_field'" class="sort-selector" @click="toggle">
                {{ sortKey ? fields[sortKey]?.name : "--" }}
            </div>
        </template>
        <v-list>
            <v-list-item v-for="field in fields" :key="field.field" :disabled="field['disabled']"
                :active="sortWritable ? field.field === sortKey : false" clickable @click="sortWritable = [field.field]">
                <v-list-item-content>{{ field.name }}</v-list-item-content>
            </v-list-item>
        </v-list>
    </v-menu>
</template>
<script setup lang="ts">
import { computed, defineComponent, PropType, toRefs, defineOptions } from "vue";
import { useCollection, useSync } from "@directus/extensions-sdk";
import { Field } from "@directus/types";
import { LayoutOptions } from "./types";


defineOptions({ inheritAttrs: false });

const emit = defineEmits(['update:layoutOptions'])

interface Props {
	layoutOptions?: LayoutOptions;
	collection: string;
}

const props = withDefaults(defineProps<Props>(), {
	layoutOptions: () => ({}),
	collection: null,
	filter: null,
	search: null
});

const { collection: collectionKey } = toRefs(props);
const collection = useCollection(collectionKey);

const layoutOptions = useSync(props, "layoutOptions", emit);
const sortWritable = computed({
    get() {
        return layoutOptions.value?.sort;
    },
    set(newValue) {
        layoutOptions.value = Object.assign({}, layoutOptions.value, {
            sort: newValue,
        });
    },
});

const sortKey = computed(() =>
    sortWritable.value ? sortWritable.value["0"] : null
);

const fields = computed<Record<string, Field>>(() =>
    Object.fromEntries(collection.fields.value.map((f) => [f.field, f]))
);

</script>
  
<style>
.sort-selector {
    margin-right: 8px;
    transition: color var(--fast) var(--transition);
}

.sort-selector:hover {
    color: var(--foreground-normal);
    cursor: pointer;
}
</style>