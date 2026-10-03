import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { listLeaves } from "../../api/healthApi";
import { errorMessage } from "../../api/client";
import { formatDay } from "./format";

// A class coordinator sees which students of the class are on medical leave, and whom
// to call. Nothing about the illness is shown here.
const ClassLeaves = () => {
    const user = useSelector((state) => state.auth.userData);
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let cancelled = false;

        listLeaves()
            .then((answer) => { if (!cancelled) setData(answer); })
            .catch((error) => { if (!cancelled) setLoadError(errorMessage(error)); });

        return () => { cancelled = true; };
    }, []);

    const { department, year, division } = user.coordinatorOf || {};
    const leaves = data?.leaves || [];
    // days are written as YYYY-MM-DD, so they compare as text
    const coversToday = (leave) => leave.leaveFrom <= data.today && data.today <= leave.leaveUntil;

    return (
        <div className="container mx-auto p-4 relative bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-2">Medical Leave</h1>
            <p className="text-sm text-gray-600 mb-6">
                Students of {[department, year, division].filter(Boolean).join(" ")} who were given leave by the college doctor. The reason for a leave is between the student and the doctor.
            </p>

            {loadError && <p role="alert" className="text-red-600">{loadError}</p>}
            {!loadError && data === null && <p className="text-gray-500">Loading leaves…</p>}
            {data !== null && leaves.length === 0 && <p className="text-gray-500">No student of your class has been given leave.</p>}

            <div className="space-y-4">
                {leaves.map((leave) => (
                    <div key={leave._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 break-words">{leave.student?.name}</h3>
                                <p className="text-sm text-gray-500 break-words">{leave.student?.rollNumber}</p>
                            </div>
                            {coversToday(leave) && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">On leave today</span>}
                        </div>

                        <p className="mt-3 text-gray-700">
                            {formatDay(leave.leaveFrom)} to {formatDay(leave.leaveUntil)} ({leave.leaveDays} {leave.leaveDays === 1 ? "day" : "days"})
                        </p>

                        {leave.student?.emergencyContact?.contact && (
                            <p className="mt-2 text-sm text-gray-600 break-words">
                                <span className="font-semibold">Emergency contact:</span> {leave.student.emergencyContact.name}
                                {leave.student.emergencyContact.relation ? ` (${leave.student.emergencyContact.relation})` : ""}, {leave.student.emergencyContact.contact}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassLeaves;
