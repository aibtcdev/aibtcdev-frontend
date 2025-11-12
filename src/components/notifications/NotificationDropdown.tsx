"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./NotificationProvider";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications } = useNotifications();

  // Filter out deposit notifications (they show in banner instead)
  const bellNotifications = notifications.filter(
    (n) => n.type !== "asset-deposit"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) {
    return null;
  }

  const handleActionClick = () => {
    onClose();
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed top-16 right-4 w-80 max-w-sm z-[99999]",
        "bg-background/95 backdrop-blur-lg border border-border/20 rounded-sm shadow-2xl",
        "animate-in slide-in-from-top-2 duration-200"
      )}
      style={{ zIndex: 99999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {bellNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {bellNotifications.map((notification) => {
              const IconComponent = notification.icon;

              return (
                <div
                  key={notification.id}
                  className="group relative p-3 rounded-sm hover:bg-primary/5 transition-colors duration-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-sm flex items-center justify-center",
                          notification.type === "asset-deposit" &&
                            "bg-yellow-500/20",
                          notification.type === "custom-instructions" &&
                            "bg-blue-500/20",
                          notification.type === "info" && "bg-blue-500/20",
                          notification.type === "warning" && "bg-orange-500/20",
                          notification.type === "success" && "bg-green-500/20"
                        )}
                      >
                        {IconComponent ? (
                          <IconComponent
                            className={cn(
                              "h-4 w-4",
                              notification.type === "asset-deposit" &&
                                "text-yellow-500",
                              notification.type === "custom-instructions" &&
                                "text-blue-500",
                              notification.type === "info" && "text-blue-500",
                              notification.type === "warning" &&
                                "text-orange-500",
                              notification.type === "success" &&
                                "text-green-500"
                            )}
                          />
                        ) : (
                          <div className="h-2 w-2 bg-primary rounded-sm" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                      </div>

                      {/* Action Button */}
                      {notification.actionText && notification.actionUrl && (
                        <div className="mt-2">
                          <Link
                            href={notification.actionUrl}
                            onClick={handleActionClick}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-xs font-medium bg-primary/10 hover:bg-primary/20 border-primary/20 hover:border-primary/30 text-primary hover:text-primary"
                            >
                              {notification.actionText}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Priority Indicator */}
                  {notification.priority === "high" && (
                    <div className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-sm animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
};
