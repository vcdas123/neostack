import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MessageCircle, Plus } from "lucide-react";
import { formatLastMessageTime } from "../lib/utils";

const Sidebar = () => {
  const { 
    getAllUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    getUsersWithChats,
    usersWithChats,
    isChatsLoading
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "contacts"

  useEffect(() => {
    if (activeTab === "chats") {
      getUsersWithChats();
    } else {
      getAllUsers();
    }
  }, [activeTab, getAllUsers, getUsersWithChats]);

  // Re-fetch chats when usersWithChats changes to ensure fresh data
  useEffect(() => {
    if (activeTab === "chats") {
      // Small delay to ensure state has updated
      const timeoutId = setTimeout(() => {
        getUsersWithChats();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [usersWithChats.length, activeTab, getUsersWithChats]);

  const currentUsers = activeTab === "chats" ? usersWithChats : users;
  const isLoading = activeTab === "chats" ? isChatsLoading : isUsersLoading;

  const filteredUsers = showOnlineOnly
    ? currentUsers.filter(user => onlineUsers.includes(user._id))
    : currentUsers;

  if (isLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header with Tabs */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Messages</span>
        </div>
        
        {/* Tab Navigation */}
        <div className="hidden lg:flex bg-base-200 rounded-lg p-1 mb-3">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "chats"
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/70 hover:text-base-content"
            }`}
          >
            <MessageCircle className="size-4" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "contacts"
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/70 hover:text-base-content"
            }`}
          >
            <Users className="size-4" />
            Contacts
          </button>
        </div>

        {/* Mobile Tab Icons */}
        <div className="lg:hidden flex justify-center gap-2 mb-3">
          <button
            onClick={() => setActiveTab("chats")}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "chats"
                ? "bg-primary text-primary-content"
                : "text-base-content/70 hover:bg-base-200"
            }`}
          >
            <MessageCircle className="size-5" />
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "contacts"
                ? "bg-primary text-primary-content"
                : "text-base-content/70 hover:bg-base-200"
            }`}
          >
            <Users className="size-5" />
          </button>
        </div>

        {/* Online Filter */}
        <div className="hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={e => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      {/* User List */}
      <div className="overflow-y-auto w-full py-3 flex-1">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 px-4">
            <div className="flex flex-col items-center gap-2">
              {activeTab === "chats" ? (
                <>
                  <MessageCircle className="size-8 opacity-50" />
                  <p className="text-sm">No chats yet</p>
                  <p className="text-xs opacity-70 hidden lg:block">
                    Start a conversation from Contacts
                  </p>
                </>
              ) : showOnlineOnly ? (
                <>
                  <Users className="size-8 opacity-50" />
                  <p className="text-sm">No online users</p>
                </>
              ) : (
                <>
                  <Users className="size-8 opacity-50" />
                  <p className="text-sm">No contacts found</p>
                </>
              )}
            </div>
          </div>
        ) : (
          filteredUsers.map(user => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {activeTab === "chats" && user.lastMessageTime && (
                    <div className="text-xs text-zinc-500 mb-1">
                      {formatLastMessageTime(user.lastMessageTime)}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>{onlineUsers.includes(user._id) ? "Online" : "Offline"}</span>
                    {activeTab === "contacts" && (
                      <Plus className="size-3 opacity-50" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;