<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row>
                <v-col>
                    <v-card>
                        <v-card-title class="text-center text-h5">
                            채팅방목록
                            <div class="d-flex justify-end">
                                <!-- <v-btn color="secondary" @click="showCreateRoomModal=true">채팅방 생성</v-btn> -->
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-table>
                                <thead>
                                    <tr>
                                        <th>방번호</th>
                                        <th>방제목</th>
                                        <th>채팅</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="chat in chatRoomList " :key="chat.roomId">
                                        <td>{{ chat.roomId }}</td>
                                        <td>{{ chat.roomName }}</td>
                                        <td>
                                            <v-btn color="primary" @click="selectRoom(chat.roomId)">
                                                선택
                                            </v-btn>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
            <v-dialog v-model="showCreateRoomModal" max-width="500px">
                <v-card>
                    <v-card-title class="text-h6">
                        채팅방 생성
                    </v-card-title>
                    <v-card-text>
                        <v-text-field label="방제목" v-model="newRoomTitle" />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn color="grey" @click="showCreateRoomModal = false">
                            취소
                        </v-btn>
                        <v-btn color="primary" @click="createChatRoom">
                            생성
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
    </div>
</template>

<script>
import axios from 'axios';

    export default {
        props: {
            embedded: { type: Boolean, default: false }
        },
        data() {
            return {
                chatRoomList: [],
                showCreateRoomModal: false,
                newRoomTitle: "",

            }
        },
        async created() {
            this.loadChatRooms();
        },
        methods: {
            selectRoom(roomId) {
                this.$emit('select-room', roomId);
            },
            async createChatRoom() {
                // const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                // await axios.post(`${baseURL}/chat/room/group/create?roomName=${this.newRoomTitle}`, null);
                // this.showCreateRoomModal = false;
                // this.loadChatRooms();
            },
            async loadChatRooms() {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                const response = await axios.get(`${baseURL}/chat-service/chat/room/list/1`);
                this.chatRoomList = response.data.result;
            }
        }
    }
</script>

<style scoped>
.main-fill {
  position: fixed;
  top: 64px;
  left: 240px;
  right: 0;
  bottom: 0;
  background-color: #F5F5F5;
}
</style>