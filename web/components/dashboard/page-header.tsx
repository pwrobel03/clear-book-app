import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-foreground tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-base text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
