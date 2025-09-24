import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isUploading) {
      toast.error("Please wait for image to finish uploading");
      return;
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="p-4 w-full">
      {(imagePreview || isUploading) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {isUploading ? (
              <div className="w-20 h-20 rounded-lg border border-zinc-700 bg-base-200 flex items-center justify-center">
                <div className="loading loading-spinner loading-sm"></div>
              </div>
            ) : (
              <>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                  flex items-center justify-center hover:bg-base-200 transition-colors"
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </>
            )}
          </div>
          {isUploading && (
            <span className="text-sm text-base-content/60">Uploading image...</span>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isUploading}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isUploading}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}
                     ${isUploading ? "loading" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <Image size={20} />
            )}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={(!text.trim() && !imagePreview) || isUploading}
        >
          {isUploading ? (
            <div className="loading loading-spinner loading-xs"></div>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
};
export default MessageInput;