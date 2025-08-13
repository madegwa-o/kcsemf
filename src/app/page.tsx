'use client'

import { Bot, User, MessageCircle, Shield, LogIn, LogOut, ChevronDown } from 'lucide-react';
import Chat from "@/app/components/Chat";
import RAGAdmin from "@/app/components/RAGAdmin";
import ThemeToggle from "@/components/ThemeToggle";
import React, { useState } from "react";

type ViewType = "chat" | "admin";

interface HamburgerMenuProps {
  currentView: ViewType;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const renderCurrentView = () => {
    switch (currentView) {
      case "admin":
        return <RAGAdmin />;
      case "chat":
      default:
        return <Chat />;
    }
  };

  return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between bg-background border-b border-border p-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6" />
            KMF . AI
          </h1>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <HamburgerMenu
                currentView={currentView}
                setCurrentView={setCurrentView}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">{renderCurrentView()}</div>
      </div>
  );
}

// Hamburger Menu Component
const HamburgerMenu = ({
                         currentView,
                         setCurrentView,
                         isLoggedIn,
                         setIsLoggedIn,
                       }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "chat" as const, label: "Chat", icon: MessageCircle, isDefault: true },
    { id: "admin" as const, label: "Admin", icon: Shield },
  ];

  const handleMenuItemClick = (itemId: ViewType) => {
    setCurrentView(itemId);
    setIsOpen(false);
  };

  const handleAuthToggle = () => {
    setIsLoggedIn(!isLoggedIn);
    setIsOpen(false);
  };

  return (
      <div className="relative">
        {/* Account Icon Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 p-2 rounded-lg bg-accent hover:bg-muted transition-colors"
            aria-label="Open menu"
        >
          <User className="w-5 h-5" />
          <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleMenuItemClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors ${
                                currentView === item.id ? "bg-accent font-medium" : ""
                            }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {item.label}
                          {item.isDefault && (
                              <span className="ml-auto text-xs text-muted-foreground">
                        Default
                      </span>
                          )}
                        </button>
                    );
                  })}

                  {/* Separator */}
                  <div className="border-t border-border my-1" />

                  {/* Login/Logout Toggle */}
                  <button
                      onClick={handleAuthToggle}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors"
                  >
                    {isLoggedIn ? (
                        <>
                          <LogOut className="w-4 h-4" />
                          Logout
                        </>
                    ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Login
                        </>
                    )}
                  </button>
                </div>
              </div>
            </>
        )}
      </div>
  );
};
