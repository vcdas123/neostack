import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  notifications: [],

  getAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      // Sort users by last message time
      const sortedUsers = res.data.sort((a, b) => {
        const aTime = new Date(a.lastMessageTime || a.createdAt);
        const bTime = new Date(b.lastMessageTime || b.createdAt);
        return bTime - aTime;
      });
      set({ users: sortedUsers });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
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
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateUserOrder: (userId) => {
    const { users } = get();
    const updatedUsers = [...users];
    const userIndex = updatedUsers.findIndex(user => user._id === userId);
    
    if (userIndex > 0) {
      const user = updatedUsers.splice(userIndex, 1)[0];
      updatedUsers.unshift(user);
      set({ users: updatedUsers });
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
      console.log("New message received:", newMessage);
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
      
      // Update user order when receiving message
      get().updateUserOrder(selectedUser._id);
    });
  },

  subscribeToAllMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser, users } = get();

    socket.on("newMessage", newMessage => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      // Only show notification if message is not from current user and not in current chat
      if (newMessage.senderId !== currentUserId && 
          (!selectedUser || newMessage.senderId !== selectedUser._id)) {
        
        const sender = users.find(user => user._id === newMessage.senderId);
        get().addNotification(newMessage, sender);
        
        // Update user order
        get().updateUserOrder(newMessage.senderId);
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: selectedUser => set({ selectedUser }),
}));