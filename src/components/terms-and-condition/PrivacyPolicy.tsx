import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PrivacyPolicy() {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <p className="text-zinc-800 dark:text-zinc-200">
            This Privacy Policy explains how AIBTC.DEV (“we,” “our,” or “us”)
            collects, uses, and protects your information when you use our
            product. By using AIBTC.DEV, you agree to the practices described in
            this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Information We Collect
          </h2>
          <p className="text-zinc-800 dark:text-zinc-200">
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
            <li>Personal Information: Such as your name and wallet address.</li>
            <li>
              Usage Data: Including prompts, interactions, and activity within
              the product.
            </li>
          </ul>
          <p className="text-zinc-800 dark:text-zinc-200 mt-4">
            Note: We do not collect or have access to your personal private
            keys. Agent keys are securely managed by us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            How We Use Your Information
          </h2>
          <p className="text-zinc-800 dark:text-zinc-200">
            We use your information to:
          </p>
          <ul className="list-decimal pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
            <li>
              Improve and Maintain the Product: Analyze user interactions to
              enhance functionality and user experience.
            </li>
            <li>
              Provide Support and Updates: Deliver tailored communication about
              our services.
            </li>
            <li>
              Ensure Security and Compliance: Monitor and secure the platform
              for lawful use.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-zinc-800 dark:text-zinc-200">
            We use industry-standard security measures to protect your data.
            However, no method of electronic storage or transmission is
            completely secure, and we cannot guarantee absolute protection.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Data Rights</h2>
          <p className="text-zinc-800 dark:text-zinc-200">
            To ensure transparency, we provide the following rights regarding
            your data:
          </p>
          <ul className="list-decimal pl-6 mt-2 text-zinc-800 dark:text-zinc-200">
            <li>
              Access Requests: You may request a summary of your usage data
              processed by AIBTC.DEV.
            </li>
            <li>
              Data Deletion: You may request deletion of your personal
              information, where feasible, if it is not essential to the
              operation or improvement of our product.
            </li>
            <li>
              Limitations: Certain data, such as prompts and interactions, is
              integral to the platform’s operation and cannot be deleted or
              restricted.
            </li>
            <li>
              No Download Rights: Full copies of interaction data cannot be
              provided to protect platform integrity and operational security.
            </li>
          </ul>
        </section>
      </div>
    </ScrollArea>
  );
}
