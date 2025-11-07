import React from "react";
import { MoreHorizontal } from "lucide-react";

interface TwitterCardProps {
  name: string;
  username: string;
  tweet: string;
  date: string;
  time: string;
  avatarUrl?: string;
  verified?: boolean;
  link?: string;
}

export const TwitterCard: React.FC<TwitterCardProps> = ({
  name,
  username,
  tweet,
  date,
  time,
  avatarUrl,
  verified = false,
  link,
}) => {
  const handleClick = () => {
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={`bg-black/10 text-white rounded-sm p-6 max-w-2xl transition-all ${
        link ? "cursor-pointer hover:bg-black/20" : ""
      }`}
      onClick={handleClick}
      role={link ? "button" : undefined}
      tabIndex={link ? 0 : undefined}
      onKeyDown={(e) => {
        if (link && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-sm overflow-hidden bg-gray-800 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Username */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-white">{name}</span>
              {verified && (
                <svg
                  viewBox="0 0 22 22"
                  className="w-5 h-5 text-yellow-500 fill-current"
                  aria-label="Verified account"
                >
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path>
                </svg>
              )}
            </div>
            <span className="text-gray-400 text-sm">@{username}</span>
          </div>
        </div>

        {/* More button */}
        <button className="text-gray-400 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Tweet Content */}
      <div className="text-white text-base leading-relaxed whitespace-pre-wrap">
        {tweet}
      </div>

      {/* Date and Time */}
      <div className="mt-4 text-gray-400 text-sm">
        {date} · {time}
      </div>
    </div>
  );
};
