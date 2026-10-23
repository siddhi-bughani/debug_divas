import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your search filters or add a new entry.',
  action,
}) => {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-sahay-ivory flex items-center justify-center text-sahay-slate mb-3 border border-sahay-border">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-sahay-forest-deep">{title}</h4>
      <p className="mt-1 text-xs text-sahay-slate max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
