import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { OccasionEvent } from '../types/occasion';
import { NotificationService } from '../utils/notificationService';
import { generateIcsFile, getNextOccurrence, getOccasionLabel } from '../utils/dateCalculations';
import confetti from 'canvas-confetti';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: OccasionEvent[];
  onTriggerTestEventNotification: (event: OccasionEvent) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  events,
  onTriggerTestEventNotification,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPermissionState(NotificationService.getPermissionState());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermissionState(res);
    if (res === 'granted') {
      NotificationService.showNotification(
        '🔔 Bad with Dates: Alerts Active!',
        'You will now get automated alerts for your upcoming birthdays and anniversaries on time.'
      );
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleTestChime = () => {
    NotificationService.playCelebrationChime();
  };

  const handleFireTestAlert = () => {
    setTestSent(true);
    NotificationService.playCelebrationChime();

    const sampleEvent = events[0] || {
      id: 'test',
      name: 'Sarah',
      relationship: 'Best Friend',
      occasionType: 'birthday',
      date: '2026-10-25',
      repeatYearly: true,
      remindDaysBefore: [7, 1, 0],
      createdAt: new Date().toISOString(),
    };

    NotificationService.showNotification(
      `🎉 Bad with Dates: ${sampleEvent.name}'s Birthday is coming up!`,
      `Scheduled WhatsApp wish will dispatch autonomously from server!`
    );

    onTriggerTestEventNotification(sampleEvent as OccasionEvent);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleExportIcs = () => {
    const icsData = generateIcsFile(events);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bad-with-dates-all-anniversaries-${new Date().toISOString().slice(0, 10)}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#fefbf3] border-[2.5px] border-black rounded-3xl shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[2.5px] border-black bg-[#ffea79]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000000]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                Notification Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-[#ffea79] font-black">
                  24/7 ACTIVE
                </span>
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                Web Push API, Cloud Daemon & iCal Synchronizer
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
          {/* Permission Status Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] ${
                permissionState === 'granted'
                  ? 'bg-emerald-300 text-black'
                  : 'bg-[#ffea79] text-black'
              }`}>
                {permissionState === 'granted' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                  Browser Push Notifications:
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border border-black font-black uppercase ${
                    permissionState === 'granted'
                      ? 'bg-emerald-300 text-black'
                      : 'bg-[#ffea79] text-black'
                  }`}>
                    {permissionState}
                  </span>
                </div>
                <div className="text-xs font-semibold text-black/70 mt-1">
                  {permissionState === 'granted'
                    ? 'Active! You will receive on-screen alerts when dates are near.'
                    : 'Grant permission to enable desktop countdown alert toasts.'}
                </div>
              </div>
            </div>

            {permissionState !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] transition whitespace-nowrap"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* Quick Test & Sound Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-black" />
                  Harmonic Audio Chime
                </div>
                <div className="text-xs font-semibold text-black/70 mt-1">
                  Synthesized harmonic bells that play when milestone alerts trigger.
                </div>
              </div>

              <button
                onClick={handleTestChime}
                className="px-3.5 py-2 rounded-xl bg-[#ffea79]/40 hover:bg-[#ffea79] text-xs font-black uppercase text-black border-2 border-black flex items-center justify-center gap-2 transition shadow-[2px_2px_0px_#000000]"
              >
                <Volume2 className="w-3.5 h-3.5 text-black" />
                Play Test Chime
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  Simulate Push Alert
                </div>
                <div className="text-xs font-semibold text-black/70 mt-1">
                  Trigger an immediate notification cycle to preview countdown alerts.
                </div>
              </div>

              <button
                onClick={handleFireTestAlert}
                className="px-3.5 py-2 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] text-xs font-black uppercase text-black border-2 border-black flex items-center justify-center gap-2 transition shadow-[2px_2px_0px_#000000]"
              >
                <Bell className={`w-3.5 h-3.5 ${testSent ? 'animate-bounce' : ''}`} />
                {testSent ? 'Alert Fired!' : 'Fire Test Alert'}
              </button>
            </div>
          </div>

          {/* Calendar Sync (.ics Export) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#ffea79]/40 border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
                  Sync All Dates with Calendar
                </div>
                <div className="text-xs font-semibold text-black/70">
                  Export all {events.length} celebrations into an .ics calendar file for Apple, Google & Outlook.
                </div>
              </div>
            </div>

            <button
              onClick={handleExportIcs}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-2 transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download .ICS
            </button>
          </div>

          {/* Upcoming Schedule List */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Upcoming Automated Queue ({events.length} Events)
            </div>

            <div className="divide-y-2 divide-black/10 rounded-2xl border-2 border-black bg-white shadow-[3px_3px_0px_#000000] overflow-hidden">
              {events.slice(0, 6).map((evt) => {
                const occ = getNextOccurrence(evt);
                return (
                  <div key={evt.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#ffea79] border-2 border-black flex items-center justify-center text-sm shadow-[1px_1px_0px_#000000]">
                        {evt.occasionType === 'birthday' ? '🎂' : evt.occasionType === 'anniversary' ? '💍' : '🎉'}
                      </div>
                      <div>
                        <div className="font-black text-black uppercase">
                          {evt.name} — {getOccasionLabel(evt)}
                        </div>
                        <div className="text-[11px] font-semibold text-black/70">
                          {occ.formattedDate} • {occ.isToday ? 'Today! 🎉' : `in ${occ.daysRemaining} days`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-black bg-[#ffea79] px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_#000000]">
                        {evt.remindDaysBefore?.map(d => d === 0 ? 'Day-of' : `${d}d`).join(', ') || '7d, 1d'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black bg-white flex items-center justify-between text-xs text-black/70">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>24/7 Server Daemon runs even with tab closed</span>
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
