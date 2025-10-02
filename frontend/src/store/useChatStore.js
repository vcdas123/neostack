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
      set({ usersWithChats: res.data });
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
      
      // Move this chat to top after sending
      get().moveUserToTop(selectedUser._id, res.data.createdAt);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Simple function to move a user to top of chat list
  moveUserToTop: (userId, messageTime) => {
    const { usersWithChats, users } = get();
    
    // Update usersWithChats
    const updatedChats = [...usersWithChats];
    const chatIndex = updatedChats.findIndex(user => user._id === userId);
    
    if (chatIndex > -1) {
      // Remove from current position and add to top with updated time
      const [user] = updatedChats.splice(chatIndex, 1);
      updatedChats.unshift({
        ...user,
        lastMessageTime: messageTime
      });
    } else {
      // If user not in chats, find them in users and add to top
      const userFromContacts = users.find(user => user._id === userId);
      if (userFromContacts) {
        updatedChats.unshift({
          ...userFromContacts,
          lastMessageTime: messageTime
        });
      }
    }
    
    set({ usersWithChats: updatedChats });
  },

  // Add notification
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

  // Remove notification
  removeNotification: (notificationId) => {
    const { notifications } = get();
    set({ notifications: notifications.filter(n => n.id !== notificationId) });
  },

  // Subscribe to messages for selected user only
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", newMessage => {
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageFromSelectedUser) return;

      // Add message to current chat
      set({ messages: [...get().messages, newMessage] });
      
      // Move this chat to top
      get().moveUserToTop(newMessage.senderId, newMessage.createdAt);
    });
  },

  // Subscribe to all messages for notifications and chat list updates
  subscribeToAllMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", newMessage => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      const { selectedUser, users } = get();
      
      // Skip if message is from current user
      if (newMessage.senderId === currentUserId) return;
      
      // Always move sender to top of chat list
      get().moveUserToTop(newMessage.senderId, newMessage.createdAt);
      
      // Show notification only if not viewing this chat
      const isViewingThisChat = selectedUser && selectedUser._id === newMessage.senderId;
      if (!isViewingThisChat) {
        // Find sender info
        const sender = users.find(user => user._id === newMessage.senderId) || 
                     get().usersWithChats.find(user => user._id === newMessage.senderId);
        
        if (sender) {
          get().addNotification(newMessage, sender);
        }
      } else {
        // If viewing this chat, add message to current messages
        set({ messages: [...get().messages, newMessage] });
      }
    });
  },

  // Unsubscribe from messages
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  // Set selected user
  setSelectedUser: selectedUser => set({ selectedUser }),
}));