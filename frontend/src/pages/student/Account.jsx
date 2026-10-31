import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Clock3, ShieldCheck, Trash2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function StudentAccount() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async (initial = false) => {
    try {
      setRequests(await api.get("/api/account-deletion/requests/me"));
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

  async function submitRequest() {
    const confirmed = window.confirm(
      "Submitting this request will not immediately delete your account. An administrator will review it. If approved, the account will be marked for manual database deletion; your account and order history remain until that is performed.",
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await api.post("/api/account-deletion/requests", {});
      setMessage("Your account deletion request was submitted for admin review.");
      await loadRequests();
    } catch (submitError) {
      setError(submitError.message || "Unable to submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRequest(requestId) {
    setCancellingId(requestId);
    setError("");
    setMessage("");
    try {
      await api.delete(`/api/account-deletion/requests/${requestId}`);
      setMessage("Your pending request was cancelled.");
      await loadRequests();
    } catch (cancelError) {
      setError(cancelError.message || "Unable to cancel your request.");
    } finally {
      setCancellingId(null);
    }
  }

  const hasPendingRequest = requests.some((request) => request.status === "pending");

  return (
    <>
      <Navbar />
      <main className="page-content account-deletion-page">
        <header className="page-heading">
          <div>
            <p className="eyebrow">STUDENT ACCOUNT</p>
            <h1 className="page-title">Account settings</h1>
            <p className="page-subtitle">Review your account deletion request and its status.</p>
          </div>
        </header>

        {error && <p className="alert" role="alert"><AlertCircle size={17} />{error}</p>}
        {message && <p className="alert alert--success" role="status">{message}</p>}

        <section className="panel account-deletion-panel">
          <div className="panel__header">
            <div>
              <h2><Trash2 size={18} /> Request account deletion</h2>
              <p className="panel__subtitle">Your request is reviewed by an administrator. Submitting or approving it does not delete your account or order history.</p>
            </div>
          </div>
          <div className="panel__body">
            <div className="account-deletion-notice">
              <ShieldCheck size={20} />
              <p>If approved, the account is approved for manual deletion directly in the database. Your student account and order records remain until an authorized admin performs that separate action.</p>
            </div>
            {hasPendingRequest ? (
              <p className="account-deletion-pending-note">You already have a pending request. A second pending request cannot be submitted.</p>
            ) : (
              <button type="button" className="button button--terracotta" onClick={submitRequest} disabled={submitting}>
                <Trash2 size={16} /> {submitting ? "Submitting request..." : "Request Account Deletion"}
              </button>
            )}
          </div>
        </section>

        <section className="panel account-deletion-history">
          <div className="panel__header">
            <div><h2>Request status</h2><p className="panel__subtitle">Your previous requests and any administrator notes.</p></div>
          </div>
          {loading ? (
            <div className="loading-state"><Clock3 size={20} /> Loading request status...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state"><ShieldCheck size={24} /><h2>No requests submitted</h2><p>Your account deletion request history will appear here.</p></div>
          ) : (
            <div className="account-deletion-request-list">
              {requests.map((request) => (
                <article className="account-deletion-request" key={request.id}>
                  <div className="account-deletion-request__heading">
                    <span className={`account-deletion-status account-deletion-status--${request.status}`}>{statusLabels[request.status]}</span>
                    <time dateTime={request.requested_at}>Submitted {formatDate(request.requested_at)}</time>
                  </div>
                  {request.status === "approved" && <p className="account-deletion-request__notice">Approved for manual database deletion. Your account has not been deleted.</p>}
                  {request.admin_note && <p className="account-deletion-request__note"><strong>Admin note:</strong> {request.admin_note}</p>}
                  {request.status === "pending" && (
                    <button type="button" className="button button--soft" onClick={() => cancelRequest(request.id)} disabled={cancellingId === request.id}>
                      {cancellingId === request.id ? "Cancelling..." : "Cancel pending request"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
