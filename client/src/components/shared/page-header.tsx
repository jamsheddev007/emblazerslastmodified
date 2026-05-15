import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";
import { Link } from "wouter";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
    hidden?: boolean;
  };
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, action, actions }: PageHeaderProps) {
  const ActionIcon = action?.icon || Plus;
  const showAction = action && !action.hidden;

  const renderActionButton = () => {
    if (!showAction) return null;
    
    const buttonContent = (
      <>
        <ActionIcon className="w-4 h-4 mr-2" />
        {action.label}
      </>
    );

    if (action.href) {
      return (
        <Link href={action.href}>
          <Button data-testid="button-add-new">
            {buttonContent}
          </Button>
        </Link>
      );
    }

    return (
      <Button onClick={action.onClick} data-testid="button-add-new">
        {buttonContent}
      </Button>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions}
      {renderActionButton()}
    </div>
  );
}
