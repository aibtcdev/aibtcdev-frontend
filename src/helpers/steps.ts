interface Tour {
  tour: string;
  steps: {
    target: string;
    content: string;
    placement: string;
  }[];
  severity?: string;
}

export const tourSteps: Tour[] = [
  {
    tour: "main",
    steps: [
      {
        target: ".tour-welcome",
        content: "Welcome to AIBTC! Let's take a quick tour of the platform.",
        placement: "center",
      },
      {
        target: ".tour-dashboard",
        content:
          "This is your dashboard where you can see all your active agents and tasks.",
        placement: "bottom",
      },
      {
        target: ".tour-agents",
        content:
          "Here you can create and manage your AI agents. Each agent has specific tools and capabilities.",
        placement: "bottom",
      },
      {
        target: ".tour-tasks",
        content:
          "View and manage your scheduled tasks. You can create new tasks or modify existing ones.",
        placement: "bottom",
      },
      {
        target: ".tour-wallet",
        content:
          "Your wallet section where you can manage your STX and other tokens.",
        placement: "bottom",
      },
      {
        target: ".tour-chat",
        content:
          "Chat with your agents here. They can help you with various tasks and provide insights.",
        placement: "bottom",
      },
      {
        target: ".tour-profile",
        content: "Manage your profile settings and preferences here.",
        placement: "bottom",
      },
      {
        target: ".tour-help",
        content:
          "Need help? Click here to access our documentation and support resources.",
        placement: "bottom",
      },
    ],
  },
];
