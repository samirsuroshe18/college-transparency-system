import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { getNotices, markAllNoticesRead, markNoticeRead } from "../../api/noticeApi";

const REFRESH_MS = 60000;

const timeOf = (value) => new Date(value).toLocaleString("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// The bell in the top bar: decisions and records that concern the logged-in user
const NoticeBell = () => {
  const [anchor, setAnchor] = useState(null);
  const [notices, setNotices] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const data = await getNotices();
      setNotices(data.notices);
      setUnread(data.unread);
    } catch {
      // the bell is not worth an error message; the next refresh tries again
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const open = (notice) => async () => {
    setAnchor(null);
    if (!notice.readAt) {
      await markNoticeRead(notice._id).catch(() => {});
      load();
    }
    if (notice.link) navigate(notice.link);
  };

  const readAll = async () => {
    await markAllNoticesRead().catch(() => {});
    load();
  };

  return (
    <>
      <IconButton aria-label={`Notices, ${unread} unread`} onClick={(e) => { setAnchor(e.currentTarget); load(); }}>
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <div className="w-80 max-w-[90vw]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-500/20">
            <span className="font-semibold">Notices</span>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="text-sm text-blue-500 hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          {notices.length === 0 && <p className="px-4 py-6 text-sm opacity-70 text-center">Nothing yet.</p>}

          <ul className="max-h-96 overflow-y-auto">
            {notices.map((notice) => (
              <li key={notice._id}>
                <button
                  type="button"
                  onClick={open(notice)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-500/10 hover:bg-gray-500/10 ${notice.readAt ? "opacity-60" : ""}`}
                >
                  <span className="flex items-start gap-2">
                    {!notice.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />}
                    <span className="min-w-0">
                      <span className="block text-sm font-medium break-words">{notice.title}</span>
                      {notice.body && <span className="block text-sm opacity-80 break-words">{notice.body}</span>}
                      <span className="block text-xs opacity-60 mt-0.5">{timeOf(notice.createdAt)}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Popover>
    </>
  );
};

export default NoticeBell;
