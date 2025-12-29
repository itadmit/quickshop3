'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  HiUserAdd, 
  HiTrash, 
  HiMail, 
  HiClock, 
  HiCheckCircle,
  HiX,
  HiUserGroup,
} from 'react-icons/hi';

interface StaffMember {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  role: string;
  permissions: Record<string, boolean>;
  createdAt: Date;
}

interface PendingInvitation {
  id: number;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

export default function TeamManagementPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'staff' as 'admin' | 'staff' | 'limited_staff',
  });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בטעינת נתונים');
      }

      setStaffMembers(data.staff || []);
      setPendingInvitations(data.pendingInvitations || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת הזמנה');
      }

      // Success!
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'staff' });
      fetchStaff(); // Refresh list
      
      // Show success message
      alert('ההזמנה נשלחה בהצלחה!');
    } catch (error: any) {
      console.error('Error inviting staff:', error);
      setError(error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (type: 'staff' | 'invitation', id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) return;

    try {
      const response = await fetch(`/api/staff?type=${type}&id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה במחיקה');
      }

      fetchStaff(); // Refresh list
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(error.message);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'בעלים',
      admin: 'מנהל',
      staff: 'עובד',
      limited_staff: 'עובד מוגבל',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HiUserGroup className="w-8 h-8" />
            ניהול צוות
          </h1>
          <p className="text-gray-600 mt-1">
            הזמן והגדר עובדים לחנות שלך
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-green-500 hover:bg-green-600"
        >
          <HiUserAdd className="w-5 h-5 ml-2" />
          הזמן עובד חדש
        </Button>
      </div>

      {/* Staff Members */}
      <Card>
        <CardHeader>
          <CardTitle>עובדים פעילים ({staffMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {staffMembers.length === 0 ? (
            <div className="text-center py-12">
              <HiUserGroup className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">אין עובדים עדיין</p>
              <p className="text-sm text-gray-500 mt-1">
                הזמן עובדים כדי להתחיל לנהל את החנות ביחד
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      שם
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      אימייל
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      תפקיד
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      כניסה אחרונה
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      סטטוס
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{member.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {member.lastLoginAt
                            ? new Date(member.lastLoginAt).toLocaleDateString('he-IL')
                            : 'מעולם לא התחבר'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {member.isActive ? (
                          <span className="inline-flex items-center text-sm text-green-600">
                            <HiCheckCircle className="w-4 h-4 ml-1" />
                            פעיל
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-sm text-gray-500">
                            <HiX className="w-4 h-4 ml-1" />
                            לא פעיל
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-left">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('staff', member.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>הזמנות ממתינות ({pendingInvitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      אימייל
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      תפקיד
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      נשלחה ב
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      פג תוקף ב
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <HiMail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{invitation.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {getRoleLabel(invitation.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {new Date(invitation.createdAt).toLocaleDateString('he-IL')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <HiClock className="w-4 h-4" />
                          {new Date(invitation.expiresAt).toLocaleDateString('he-IL')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('invitation', invitation.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>הזמן עובד חדש</CardTitle>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    required
                    disabled={inviting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">תפקיד</Label>
                  <select
                    id="role"
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm({
                        ...inviteForm,
                        role: e.target.value as 'admin' | 'staff' | 'limited_staff',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={inviting}
                  >
                    <option value="staff">עובד</option>
                    <option value="admin">מנהל</option>
                    <option value="limited_staff">עובד מוגבל</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    {inviteForm.role === 'admin' && 'מנהל - גישה מלאה למערכת'}
                    {inviteForm.role === 'staff' && 'עובד - גישה רגילה למערכת'}
                    {inviteForm.role === 'limited_staff' &&
                      'עובד מוגבל - גישה מותאמת אישית'}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {inviting ? 'שולח הזמנה...' : 'שלח הזמנה'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteModal(false);
                      setError('');
                    }}
                    disabled={inviting}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

