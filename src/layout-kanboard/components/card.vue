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
            <v-menu show-arrow v-if="isShowMenuCard">
                    <template #activator="{ toggle, active }">
                        <v-button 
                            class="button-edit-item"
                            v-tooltip.bottom="'Edit Item'"
                            :class="{ active }"
                            @click.stop="toggle" 
                            icon
                        >
                        <v-icon name="edit" />
                        </v-button>
                    </template>
                    <v-list @click.stop="handleEditItem" class="list-menu-item">
                        <span class="text-14px">Edit Item</span>
                    </v-list>
                    <v-list @click.stop="handleChangLogItem" class="list-menu-item">
                        <span class="text-14px">Changelog</span>
                    </v-list>
                    <v-list @click.stop="handleDeleteItem" class="list-menu-item">
                        <span class="text-14px">Delete Item</span>
                    </v-list>
                </v-menu>
        </header>
        <main>
            <div class="main-content">
                <display-formatted-value
                    type="text"
                    :value="item?.[layoutOptions?.textField]"
                    format
                ></display-formatted-value>
            </div>
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
import { watch } from "vue";
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
    openChangeLog?: boolean;
    openDrawerItemEdit?: boolean;
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

const isOpenConfirmDialog = ref(false)
const isShowMenuCard = ref(true)
function handleEditItem() {
    emit('editItem')
    isShowMenuCard.value = false
}
watch(()=> props.openDrawerItemEdit, (newValue) => {
    if(newValue === false) {
        isShowMenuCard.value = true
    }
})
function handleChangLogItem() {
    emit('openChangeLog')
    isShowMenuCard.value = false
}

watch(()=> props.openChangeLog, (newValue) => {
    if(newValue === false) {
        isShowMenuCard.value = true
    }
})
function handleDeleteItem() {
    isOpenConfirmDialog.value = true;
    isShowMenuCard.value = false
}
function cancelChanges() {
	isOpenConfirmDialog.value = false;
    isShowMenuCard.value = true
}
async function handleConfirmDelete(item: Object) {
 try {
        await api.delete(`/items/${props.collectionKey}/${item?.[props.primaryKeyField.field]}`);
        isShowMenuCard.value = true
        emit('deleteItem', item)
        isOpenConfirmDialog.value = false
        notify({
            title: `Item ${item.title} has been deleted successfully`
        });
    } catch (error) {
        notify({
            title: error
        });
    }
}
</script>

<style scoped>
.card {
    display: flex;
    flex-flow: column nowrap;
    gap: 12px;
    flex-grow: 1;
    min-height: 100%;
    border-radius: 4px;
    box-shadow: 0px 1px 4px 0px rgba(var(--card-shadow-color), 0.05);
    background-color: var(--theme--background);
    align-items: stretch;
    cursor: pointer;
    border: 1px solid var(--theme--form--field--input--border-color)
}
.card:hover .card-title {
    text-decoration-line: underline
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
    flex-wrap: wrap;
    justify-content: end;
    align-items: end;
    gap: 5px;
}
.main-content {
    width: 100%;
    flex-wrap: wrap;

    display: -webkit-box;
    max-height: 50px;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    -webkit-line-clamp: 2;
    line-height: 25px;
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
    right: 15px;
    top: 18px;
    --v-button-min-width:32px;
    --v-button-width: 32px;
    --v-button-height: 32px;
    --v-icon-color:  var(--fc-neutral-text-color);
    font-size: 16px;
    border-radius: 4px;
    --v-button-background-color: none;
    --v-icon-size: 16px;
    opacity: 0;
    --v-button-background-color-hover: none !important;
}
.button-edit-item:hover {
    --v-icon-color: var(--theme--foreground);
}
.card:hover .button-edit-item {
    opacity: 1;
}
.button-edit-item::before {
    content: '';
    width: 100%;
    height: 100%;
    opacity: 0.4;
    background-color:var(--theme--form--field--input--border-color);
    right: 0;
    position: absolute;
    border-radius: 4px;

}
.button-edit-item:hover::before {
    opacity: 1;
    background-color: var(--theme--form--field--input--border-color-hover) ;
}
.active {
    opacity: 1;
    --v-button-background-color-active: none !important;
}
.list-menu-item {
    cursor: pointer;
    margin: 8px;
}
.list-menu-item:hover {
    color: var(--project-color)
}
.confirm-delete .v-card-title  {
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