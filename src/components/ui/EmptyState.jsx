export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-gradient-soft flex items-center justify-center mb-4">
          <Icon size={24} className="text-brand-600" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-500 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
