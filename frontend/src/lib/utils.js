export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatLastMessageTime(date) {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else if (diffInHours < 24 * 7) {
    return messageDate.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return messageDate.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  }
}