import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  path?: string;
}

interface Props {
  items: Crumb[];
}

const Breadcrumb = ({ items }: Props) => {
  return (
    <nav className="text-sm text-muted-foreground mb-8">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.path ? (
              <Link
                to={item.path}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            )}

            {index < items.length - 1 && (
              <ChevronRight className="w-4 h-4 opacity-60" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;