import { BsGithub, BsTwitterX, BsDiscord, BsFileText } from "react-icons/bs";

export function SocialLinks() {
  const links = [
    {
      name: "GitHub",
      href: "https://github.com/aibtcdev",
      icon: BsGithub,
    },
    {
      name: "AIBTC on X",
      href: "https://x.com/aibtcdev",
      icon: BsTwitterX,
    },
    {
      name: "Prompt2DAO on X",
      href: "https://x.com/prompt2dao",
      icon: BsTwitterX,
    },
    {
      name: "Discord",
      href: "https://discord.com/invite/Z59Z3FNbEX",
      icon: BsDiscord,
    },
    {
      name: "Docs",
      href: "https://docs.aibtc.dev",
      icon: BsFileText,
    },
  ];

  return (
    <div className="relative group inline-block">
      <button className="flex items-center space-x-2 px-4 py-2 text-zinc-400 hover:text-white">
        <span>Links</span>
      </button>

      <div className="hidden group-hover:block absolute z-50 right-0 mt-2 w-48 rounded-md shadow-lg bg-zinc-800 ring-1 ring-black ring-opacity-5">
        <div className="py-1" role="menu" aria-orientation="vertical">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <link.icon className="mr-2 h-4 w-4" />
              <span>{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SocialLinks;
