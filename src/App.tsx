import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Bell, 
  Search, 
  Sparkles, 
  Heart, 
  Cake, 
  Briefcase, 
  GraduationCap, 
  Gift, 
  Send, 
  Download, 
  CheckCircle2, 
  Clock, 
  Filter, 
  SlidersHorizontal,
  Flame,
  Volume2,
  PartyPopper,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Zap,
  Award,
  Trash2,
  LogOut,
  Server,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  MoreVertical,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OccasionEvent, OccasionType, ScheduledWish, UserAccount } from './types/occasion';
import { INITIAL_EVENTS } from './data/initialEvents';
import { EventCard } from './components/EventCard';
import { AddOccasionModal } from './components/AddOccasionModal';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { SendWishesModal } from './components/SendWishesModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ScheduledWishesModal } from './components/ScheduledWishesModal';
import { WhatsAppAuthScreen } from './components/WhatsAppAuthScreen';
import { NotificationService } from './utils/notificationService';
import { getNextOccurrence, getOccasionLabel, generateWhatsAppUrl } from './utils/dateCalculations';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'bad_with_dates_clean_v1';

export default function App() {
  // Current Authenticated WhatsApp User
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('bad_with_dates_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load user:', e);
    }
    return null;
  });

  const [events, setEvents] = useState<OccasionEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((e: any) => !['evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5'].includes(e.id));
      }
    } catch (e) {
      console.warn('Failed to load events from storage:', e);
    }
    return INITIAL_EVENTS;
  });

  // Active navigation tab (for mobile bottom bar and filter)
  const [activeNavTab, setActiveNavTab] = useState<'loved_ones' | 'celebrations' | 'scheduled' | 'stats'>('loved_ones');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OccasionEvent | null>(null);
  const [addPreset, setAddPreset] = useState<{ name?: string; relationship?: string; occasionType?: OccasionType; notes?: string } | null>(null);
  
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedPhotoEvent, setSelectedPhotoEvent] = useState<OccasionEvent | null>(null);

  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [selectedWishEvent, setSelectedWishEvent] = useState<OccasionEvent | null>(null);

  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isScheduledWishesModalOpen, setIsScheduledWishesModalOpen] = useState(false);

  // Scheduled WhatsApp wishes state
  const [scheduledWishes, setScheduledWishes] = useState<ScheduledWish[]>(() => {
    try {
      const saved = localStorage.getItem('bad_with_dates_schedules_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load schedules from storage:', e);
    }
    return [];
  });

  // Calendar week offset (0 = current week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Fetch server data on user login
  useEffect(() => {
    if (currentUser?.token) {
      fetch('/api/user/events', {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.events && Array.isArray(data.events) && data.events.length > 0) {
            setEvents(data.events);
          }
        })
        .catch((err) => console.warn('Could not sync events from server:', err));

      fetch('/api/user/schedules', {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.schedules && Array.isArray(data.schedules)) {
            setScheduledWishes(data.schedules);
          }
        })
        .catch((err) => console.warn('Could not sync schedules from server:', err));
    }
  }, [currentUser]);

  // Save events to localStorage & server
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [events]);

  // Save schedules to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bad_with_dates_schedules_v1', JSON.stringify(scheduledWishes));
    } catch (e) {
      console.warn('Failed to save schedules:', e);
    }
  }, [scheduledWishes]);

  // Notification setup
  useEffect(() => {
    if (NotificationService.isSupported()) {
      setNotificationPermission(NotificationService.getPermissionState());
    }
  }, []);

  // Background timer for active scheduled items
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentDateStr = now.toISOString().slice(0, 10);
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      setScheduledWishes((prev) => {
        let changed = false;
        const updated = prev.map((wish) => {
          if (wish.status === 'pending' && wish.scheduledDate === currentDateStr && wish.scheduledTime === currentTimeStr) {
            changed = true;
            NotificationService.playCelebrationChime();

            NotificationService.showNotification(
              `⏰ TIME REACHED: ${wish.recipientName}'s ${wish.occasion}!`,
              `Your scheduled WhatsApp wish is ready. Click to send directly on WhatsApp!`,
              undefined,
              () => {
                const waUrl = generateWhatsAppUrl(wish.phone, wish.message);
                window.open(waUrl, '_blank', 'noopener,noreferrer');
              }
            );

            const waUrl = generateWhatsAppUrl(wish.phone, wish.message);
            window.open(waUrl, '_blank', 'noopener,noreferrer');

            return { ...wish, status: 'sent' as const, sentAt: new Date().toISOString() };
          }
          return wish;
        });
        return changed ? updated : prev;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Filtered & Sorted Events
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const occA = getNextOccurrence(a);
      const occB = getNextOccurrence(b);
      return occA.daysRemaining - occB.daysRemaining;
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOccasionLabel(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'birthday' && item.occasionType === 'birthday') ||
        (selectedCategory === 'anniversary' &&
          ['anniversary', 'wedding', 'relationship'].includes(item.occasionType)) ||
        (selectedCategory === 'milestone' &&
          ['promotion', 'graduation', 'custom'].includes(item.occasionType)) ||
        (selectedCategory === 'pet' && item.occasionType === 'pet');

      return matchesSearch && matchesCat;
    });
  }, [sortedEvents, searchQuery, selectedCategory]);

  // Urgent upcoming event for the Hero Challenge Card (like reference image)
  const heroEvent = useMemo(() => {
    return sortedEvents[0] || null;
  }, [sortedEvents]);

  // Weekly calendar strip dates calculation
  const weekDays = useMemo(() => {
    const curr = new Date();
    curr.setDate(curr.getDate() + weekOffset * 7);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayNum = d.getDate();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dayNum).padStart(2, '0');
      const fullDateStr = `${d.getFullYear()}-${monthStr}-${dayStr}`;

      // Check if any event has birthday/anniversary on this month-day
      const hasCelebration = events.some((evt) => {
        const occ = getNextOccurrence(evt);
        return occ.nextDate.getDate() === dayNum && occ.nextDate.getMonth() === d.getMonth();
      });

      const isToday = new Date().toDateString() === d.toDateString();

      days.push({
        name: dayNames[i],
        number: dayNum,
        fullDateStr,
        isToday,
        hasCelebration,
      });
    }
    return days;
  }, [weekOffset, events]);

  // Handler: Save Event (Add or Edit)
  const handleSaveEvent = (eventData: Omit<OccasionEvent, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setEvents((prev) =>
        prev.map((e) => (e.id === existingId ? { ...e, ...eventData } : e))
      );
      if (currentUser?.token) {
        fetch('/api/user/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify({ ...eventData, id: existingId }),
        }).catch(() => {});
      }
    } else {
      const newEvent: OccasionEvent = {
        ...eventData,
        id: `user-evt-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [newEvent, ...prev]);
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
      });
      NotificationService.playCelebrationChime();

      if (currentUser?.token) {
        fetch('/api/user/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify(newEvent),
        }).catch(() => {});
      }
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (currentUser?.token) {
      fetch(`/api/user/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      }).catch(() => {});
    }
  };

  const handleSaveEditedPhoto = (eventId: string, dataUrl: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, editedPhotoUrl: dataUrl } : e))
    );
  };

  const handleMarkWished = (eventId: string, message: string, method: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const count = (e.wishedCount || 0) + 1;
          return {
            ...e,
            lastWishedAt: new Date().toISOString(),
            wishedCount: count,
          };
        }
        return e;
      })
    );
  };

  const openAddModal = (preset?: { name?: string; relationship?: string; occasionType?: OccasionType; notes?: string }) => {
    setEditingEvent(null);
    setAddPreset(preset || null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (event: OccasionEvent) => {
    setEditingEvent(event);
    setAddPreset(null);
    setIsAddModalOpen(true);
  };

  const openPhotoEditor = (event: OccasionEvent) => {
    setSelectedPhotoEvent(event);
    setIsPhotoEditorOpen(true);
  };

  const openWishModal = (event: OccasionEvent) => {
    setSelectedWishEvent(event);
    setIsWishModalOpen(true);
  };

  const handlePartyThrow = () => {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
    });
    NotificationService.playCelebrationChime();
  };

  // If user is not yet logged in with their WhatsApp number, show WhatsAppAuthScreen
  if (!currentUser) {
    return (
      <WhatsAppAuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('bad_with_dates_current_user', JSON.stringify(user));
          localStorage.setItem('bad_with_dates_auth_token', user.token);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dot-pattern flex flex-col items-center p-0 sm:p-4 lg:p-8 font-sans text-slate-900 selection:bg-[#fde047] selection:text-black">
      {/* Neo-Brutalist Frame Container: full width on desktop with max-w-7xl, clean phone aspect on mobile */}
      <div className="w-full max-w-7xl min-h-screen sm:min-h-0 sm:rounded-[36px] bg-[#fdfbf7] border-0 sm:border-[3px] border-black neo-shadow-lg flex flex-col overflow-hidden relative pb-20 sm:pb-8">
        
        {/* TOP STATUS BAR (Inspired by Mockup: Service 19:02 Battery) */}
        <div className="px-6 py-2.5 bg-[#fefbf3] border-b-2 border-black flex items-center justify-between text-xs font-black tracking-wider uppercase">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-black" />
            <span className="font-mono text-black font-extrabold">Service: 24/7 Cloud Active</span>
          </div>

          <div className="font-mono font-black text-black">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#fde047] px-2 py-0.5 rounded-full border border-black font-black">
              Autonomy: 100%
            </span>
          </div>
        </div>

        {/* PROFILE HEADER (Matching Reference Image top bar) */}
        <header className="px-5 sm:px-8 py-4 bg-[#fdfbf7] border-b-2 border-black flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Illustrated Line-Art Profile Avatar */}
            <div 
              onClick={handlePartyThrow}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-black bg-white flex items-center justify-center neo-shadow-sm flex-shrink-0 cursor-pointer overflow-hidden group"
              title="Click for celebration chime!"
            >
              <svg className="w-10 h-10 group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="32" cy="28" r="14" />
                <circle cx="27" cy="27" r="1.5" fill="black" />
                <circle cx="37" cy="27" r="1.5" fill="black" />
                <path d="M29 34C30.5 35.5 33.5 35.5 35 34" strokeLinecap="round" />
                <path d="M19 48C19 42 24 40 32 40C40 40 45 42 45 48" />
                {/* Glasses */}
                <circle cx="27" cy="27" r="4.5" />
                <circle cx="37" cy="27" r="4.5" />
                <path d="M31.5 27H32.5" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-black tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#fde047] border border-black font-extrabold neo-shadow-sm hidden sm:inline-block">
                  Bad with Dates
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                <span>From:</span>
                <strong className="text-black font-mono">{currentUser.whatsappNumber}</strong>
              </p>
            </div>
          </div>

          {/* Right Header Stats & Buttons (Matching Stars Badge from Mockup) */}
          <div className="flex items-center gap-2.5">
            {/* Stars Pill Badge */}
            <div className="px-3 py-1.5 rounded-full bg-[#bae6fd] border-2 border-black text-xs font-black flex items-center gap-1.5 neo-shadow-sm">
              <Star className="w-3.5 h-3.5 fill-black text-black" />
              <span>{events.length * 15 + 15} Stars</span>
            </div>

            {/* Scheduled Queue Button */}
            <button
              onClick={() => setIsScheduledWishesModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border-2 border-black text-xs font-black flex items-center gap-1.5 neo-btn cursor-pointer"
              title="View Scheduled Queue"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Scheduled</span>
              {scheduledWishes.filter((w) => w.status === 'pending').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                  {scheduledWishes.filter((w) => w.status === 'pending').length}
                </span>
              )}
            </button>

            {/* Alerts & Calendar Sync */}
            <button
              onClick={() => setIsNotificationsModalOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-white hover:bg-slate-50 border-2 border-black text-xs font-black flex items-center gap-1.5 neo-btn cursor-pointer"
              title="Alerts & Calendar Sync"
            >
              <Bell className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden md:inline">Alerts</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                if (window.confirm('Disconnect your WhatsApp session?')) {
                  setCurrentUser(null);
                  localStorage.removeItem('bad_with_dates_current_user');
                  localStorage.removeItem('bad_with_dates_auth_token');
                }
              }}
              className="p-2 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-2 border-black neo-btn"
              title="Logout WhatsApp"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* DYNAMIC CONTENT GRID: Responsive Desktop 3-Column / Mobile Single Column */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Weekly Calendar Strip + Hero Countdown Card (Desktop 4-cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* WEEKLY CALENDAR STRIP (Exact Replica from Mockup) */}
            <div className="p-4 rounded-3xl bg-[#fefbf3] border-2 border-black neo-box space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-black px-1">
                <button 
                  onClick={() => setWeekOffset((o) => o - 1)}
                  className="p-1 rounded-lg hover:bg-slate-200 border border-black neo-shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="uppercase tracking-wider font-extrabold">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setWeekOffset((o) => o + 1)}
                  className="p-1 rounded-lg hover:bg-slate-200 border border-black neo-shadow-sm"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Columns */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      {d.name}
                    </span>
                    <button
                      onClick={() => setSelectedCalendarDate(d.fullDateStr === selectedCalendarDate ? null : d.fullDateStr)}
                      className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center transition border ${
                        d.hasCelebration
                          ? 'bg-[#f43f5e] text-white border-black neo-shadow-sm font-extrabold'
                          : d.isToday
                          ? 'bg-[#fde047] text-black border-black font-extrabold'
                          : 'bg-white hover:bg-slate-100 text-black border-transparent'
                      }`}
                      title={d.hasCelebration ? 'Celebration on this day!' : d.fullDateStr}
                    >
                      {d.number}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* HERO CELEBRATION / COUNTDOWN CARD (Matching "Design challenge 5" with retro digit blocks) */}
            {heroEvent ? (
              <div className="p-5 rounded-3xl bg-white border-2 border-black neo-box space-y-4 relative overflow-hidden">
                {/* Bauhaus playful shape accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#fde047] border-l-2 border-b-2 border-black rounded-bl-3xl flex items-center justify-center font-black text-xs">
                  VIP
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  <h2 className="text-xl font-black text-black tracking-tight mt-1">
                    {heroEvent.name}'s {getOccasionLabel(heroEvent)}
                  </h2>

                  <p className="text-xs text-slate-600 font-medium mt-0.5 line-clamp-2">
                    {heroEvent.notes || `Celebration reminder for ${heroEvent.relationship}. Never forget!`}
                  </p>
                </div>

                {/* Recipient Line-Art / Photo Avatar */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-amber-50 border border-black">
                  <div className="w-11 h-11 rounded-full border-2 border-black bg-white flex items-center justify-center overflow-hidden font-black text-sm">
                    {heroEvent.editedPhotoUrl || heroEvent.photoUrl ? (
                      <img src={heroEvent.editedPhotoUrl || heroEvent.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      heroEvent.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-black">{heroEvent.name}</div>
                    <div className="text-[10px] text-slate-600 font-medium">{heroEvent.relationship}</div>
                  </div>
                </div>

                {/* RETRO DIGITAL COUNTDOWN BOXES: [ Days ] : [ Hours ] : [ Mins ] */}
                {(() => {
                  const occ = getNextOccurrence(heroEvent);
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-center">
                        {/* Days box */}
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-[#fefbf3] border-2 border-black neo-shadow flex items-center justify-center font-mono font-black text-2xl text-black">
                            {occ.daysRemaining}
                          </div>
                          <span className="text-[10px] font-black uppercase text-rose-500 mt-1">Days</span>
                        </div>

                        <span className="text-2xl font-black text-rose-500 -mt-4">:</span>

                        {/* Hours box */}
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-[#fefbf3] border-2 border-black neo-shadow flex items-center justify-center font-mono font-black text-2xl text-black">
                            {occ.daysRemaining === 0 ? '0' : String(occ.daysRemaining * 24 % 24).padStart(2, '0')}
                          </div>
                          <span className="text-[10px] font-black uppercase text-rose-500 mt-1">Hours</span>
                        </div>

                        <span className="text-2xl font-black text-rose-500 -mt-4">:</span>

                        {/* Minutes box */}
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-[#fefbf3] border-2 border-black neo-shadow flex items-center justify-center font-mono font-black text-2xl text-black">
                            00
                          </div>
                          <span className="text-[10px] font-black uppercase text-rose-500 mt-1">Minutes</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Big Yellow CTA Button (Matching "I'm Done!" button in mockup) */}
                <button
                  onClick={() => openWishModal(heroEvent)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-black text-sm font-black border-2 border-black neo-btn transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Wish via WhatsApp</span>
                </button>
              </div>
            ) : (
              /* Empty Hero State */
              <div className="p-6 rounded-3xl bg-white border-2 border-black neo-box text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#fde047] border-2 border-black mx-auto flex items-center justify-center text-2xl neo-shadow-sm">
                  🎯
                </div>
                <h3 className="text-base font-black text-black">No Active Celebrations</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Add someone's birthday or anniversary to start automated tracking and countdowns!
                </p>
                <button
                  onClick={() => openAddModal()}
                  className="py-2.5 px-4 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-black text-xs font-black border-2 border-black neo-btn inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Date</span>
                </button>
              </div>
            )}

            {/* 24/7 Cloud Background Daemon Active Guarantee */}
            <div className="p-4 rounded-3xl bg-[#ecfdf5] border-2 border-black neo-box space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-black animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  Cloud Daemon: Running 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                You do <strong>not</strong> need to keep this tab open. Scheduled wishes are executed autonomously by our cloud server on your behalf.
              </p>
            </div>
          </div>

          {/* CENTER & RIGHT COLUMN: Search Bar + Category Pills + Celebrations Grid (Desktop 8-cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SEARCH BAR WITH CIRCULAR PLUS BUTTON (Matching Mockup 3) */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-3.5 text-black" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search loved ones, occasions, notes..."
                  className="w-full pl-12 pr-4 py-3 rounded-full bg-white border-2 border-black text-black text-xs sm:text-sm font-bold neo-shadow-sm focus:outline-none focus:bg-amber-50"
                />
              </div>

              {/* Circular Yellow (+) Action Button */}
              <button
                onClick={() => openAddModal()}
                className="w-12 h-12 rounded-full bg-[#facc15] hover:bg-[#eab308] border-2 border-black flex items-center justify-center text-black font-black text-2xl neo-btn flex-shrink-0 cursor-pointer"
                title="Add New Date"
              >
                +
              </button>
            </div>

            {/* CATEGORY HIGHLIGHTER TABS (Matching Neo-Brutalist Highlighter Style) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Loved Ones' },
                { id: 'birthday', label: 'Birthdays 🎂' },
                { id: 'anniversary', label: 'Anniversaries 💍' },
                { id: 'milestone', label: 'Milestones 🚀' },
                { id: 'pet', label: 'Pets 🐾' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-black border-2 border-black transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#facc15] text-black neo-shadow-sm scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-100 neo-box-sm'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* CELEBRATIONS GRID / LIST */}
            {filteredEvents.length === 0 ? (
              /* Playful Empty State with Quick-Start Chips */
              <div className="p-8 sm:p-12 rounded-3xl bg-[#fefbf3] border-2 border-black neo-box text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-[#fde047] border-2 border-black mx-auto flex items-center justify-center text-3xl neo-shadow-sm">
                  🗓️
                </div>

                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-xl font-black text-black">
                    No Celebrations Here Yet!
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Never send a frantic 11:59 PM "happy belated" text again. Pick who to add first:
                  </p>
                </div>

                {/* Quick Add Presets (Inspired by reference mockup user cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left pt-2">
                  <button
                    onClick={() => openAddModal({ name: 'Mom', relationship: 'Mother', occasionType: 'birthday', notes: 'Loves fresh flowers' })}
                    className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-black neo-btn flex items-center gap-3"
                  >
                    <span className="text-2xl">🌸</span>
                    <div>
                      <div className="text-xs font-black text-black">Mom's Birthday</div>
                      <div className="text-[10px] text-slate-500 font-medium">Highest priority alibi</div>
                    </div>
                  </button>

                  <button
                    onClick={() => openAddModal({ relationship: 'Partner / Spouse', occasionType: 'anniversary' })}
                    className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-black neo-btn flex items-center gap-3"
                  >
                    <span className="text-2xl">💍</span>
                    <div>
                      <div className="text-xs font-black text-black">Relationship Anniversary</div>
                      <div className="text-[10px] text-slate-500 font-medium">Doghouse avoidance</div>
                    </div>
                  </button>

                  <button
                    onClick={() => openAddModal({ relationship: 'Best Friend', occasionType: 'birthday' })}
                    className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-black neo-btn flex items-center gap-3"
                  >
                    <span className="text-2xl">🥳</span>
                    <div>
                      <div className="text-xs font-black text-black">Best Friend's Birthday</div>
                      <div className="text-[10px] text-slate-500 font-medium">Roast & praise ready</div>
                    </div>
                  </button>

                  <button
                    onClick={() => openAddModal({ relationship: 'Colleague / Coworker', occasionType: 'promotion' })}
                    className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-black neo-btn flex items-center gap-3"
                  >
                    <span className="text-2xl">🚀</span>
                    <div>
                      <div className="text-xs font-black text-black">Work Promotion</div>
                      <div className="text-[10px] text-slate-500 font-medium">Career milestone</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Events Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredEvents.map((evt) => (
                    <motion.div
                      key={evt.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EventCard
                        event={evt}
                        onSendWish={openWishModal}
                        onEditPhoto={openPhotoEditor}
                        onEditEvent={openEditModal}
                        onDeleteEvent={handleDeleteEvent}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM FIXED NAVIGATION BAR (Mobile & Tablet Mockup Bar) */}
        {/* On mobile: fixed at bottom of screen. On desktop: integrated bottom footer bar */}
        <div className="fixed sm:sticky bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-white/95 sm:bg-[#fefbf3] backdrop-blur-md border-t-2 border-black flex items-center justify-around sm:justify-center sm:gap-6 shadow-xl sm:shadow-none">
          <div className="flex items-center gap-2 sm:gap-4 p-1.5 rounded-full bg-white border-2 border-black neo-box-sm">
            <button
              onClick={() => setActiveNavTab('loved_ones')}
              className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-1.5 ${
                activeNavTab === 'loved_ones'
                  ? 'bg-[#facc15] text-black border border-black neo-shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <span>👥</span>
              <span>Loved Ones</span>
            </button>

            <button
              onClick={() => setActiveNavTab('celebrations')}
              className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-1.5 ${
                activeNavTab === 'celebrations'
                  ? 'bg-[#facc15] text-black border border-black neo-shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <span>🎂</span>
              <span>Celebrations</span>
            </button>

            <button
              onClick={() => {
                setActiveNavTab('scheduled');
                setIsScheduledWishesModalOpen(true);
              }}
              className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-1.5 ${
                activeNavTab === 'scheduled'
                  ? 'bg-[#facc15] text-black border border-black neo-shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <span>⏰</span>
              <span>Scheduled ({scheduledWishes.filter((w) => w.status === 'pending').length})</span>
            </button>

            <button
              onClick={() => {
                setActiveNavTab('stats');
                setIsNotificationsModalOpen(true);
              }}
              className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-1.5 hidden md:flex ${
                activeNavTab === 'stats'
                  ? 'bg-[#facc15] text-black border border-black neo-shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <span>📊</span>
              <span>Stats & Sync</span>
            </button>
          </div>
        </div>

        {/* FLOATING ACTION BUTTON (FAB) on Mobile Bottom Right */}
        <div className="fixed bottom-20 right-5 z-40 sm:hidden">
          <button
            onClick={() => openAddModal()}
            className="w-14 h-14 rounded-full bg-[#facc15] hover:bg-[#eab308] border-2 border-black flex items-center justify-center text-black font-black text-3xl neo-shadow cursor-pointer"
            title="Add Date"
          >
            +
          </button>
        </div>
      </div>

      {/* MODALS */}
      <AddOccasionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddPreset(null);
        }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        initialPreset={addPreset}
      />

      {selectedPhotoEvent && (
        <PhotoEditorModal
          event={selectedPhotoEvent}
          isOpen={isPhotoEditorOpen}
          onClose={() => setIsPhotoEditorOpen(false)}
          onSaveEditedPhoto={handleSaveEditedPhoto}
        />
      )}

      {selectedWishEvent && (
        <SendWishesModal
          event={selectedWishEvent}
          isOpen={isWishModalOpen}
          currentUser={currentUser}
          onClose={() => setIsWishModalOpen(false)}
          onOpenPhotoEditor={(evt) => {
            setIsWishModalOpen(false);
            openPhotoEditor(evt);
          }}
          onMarkWished={handleMarkWished}
          onSaveSchedule={(schedule) => {
            setScheduledWishes((prev) => [
              schedule,
              ...prev.filter((s) => s.eventId !== schedule.eventId),
            ]);
          }}
        />
      )}

      <NotificationSettingsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        events={events}
        onTriggerTestEventNotification={(testEvt) => {
          setSelectedWishEvent(testEvt);
          setIsWishModalOpen(true);
        }}
      />

      <ScheduledWishesModal
        isOpen={isScheduledWishesModalOpen}
        onClose={() => setIsScheduledWishesModalOpen(false)}
        scheduledWishes={scheduledWishes}
        currentUser={currentUser}
        onCancelSchedule={(id) => {
          setScheduledWishes((prev) => prev.filter((s) => s.id !== id));
          fetch(`/api/user/schedules/${id}`, { 
            method: 'DELETE',
            headers: { Authorization: `Bearer ${currentUser?.token || ''}` },
          }).catch(() => {});
        }}
        onTriggerNow={(wish) => {
          setScheduledWishes((prev) =>
            prev.map((s) => (s.id === wish.id ? { ...s, status: 'sent', sentAt: new Date().toISOString() } : s))
          );
        }}
      />
    </div>
  );
}
