'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, FileText, Download, X, File, Image, Eye } from 'lucide-react';
import { AccountDocument } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface DocumentsSectionProps {
  accountId: string;
  readOnly?: boolean;
}

const DOC_TYPES = ['ID Proof', 'Address Proof', 'Bank Statement', 'Cheque', 'Agreement', 'Photo', 'Other'];

const DOC_COLORS: Record<string, string> = {
  'ID Proof': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Address Proof': 'bg-green-500/15 text-green-400 border-green-500/30',
  'Bank Statement': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Cheque': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Agreement': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Photo': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Other': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

export default function DocumentsSection({ accountId, readOnly }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<AccountDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Other');
  const [formFile, setFormFile] = useState<File | null>(null);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchDocuments = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/documents/account/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        setError('Failed to load documents');
      }
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async () => {
    const token = getToken();
    if (!token || !formFile || !formName.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('type', formType);
      formData.append('bankAccountId', accountId);
      formData.append('file', formFile);

      const res = await fetch(`${API}/api/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setShowUploadForm(false);
        resetForm();
        setError(null);
        await fetchDocuments();
      } else {
        setError('Failed to upload document');
      }
    } catch {
      setError('Failed to upload document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId: string) => {
    const token = getToken();
    if (!token) return;
    setDeleting(docId);
    try {
      const res = await fetch(`${API}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConfirmDeleteId(null);
        setError(null);
        await fetchDocuments();
      } else {
        setError('Failed to delete document');
      }
    } catch {
      setError('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType('Other');
    setFormFile(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-400" />
          <h4 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">Documents</h4>
          <span className="text-xs text-slate-500">({documents.length})</span>
        </div>
        {!readOnly && !showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors text-xs font-medium"
          >
            <Plus className="h-3 w-3" />
            Upload Document
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-2"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="mb-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-white">Upload Document</h5>
            <button onClick={() => { setShowUploadForm(false); resetForm(); }} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Document Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Aadhar Card Front"
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-1.5 text-sm"
              >
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400">File *</label>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFormFile(f);
                  if (f && !formName) setFormName(f.name.replace(/\.[^.]+$/, ''));
                }}
                className="w-full mt-1 text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"
              />
              {formFile && (
                <p className="text-xs text-slate-500 mt-1">
                  {formFile.name} ({formatFileSize(formFile.size)})
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleUpload}
              disabled={saving || !formName.trim() || !formFile}
              className="px-3 py-1.5 rounded bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={() => { setShowUploadForm(false); resetForm(); }}
              className="px-3 py-1.5 rounded text-slate-400 text-xs hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-4 bg-slate-800/40 rounded-xl">
          <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-xs">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors">
              {/* Icon / Preview */}
              <div className="flex-shrink-0">
                {isImage(doc.mimeType) ? (
                  <button
                    onClick={() => setImagePreview(`${API}${doc.filePath}`)}
                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-600 hover:border-teal-400 transition-colors"
                    title="View image"
                  >
                    <img src={`${API}${doc.filePath}`} alt={doc.name} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <File className="h-5 w-5 text-slate-500" />
                  </div>
                )}
              </div>

              {/* Doc info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{doc.name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${DOC_COLORS[doc.type] || DOC_COLORS['Other']}`}>
                    {doc.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                  <span>{new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isImage(doc.mimeType) ? (
                  <button
                    onClick={() => setImagePreview(`${API}${doc.filePath}`)}
                    className="p-1.5 text-slate-500 hover:text-teal-400 transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <a
                    href={`${API}${doc.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-teal-400 transition-colors"
                    title="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                )}
                <a
                  href={`${API}${doc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {!readOnly && (
                  confirmDeleteId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                        className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting === doc.id ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 rounded text-slate-400 text-[10px] hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(doc.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={imagePreview} alt="Document" className="w-full rounded-xl border border-slate-700 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
