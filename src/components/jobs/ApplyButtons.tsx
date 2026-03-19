import { ExternalLink } from "lucide-react";
import { buildPortalLinks } from "@/lib/portals";

interface ApplyButtonsProps {
  jobTitle: string;
  city: string;
  applyLink?: string;
  compact?: boolean;
}

const ApplyButtons = ({ jobTitle, city, applyLink, compact = false }: ApplyButtonsProps) => {
  const links = buildPortalLinks(jobTitle, city, applyLink);

  if (compact) {
    // Show only top 3 + "More" in compact mode
    const primary = links.slice(0, 3);
    return (
      <div className="flex flex-wrap gap-1.5">
        {primary.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: link.color }}
          >
            {link.name}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Apply on:</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: link.color }}
          >
            <span className="font-bold text-xs opacity-80">{link.icon}</span>
            {link.name}
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default ApplyButtons;
