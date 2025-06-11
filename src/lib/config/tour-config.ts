/**
 * Tour step configuration
 */
interface TourStep {
  target: string;
  content: string;
  placement: string;
  title: string;
  icon: string;
}

/**
 * Tour configuration
 */
interface Tour {
  tour: string;
  steps: TourStep[];
  severity?: string;
}

/**
 * Main application tour steps configuration
 * Defines the guided tour flow for new users
 */
export const tourSteps: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        target: ".tour-welcome",
        title: "Welcome",
        icon: "👋",
        content: "Welcome to AIBTC! Let's take a quick tour of the platform.",
        placement: "center",
      },
      {
        target: ".tour-dashboard",
        title: "Dashboard",
        icon: "📊",
        content:
          "This is your dashboard where you can see all your active agents and tasks.",
        placement: "bottom",
      },
      {
        target: ".tour-agents",
        title: "AI Agents",
        icon: "🤖",
        content:
          "Here you can create and manage your AI agents. Each agent has specific tools and capabilities.",
        placement: "bottom",
      },
      {
        target: ".tour-tasks",
        title: "Tasks",
        icon: "✅",
        content:
          "View and manage your scheduled tasks. You can create new tasks or modify existing ones.",
        placement: "bottom",
      },
      {
        target: ".tour-wallet",
        title: "Wallet",
        icon: "💰",
        content:
          "Your wallet section where you can manage your STX and other tokens.",
        placement: "bottom",
      },
      {
        target: ".tour-chat",
        title: "Chat",
        icon: "💬",
        content:
          "Chat with your agents here. They can help you with various tasks and provide insights.",
        placement: "bottom",
      },
      {
        target: ".tour-profile",
        title: "Profile",
        icon: "👤",
        content: "Manage your profile settings and preferences here.",
        placement: "bottom",
      },
      {
        target: ".tour-help",
        title: "Help",
        icon: "❓",
        content:
          "Need help? Click here to access our documentation and support resources.",
        placement: "bottom",
      },
    ],
  },
];

export type { Tour, TourStep };
