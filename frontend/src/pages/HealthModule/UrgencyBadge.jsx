const UrgencyBadge = ({ urgency }) => (
    urgency === "urgent"
        ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Urgent</span>
        : null
);

export default UrgencyBadge;
