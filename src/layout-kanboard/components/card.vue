<template>
    <section class="card drag-handle">
        <header>
            <v-image 
                v-if="item?.[layoutOptions?.imageSource]" 
                class="render-thumbnail" 
                :class="{'card-image-fill': layoutOptions?.crop}"
                :src="partImage(item?.[layoutOptions?.imageSource])" 
            />
            <display-formatted-value
                type="text"
                :value="item?.[layoutOptions?.titleField]"
                format
                class="card-title"
            ></display-formatted-value>
            <div class="button-edit" @click.stop="handleShowMenuEdit(item)">
                <v-icon name="edit" />
            </div>
            <ul class="menu-edit" :class="{'show-menu-edit': isShowMenuEdit === item?.[props.primaryKeyField.field]}">
                <li @click.stop="handleEditItem">Edit Item</li>
                <li @click.stop="$emit('openChangeLog')">Change log</li>
                <li @click.stop="handleDeleteItem(item)">Delete</li>
            </ul>
        </header>
        <main v-if="layoutOptions?.cardContentTemplate">
            <display-formatted-value
                type="text"
                :value="item?.[layoutOptions?.textField]"
                format
            ></display-formatted-value>
            <div class="w-24px h24px">
                <v-image v-if="avatarUserCreate" class="render-avatar-user-created" :src="partImage(avatarUserCreate)" />
                <v-icon v-else name="person" />
            </div>
        </main>
    </section>
</template>

<script setup lang="ts">
import { Filter } from "@directus/types";
import { LayoutOptions } from '../types';
import { ref } from "vue";
import { useApi } from '@directus/extensions-sdk';
import { partImage } from '../../share/utils/part-image'
import { notify } from '../../share/utils/notify';
interface Props {
	layoutOptions?: LayoutOptions;
    primaryKeyField?: Record<string, any> | null;
	collection?: string;
    collectionKey?: string;
	filter?: Filter | null;
	search?: string | null;
    item: Object | null
}

const props = withDefaults(defineProps<Props>(), {
	layoutOptions: {},
});
const api = useApi();

const emit = defineEmits([
    'deleteItem',
    'editItem',
    'openChangeLog'
])
const avatarUserCreate = ref(null)
async function getDataUser() {
    const res = await api.get('/users/' + props.item.user_created, {
        params: {
            fields: ['avatar']
        },
    });
    avatarUserCreate.value = res?.data?.data?.avatar
}
getDataUser()

const isShowMenuEdit = ref(null) 
function handleShowMenuEdit(item: Object) {
    if(isShowMenuEdit.value !== null) {
        isShowMenuEdit.value = null
    }
    else {
        isShowMenuEdit.value = item?.[props.primaryKeyField.field]
    }
    
}
async function handleDeleteItem(item: Object) {
    try {
        await api.delete(`/items/${props.collectionKey}/${item?.[props.primaryKeyField.field]}`);
        isShowMenuEdit.value = null;
        emit('deleteItem')
        notify({
            title: `Item ${item.title} has been deleted successfully`
        });
    } catch (error) {
        notify({
            title: error
        });
    }
}
function handleEditItem() {
    emit('editItem')
    isShowMenuEdit.value = null
}
</script>

<style scoped>
.card {
    display: flex;
    flex-flow: column nowrap;
    flex-grow: 1;
    gap: 8px;
    align-items: stretch;
    cursor: pointer;
}

.card {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    border-radius: 4px;
    box-shadow: 0px 1px 4px 0px rgba(var(--card-shadow-color), 0.05);
    background-color: var(--theme--background);
}

.card>* {
    padding-left: 16px;
    padding-right: 16px;
}

.card>*:first-child {
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    padding-top: 16px;
}

.card>*:last-child {
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
    padding-bottom: 16px;
}

header {
    /* display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 16px; */
    font-weight: 700;
    position: relative;
}

header>.card-title {
    white-space: inherit;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

header>.card-title.muted {
    color: var(--foreground-subdued);
}

.card-icon {
    width: 48px;
    height: 48px;
    background-color: var(--background-subdued);
    border-radius: var(--border-radius);
    font-size: 32px;
    flex: 0 0 48px;
    display: flex;
    justify-content: stretch;
    align-items: stretch;
}
main {
    display: flex;
    justify-content: space-between;
}

.card-icon>.card-icon-inner {
    padding: 0;
    flex-grow: 1;
    text-align: center;
}
.render-avatar-user-created {
    aspect-ratio: 1/1;
    height: 100%;
	width: 100%;
    object-fit: cover;
    border-radius: 50%;
}
.render-thumbnail {
    aspect-ratio: 16/9;
    height: 140px;
    max-width: 100%;
    object-fit: fill;
    border-radius: 6px;
}
.card-image-fill {
    object-fit: cover !important;
}
.button-edit {
    cursor: pointer;
    position: absolute;
    right: 16px;
    top: 16px;
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 16px;
    border-radius: 4px;
}
.button-edit > .v-icon {
    width: 16px;
    min-width: 16px;
    height: 16px;
    --v-icon-size: 16px;
}
.button-edit::before {
    content: '';
    width: 100%;
    height: 100%;
    opacity: 0.4;
    background-color: #111827;
    right: 0;
    position: absolute;
    border-radius: 4px;
}
.menu-edit {
    position: absolute;
    top: 55px;
    right: 17px;
    background-color: #fff;
    list-style-type: none;
    z-index: 10;
    padding-left: 0;
    min-width: 130px;
    border-radius: 4px;
    display: none;
} 
.show-menu-edit {
    display: block;
}
.menu-edit > li {
    padding: 8px 0;
    padding-left: 16px;
    border-bottom: 1px solid #E2E8F0;
    font-weight: 400;
    font-size: 14px;
}
.menu-edit > li:hover {
    color: #4F46E5;
}
.menu-edit > li:last-child {
    border-bottom: unset;
}
</style>