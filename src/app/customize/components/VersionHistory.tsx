/**
 * Customizer Module - Version History Component
 * תצוגת היסטוריית גרסאות ושחזור גרסאות קודמות
 */

'use client';

import { useState, useEffect } from 'react';
import { PageType } from '@/lib/customizer/types';
import { restoreVersion, createManualSnapshot } from '../actions';
import { HiClock, HiRefresh, HiSave, HiEye, HiX } from 'react-icons/hi';

interface Version {
  id: number;
  version_number: number;
  created_at: string;
  created_by?: number;
  created_by_name?: string;
  created_by_email?: string;
  notes?: string;
  is_restorable: boolean;
  sections_count: number;
}

interface VersionHistoryProps {
  pageType: PageType;
  pageHandle?: string;
  onVersionRestored?: () => void;
}

export function VersionHistory({
  pageType,
  pageHandle,
  onVersionRestored,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState('');

  useEffect(() => {
    loadVersions();
  }, [pageType, pageHandle]);

  async function loadVersions() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ pageType });
      if (pageHandle) {
        params.append('handle', pageHandle);
      }

      const response = await fetch(`/api/customizer/pages/${pageType}/versions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(versionId: number) {
    if (!confirm('האם אתה בטוח שברצונך לשחזר גרסה זו? השינויים הנוכחיים יאבדו.')) {
      return;
    }

    try {
      setRestoring(versionId);
      const result = await restoreVersion(pageType, versionId, pageHandle);

      if (result.success) {
        alert('הגרסה שוחזרה בהצלחה!');
        onVersionRestored?.();
        loadVersions();
      } else {
        alert('שגיאה בשחזור: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('שגיאה בשחזור הגרסה');
    } finally {
      setRestoring(null);
    }
  }

  async function handleCreateSnapshot() {
    if (!snapshotNotes.trim()) {
      alert('אנא הכנס הערה לגרסה');
      return;
    }

    try {
      const result = await createManualSnapshot(pageType, snapshotNotes, pageHandle);

      if (result.success) {
        alert('גרסה נוצרה בהצלחה!');
        setShowCreateDialog(false);
        setSnapshotNotes('');
        loadVersions();
      } else {
        alert('שגיאה ביצירת גרסה: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating snapshot:', error);
      alert('שגיאה ביצירת גרסה');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        טוען היסטוריית גרסאות...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">היסטוריית גרסאות</h3>
          <p className="text-sm text-gray-500">צפה ושחזר גרסאות קודמות</p>
        </div>
        <button
          onClick={() => onClose?.()}
          className="p-2 hover:bg-gray-100 rounded-md"
          title="סגור"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Create Snapshot Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowCreateDialog(true)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <HiSave className="w-4 h-4" />
          צור גרסה חדשה
        </button>
      </div>

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HiClock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">אין גרסאות זמינות</p>
            <p className="text-xs mt-2">גרסאות נוצרות אוטומטית בעת פרסום</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        גרסה #{version.version_number}
                      </span>
                      {version.version_number === versions[0]?.version_number && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          נוכחית
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <HiClock className="w-3 h-3" />
                        {formatDate(version.created_at)}
                      </div>
                      {version.created_by_name && (
                        <div>
                          נוצר על ידי: {version.created_by_name}
                        </div>
                      )}
                      {version.sections_count > 0 && (
                        <div>
                          {version.sections_count} סקשנים
                        </div>
                      )}
                      {version.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
                          {version.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {version.is_restorable && (
                      <button
                        onClick={() => handleRestore(version.id)}
                        disabled={restoring === version.id}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <HiRefresh className="w-4 h-4" />
                        {restoring === version.id ? 'משחזר...' : 'שחזר'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Snapshot Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              צור גרסה חדשה
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הערה (אופציונלי)
              </label>
              <textarea
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="לדוגמה: לפני שינוי גדול בעיצוב"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setSnapshotNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handleCreateSnapshot}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                צור גרסה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

