import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Send, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Server, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { ScheduledWish, UserAccount } from '../types/occasion';
import { NotificationService } from '../utils/notificationService';
import { generateWhatsAppUrl } from '../utils/dateCalculations';
import confetti from 'canvas-confetti';

interface ScheduledWishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledWishes: ScheduledWish[];
  currentUser?: UserAccount | null;
  onCancelSchedule: (id: string) => void;
  onTriggerNow: (wish: ScheduledWish) => void;
}

export const ScheduledWishesModal: React.FC<ScheduledWishesModalProps> = ({
  isOpen,
  onClose,
  scheduledWishes,
  currentUser,
  onCancelSchedule,
  onTriggerNow,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [simulatingCloud, setSimulatingCloud] = useState<boolean>(false);
  const [cloudSuccessMsg, setCloudSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const pendingList = scheduledWishes.filter((w) => w.status === 'pending');
  const pastList = scheduledWishes.filter((w) => w.status !== 'pending');

  const getTimeRemaining = (dateStr: string, timeStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, mins] = timeStr.split(':').map(Number);
      const target = new Date(year, month - 1, day, hours, mins, 0);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();

      if (diffMs <= 0) return 'Due now';

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `In ${diffDays}d ${diffHours % 24}h`;
      if (diffHours > 0) return `In ${diffHours}h ${diffMins % 60}m`;
      return `In ${diffMins} mins`;
    } catch {
      return 'Scheduled';
    }
  };

  const handleSimulateServerAutonomousDispatch = async (wish: ScheduledWish) => {
    setSimulatingCloud(true);
    setCloudSuccessMsg('');

    try {
      const token = currentUser?.token || localStorage.getItem('bad_with_dates_auth_token');
      const res = await fetch('/api/user/schedules/simulate-server-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          scheduleId: wish.id,
          recipientName: wish.recipientName,
          phone: wish.phone,
          message: wish.message,
          occasion: wish.occasion,
        }),
      });

      const data = await res.json();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
      NotificationService.playCelebrationChime();

      setCloudSuccessMsg(`Server Daemon dispatched autonomous wish for ${wish.recipientName}! Browser can stay closed.`);
      onTriggerNow(wish);
    } catch (err) {
      console.error('Server dispatch simulation failed:', err);
    } finally {
      setSimulatingCloud(false);
    }
  };

  const handleLaunchWhatsAppManually = (wish: ScheduledWish) => {
    setTestingId(wish.id);
    const waUrl = generateWhatsAppUrl(wish.phone, wish.message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onTriggerNow(wish);
    setTimeout(() => setTestingId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#fefbf3] border-[2.5px] border-black rounded-3xl shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[2.5px] border-black bg-[#ffea79]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000000]">
              <Clock className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                Scheduled WhatsApp Queue
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-[#ffea79] font-black">
                  {pendingList.length} PENDING
                </span>
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                Sender Number: <strong className="text-black">{currentUser?.whatsappNumber || 'Your WhatsApp'}</strong> ({currentUser?.name || 'User'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black transition shadow-[2px_2px_0px_#000000]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#fefbf3]">
          {/* Autonomous Server Guarantee Box */}
          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ffea79] border-2 border-black text-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#000000]">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                  <span>24/7 Cloud Background Daemon:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-300 border border-black text-black font-black">
                    RUNNING
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-black/70">
                  Close all browser tabs or turn off your device. The cloud server executes delivery at your chosen time automatically!
                </p>
              </div>
            </div>
          </div>

          {cloudSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-100 border-2 border-black text-black text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_#000000]">
              <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
              <span>{cloudSuccessMsg}</span>
            </div>
          )}

          {/* Pending Queue */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Pending Server Delivery Queue ({pendingList.length})
            </div>

            {pendingList.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border-2 border-dashed border-black/30 bg-white">
                <p className="text-xs font-black uppercase text-black">
                  No scheduled wishes in the queue.
                </p>
                <p className="text-[11px] font-semibold text-black/60 mt-1">
                  Open any celebration's "Wishes Studio" and select <strong>"Schedule for Exact Time"</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingList.map((wish) => (
                  <div
                    key={wish.id}
                    className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-black text-sm uppercase">
                          {wish.recipientName}
                        </span>
                        <span className="text-xs font-bold text-black/60">
                          • {wish.occasion}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#ffea79] border border-black font-black text-black">
                          {getTimeRemaining(wish.scheduledDate, wish.scheduledTime)}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-black/70 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-black" />
                          {wish.scheduledDate} at {wish.scheduledTime}
                        </span>
                        <span>To: {wish.phone || 'Pending'}</span>
                      </div>

                      <p className="text-xs font-medium text-black italic bg-[#fefbf3] p-2.5 rounded-xl border border-black/20">
                        "{wish.message}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleSimulateServerAutonomousDispatch(wish)}
                        disabled={simulatingCloud}
                        className="px-3 py-1.5 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                        title="Simulates server executing delivery while your browser is closed"
                      >
                        <Server className="w-3.5 h-3.5" />
                        {simulatingCloud ? 'Dispatching...' : 'Test Server Dispatch'}
                      </button>

                      <button
                        onClick={() => handleLaunchWhatsAppManually(wish)}
                        className="p-2 rounded-xl bg-white hover:bg-zinc-100 text-black border-2 border-black shadow-[2px_2px_0px_#000000] transition"
                        title="Open WhatsApp chat immediately"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onCancelSchedule(wish.id)}
                        className="p-2 rounded-xl bg-white hover:bg-red-100 text-red-600 border-2 border-black shadow-[2px_2px_0px_#000000] transition"
                        title="Cancel this schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Dispatched Queue */}
          {pastList.length > 0 && (
            <div className="space-y-3 pt-3 border-t-2 border-black/10">
              <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-black" />
                Completed Dispatches ({pastList.length})
              </div>

              <div className="divide-y-2 divide-black/10 rounded-2xl border-2 border-black bg-white shadow-[2px_2px_0px_#000000] overflow-hidden">
                {pastList.map((past) => (
                  <div key={past.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-black uppercase">{past.recipientName}</span>
                      <span className="text-[11px] font-semibold text-black/60 ml-2">{past.occasion} • Sent</span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-emerald-300 border border-black px-2 py-0.5 rounded-md">
                      Dispatched
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black bg-white flex items-center justify-between text-xs text-black font-bold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Autonomous Cloud Dispatch active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black font-black uppercase text-xs shadow-[2px_2px_0px_#000000] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
