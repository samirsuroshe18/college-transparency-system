// What the health pages have in common
export const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export const STATUS_STYLES = { open: "bg-amber-100 text-amber-700", assessed: "bg-green-100 text-green-700" };

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "");

// a college day ("2026-11-12") as a readable date, the same in every time zone
export const formatDay = (day) => {
    if (!day) return "";
    const [year, month, date] = day.split("-").map(Number);

    return new Date(year, month - 1, date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
