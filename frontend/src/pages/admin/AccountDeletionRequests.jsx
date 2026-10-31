import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, ShieldAlert, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function AccountDeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async (initial = false) => {
    try {
      setRequests(await api.get("/api/account-deletion/requests?status=pending"));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load account deletion requests.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadRequests(true), 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  async function reviewRequest(requestId, decision) {
    setUpdatingId(requestId);
    setError("");
    setMessage("");
    try {
      const updatedRequest = await api.patch(`/api/account-deletion/requests/${requestId}`, {
        status: decision,
        admin_note: notes[requestId]?.trim() || null,
      });
      setRequests((current) => current.filter((request) => request.id !== requestId));
      setNotes((current) => {
        const next = { ...current };
        delete next[requestId];
        return next;
      });
      setMessage(
        decision === "approved"
          ? `Request from ${updatedRequest.registration_number} approved for manual database deletion. No account data was deleted.`
          : `Request from ${updatedRequest.registration_number} rejected.`,
      );
    } catch (reviewError) {
      setError(reviewError.message || "Unable to update this request.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Sidebar
      title="Account deletion requests"
      subtitle="Review student requests. Approval does not delete the account; deletion must be performed manually by an authorized admin."
      eyebrow="Student accounts"
      actions={<button className="button button--soft" type="button" onClick={() => loadRequests()} disabled={loading}><Clock3 size={15} /> Refresh</button>}
    >
      {error && <p className="alert" role="alert">{error}</p>}
      {message && <p className="alert alert--success" role="status">{message}</p>}

      <div className="account-deletion-admin-notice">
        <ShieldAlert size={19} />
        <p><strong>Approval is not account deletion.</strong> Approved requests are only authorized for a separate, manual database deletion. This workflow never deletes students, orders, or order items.</p>
      </div>

      {loading ? (
        <div className="loading-state"><Clock3 size={20} /> Loading pending requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state"><Check size={24} /><h2>No pending requests</h2><p>New student account deletion requests will appear here for review.</p></div>
      ) : (
        <section className="account-deletion-admin-list" aria-label="Pending account deletion requests">
          {requests.map((request) => (
            <article className="panel account-deletion-admin-card" key={request.id}>
              <div className="account-deletion-admin-card__header">
                <div>
                  <p className="eyebrow">PENDING REQUEST</p>
                  <h2>{request.student_name}</h2>
                  <p className="account-deletion-admin-card__id">Registration number: <strong>{request.registration_number}</strong></p>
                </div>
                <time dateTime={request.requested_at}>Submitted {formatDate(request.requested_at)}</time>
              </div>
              <div className="form-field">
                <label htmlFor={`admin-note-${request.id}`}>Admin note (optional)</label>
                <textarea
                  id={`admin-note-${request.id}`}
                  value={notes[request.id] || ""}
                  maxLength={2000}
                  onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="button" onClick={() => reviewRequest(request.id, "approved")} disabled={updatingId === request.id}>
                  <Check size={16} /> {updatingId === request.id ? "Saving..." : "Approve for manual deletion"}
                </button>
                <button type="button" className="button button--soft" onClick={() => reviewRequest(request.id, "rejected")} disabled={updatingId === request.id}>
                  <X size={16} /> Reject request
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </Sidebar>
  );
}
