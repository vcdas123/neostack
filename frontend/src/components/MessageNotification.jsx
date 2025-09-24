import { useEffect, useState } from "react";
import { X, MessageCircle } from "lucide-react";

const MessageNotification = ({ message, sender, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 max-w-sm transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-base-content truncate">
              {sender?.fullName || "Unknown User"}
            </p>
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-base-content/60 hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-base-content/80 line-clamp-2">
            {message?.text || "Sent an image"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageNotification;