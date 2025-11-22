import { Shield } from "lucide-react";

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface Footer2Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer2 = ({
  logo = {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face&auto=format",
    alt: "SmartRisk AI logo",
    title: "SmartRisk AI",
    url: "https://www.smartrisk-ai.com",
  },
  tagline = "AI-driven credit scoring & risk advisory platform.",
  menuItems = [
    {
      title: "Platform",
      links: [
        { text: "Dashboard", url: "#" },
        { text: "Credit Scoring", url: "#" },
        { text: "Risk Reports", url: "#" },
        { text: "Analytics", url: "#" },
        { text: "API Access", url: "#" },
        { text: "Documentation", url: "#" },
      ],
    },
    {
      title: "SmartRisk AI",
      links: [
        { text: "About", url: "#" },
        { text: "Team", url: "#" },
        { text: "Blog", url: "#" },
        { text: "Careers", url: "#" },
        { text: "Contact", url: "#" },
        { text: "Partners", url: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Help Center", url: "#" },
        { text: "Support", url: "#" },
        { text: "Case Studies", url: "#" },
      ],
    },
    {
      title: "Community",
      links: [
        { text: "GitHub", url: "#" },
        { text: "LinkedIn", url: "#" },
        { text: "Twitter", url: "#" },
      ],
    },
  ],
  copyright = "© 2025 SmartRisk AI. Intelligent credit risk solutions.",
  bottomLinks = [
    { text: "Terms of Use", url: "#" },
    { text: "Privacy Policy", url: "#" },
  ],
}: Footer2Props) => {
  return (
    <section className="py-32 border-t bg-background dark:bg-background-dark">
      <div className="container mx-auto max-w-6xl">
        <footer>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2 lg:justify-start">
                <Shield />
                SmartRisk AI
              </div>
              <p className="mt-4 font-bold">{tagline}</p>
            </div>
            {menuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="text-muted-foreground space-y-4">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium"
                    >
                      <a href={link.url}>{link.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-24 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium md:flex-row md:items-center">
            <p>{copyright}</p>
            <ul className="flex gap-4">
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className="hover:text-primary underline">
                  <a href={link.url}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer2 };