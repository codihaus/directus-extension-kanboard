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
            <v-button 
                class="button-edit-item" 
                :class="{'show-button-edit-item': isShowMenuEdit === item?.[props.primaryKeyField.field]}"
                icon
                @click.stop="handleShowMenuEdit(item)"
            >
                <v-icon name="edit" />
            </v-button>
            <ul class="menu-edit" :class="{'show-menu-edit': isShowMenuEdit === item?.[props.primaryKeyField.field]}">
                <li @click.stop="handleEditItem">Edit Item</li>
                <li @click.stop="$emit('openChangeLog')">Change log</li>
                <li @click.stop="handleDeleteItem()">Delete</li>
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
        <!-- confirm delete -->
        <v-dialog :model-value="isOpenConfirmDialog" @esc="cancelChanges()">
            <div class="confirm-delete">
                <v-card>
                    <v-card-title>Are you sure</v-card-title>
                    <v-card-text>
                        Are you sure you want to Delete this card?. You can’t undo this action
                    </v-card-text>
                    <v-card-actions>
                        <v-button secondary @click="cancelChanges()">Cancel</v-button>
                        <v-button class="button-confirm-delete" @click="handleConfirmDelete(item)">Delete</v-button>
                    </v-card-actions>
                </v-card>
            </div>
        </v-dialog>
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
const isOpenConfirmDialog = ref(false)
function cancelChanges() {
	isOpenConfirmDialog.value = false;
}
function handleDeleteItem() {
    isOpenConfirmDialog.value = true;
}
async function handleConfirmDelete(item: Object) {
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
    gap: 8px;
    flex-grow: 1;
    border-radius: 4px;
    box-shadow: 0px 1px 4px 0px rgba(var(--card-shadow-color), 0.05);
    background-color: var(--theme--background);
    align-items: stretch;
    cursor: pointer;
}
.card:hover {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
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
    padding-bottom: 12px;
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
    max-width: 100%;
    object-fit: contain;
    border-radius: 6px;
}
.card-image-fill {
    width:250px;
    height:150px;
    object-fit: cover;
}
.button-edit-item {
    position: absolute;
    right: 25px;
    top: 20px;
    --v-button-min-width:32px;
    --v-button-width: 32px;
    --v-button-height: 32px;
    color: #fff;
    font-size: 16px;
    border-radius: 4px;
    --v-button-background-color: none;
    --v-icon-size: 16px;
    opacity: 0;
}
.card:hover .button-edit-item {
    opacity: 1;
}
.show-button-edit-item {
    opacity: 1 !important;
}
.button-edit-item::before {
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
.confirm-delete .v-card-title, .confirm-delete .v-card-text  {
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
}
.confirm-delete .v-card-text  {
    text-align: center;
    font-size: 12px;
    font-weight: 400;
}
.button-confirm-delete {
    --v-button-background-color: #EF4444
}
</style>