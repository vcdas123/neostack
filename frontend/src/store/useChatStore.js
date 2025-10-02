import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  usersWithChats: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isChatsLoading: false,
  notifications: [],

  getAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getUsersWithChats: async () => {
    set({ isChatsLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      // Sort users by last message time (most recent first)
      const sortedUsers = res.data.sort((a, b) => {
        const aTime = new Date(a.lastMessageTime || a.createdAt);
        const bTime = new Date(b.lastMessageTime || b.createdAt);
        return bTime - aTime;
      });
      set({ usersWithChats: sortedUsers });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  getMessages: async userId => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async messageData => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
      
      // Update user list order after sending message
      get().updateUserOrder(selectedUser._id);
      
      // Refresh chat list to ensure sender appears in chats
      const { usersWithChats } = get();
      const existsInChats = usersWithChats.find(user => user._id === selectedUser._id);
      if (!existsInChats) {
        const updatedChats = [{
          ...selectedUser,
          lastMessageTime: res.data.createdAt
        }, ...usersWithChats];
        set({ usersWithChats: updatedChats });
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateUserOrder: (userId) => {
    const { users, usersWithChats } = get();
    const currentTime = new Date().toISOString();
    
    // Update users list
    const updatedUsers = [...users];
    const userIndex = updatedUsers.findIndex(user => user._id === userId);
    
    if (userIndex > 0) {
      const user = updatedUsers.splice(userIndex, 1)[0];
      updatedUsers.unshift(user);
      set({ users: updatedUsers });
    }

    // Update usersWithChats list
    const updatedChats = [...usersWithChats];
    const chatIndex = updatedChats.findIndex(user => user._id === userId);
    
    if (chatIndex >= 0) {
      const user = updatedChats.splice(chatIndex, 1)[0];
      updatedChats.unshift({
        ...user,
        lastMessageTime: currentTime
      });
      set({ usersWithChats: updatedChats });
    }
  },

  addNotification: (message, sender) => {
    const { notifications } = get();
    const newNotification = {
      id: Date.now(),
      message,
      sender,
      timestamp: new Date()
    };
    set({ notifications: [...notifications, newNotification] });
  },

  removeNotification: (notificationId) => {
    const { notifications } = get();
    set({ notifications: notifications.filter(n => n.id !== notificationId) });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", newMessage => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  subscribeToAllMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", newMessage => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      const { selectedUser, users, usersWithChats } = get();
      
      // Don't process messages sent by current user
      if (newMessage.senderId === currentUserId) return;
      
      // Find sender in users list
      const sender = users.find(user => user._id === newMessage.senderId);
      
      // Show notification if message is not from currently selected user
      if (!selectedUser || newMessage.senderId !== selectedUser._id) {
        if (sender) {
          get().addNotification(newMessage, sender);
        }
      }
      
      // Update chat order and refresh chat list
      get().updateUserOrder(newMessage.senderId);
      
      // If sender is not in usersWithChats, add them
      const existsInChats = usersWithChats.find(user => user._id === newMessage.senderId);
      if (!existsInChats && sender) {
        const updatedChats = [{
          ...sender,
          lastMessageTime: newMessage.createdAt
        }, ...usersWithChats];
        set({ usersWithChats: updatedChats });
      }
      
      // If message is from selected user, add to messages
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: selectedUser => set({ selectedUser }),
}));