import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Phone, 
  Sparkles, 
  Copy, 
  Check, 
  Wand2, 
  Gift, 
  Share2, 
  Calendar, 
  Image as ImageIcon,
  ExternalLink,
  HeartHandshake,
  Flame,
  Zap,
  BookOpen,
  Clock,
  BellRing,
  Globe,
  Radio
} from 'lucide-react';
import { OccasionEvent, WishOption, GiftIdea, ScheduledWish, UserAccount } from '../types/occasion';
import { 
  getOccasionLabel, 
  getNextOccurrence, 
  generateWhatsAppUrl, 
  generateSmsUrl,
  generateGoogleCalendarUrl 
} from '../utils/dateCalculations';
import { NotificationService } from '../utils/notificationService';
import confetti from 'canvas-confetti';

interface SendWishesModalProps {
  event: OccasionEvent;
  isOpen: boolean;
  onClose: () => void;
  onOpenPhotoEditor: (event: OccasionEvent) => void;
  onMarkWished: (eventId: string, message: string, method: string) => void;
  onSaveSchedule?: (schedule: ScheduledWish) => void;
  currentUser?: UserAccount | null;
}

export const SendWishesModal: React.FC<SendWishesModalProps> = ({
  event,
  isOpen,
  onClose,
  onOpenPhotoEditor,
  onMarkWished,
  onSaveSchedule,
  currentUser,
}) => {
  const [wishes, setWishes] = useState<WishOption[]>([]);
  const [selectedWishIndex, setSelectedWishIndex] = useState<number>(0);
  const [customizedMessage, setCustomizedMessage] = useState<string>('');
  const [giftIdeas, setGiftIdeas] = useState<GiftIdea[]>([]);
  const [stylingTip, setStylingTip] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>(event.phone || '');
  const [extraDetails, setExtraDetails] = useState<string>(event.notes || '');

  // Sending mode: 'now' vs 'schedule'
  const [sendTab, setSendTab] = useState<'now' | 'schedule'>('now');

  // Schedule parameters
  const occurrence = getNextOccurrence(event);
  const defaultDateStr = occurrence.nextDate.toISOString().slice(0, 10);
  const [scheduledDate, setScheduledDate] = useState<string>(defaultDateStr);
  const [scheduledTime, setScheduledTime] = useState<string>('00:01'); // 12:01 AM Midnight Surprise by default
  const [deliveryMode, setDeliveryMode] = useState<'alarm_prompt' | 'webhook_api'>('alarm_prompt');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [scheduleSuccess, setScheduleSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneInput(event.phone || '');
      setExtraDetails(event.notes || '');
      setScheduledDate(occurrence.nextDate.toISOString().slice(0, 10));
      setScheduledTime('00:01');
      setScheduleSuccess(false);
      fetchAiWishes();
    }
  }, [isOpen, event]);

  const fetchAiWishes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.name,
          occasion: getOccasionLabel(event),
          relationship: event.relationship,
          customDetails: extraDetails,
          milestoneYears: occurrence.yearsCount,
        }),
      });

      const data = await res.json();
      const generatedWishes: WishOption[] = data.wishes || data.fallbackWishes || [];
      setWishes(generatedWishes);
      if (generatedWishes.length > 0) {
        setSelectedWishIndex(0);
        setCustomizedMessage(generatedWishes[0].message);
      }
      if (data.suggestedGiftIdeas) {
        setGiftIdeas(data.suggestedGiftIdeas);
      }
      if (data.stylingTip) {
        setStylingTip(data.stylingTip);
      }
    } catch (e) {
      console.error('Error loading AI wishes:', e);
      const fallback = [
        {
          tone: 'heartfelt',
          title: 'Heartfelt Warmth',
          message: `Happy ${getOccasionLabel(event)}, ${event.name}! 🎉 Wishing you a year full of happiness, health, and laughter. So grateful to have you in my life!`,
          emojis: '❤️✨🎂',
        },
        {
          tone: 'roast',
          title: 'I Actually Remembered!',
          message: `Can we take a moment to appreciate that I remembered your ${getOccasionLabel(event)} on time?! Happy ${getOccasionLabel(event)}, ${event.name}! You're one in a million. 😂🏆`,
          emojis: '📅😂🙌',
        },
      ];
      setWishes(fallback);
      setSelectedWishIndex(0);
      setCustomizedMessage(fallback[0].message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWish = (index: number) => {
    setSelectedWishIndex(index);
    if (wishes[index]) {
      setCustomizedMessage(wishes[index].message);
    }
  };

  const handleCopyWish = () => {
    navigator.clipboard.writeText(customizedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const url = generateWhatsAppUrl(phoneInput, customizedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    onMarkWished(event.id, customizedMessage, 'whatsapp');
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleSendSms = () => {
    const url = generateSmsUrl(phoneInput, customizedMessage);
    window.location.href = url;
    onMarkWished(event.id, customizedMessage, 'sms');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${getOccasionLabel(event)} wish for ${event.name}`,
          text: customizedMessage,
        });
        onMarkWished(event.id, customizedMessage, 'native_share');
      } catch (err) {
        console.warn('Share dismissed:', err);
      }
    } else {
      handleCopyWish();
    }
  };

  // Schedule WhatsApp Wish for selected date and time
  const handleScheduleWhatsAppWish = async () => {
    if (!scheduledDate || !scheduledTime) return;

    try {
      const token = currentUser?.token || localStorage.getItem('bad_with_dates_auth_token') || '';
      const payload: Partial<ScheduledWish> = {
        eventId: event.id,
        recipientName: event.name,
        phone: phoneInput,
        occasion: getOccasionLabel(event),
        scheduledDate,
        scheduledTime,
        message: customizedMessage,
        mode: deliveryMode,
        webhookUrl: deliveryMode === 'webhook_api' ? webhookUrl : undefined,
      };

      const res = await fetch('/api/user/schedules', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setScheduleSuccess(true);
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.6 },
        });

        if (onSaveSchedule && data.scheduledItem) {
          onSaveSchedule(data.scheduledItem);
        }

        NotificationService.showNotification(
          `⏰ WhatsApp Wish Registered for ${event.name}!`,
          `24/7 Cloud Background Daemon will send on ${scheduledDate} at ${scheduledTime}. Web app does not need to stay open!`
        );
      }
    } catch (err) {
      console.error('Failed to schedule wish:', err);
    }
  };

  const handleTestScheduleTriggerNow = () => {
    NotificationService.playCelebrationChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    NotificationService.showNotification(
      `⏰ [Simulated Alarm] Time reached for ${event.name}'s ${getOccasionLabel(event)}!`,
      `Scheduled wish is ready. Tap to open WhatsApp chat now!`
    );

    const url = generateWhatsAppUrl(phoneInput, customizedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'heartfelt':
        return <HeartHandshake className="w-4 h-4 text-rose-400" />;
      case 'roast':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'punchy':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'poetic':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#fefbf3] border-[2.5px] border-black rounded-3xl shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[2.5px] border-black bg-[#ffea79]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000000]">
              <MessageSquare className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                WhatsApp & SMS Wishes Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-black font-black text-black">
                  {getOccasionLabel(event)} • {event.relationship}
                </span>
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                To: <strong className="text-black">{event.name}</strong> • Next: {occurrence.formattedDate} ({occurrence.isToday ? 'Today! 🎉' : `in ${occurrence.daysRemaining} days`})
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

        {/* Mode Selector: Send Now vs Schedule for Selected Time */}
        <div className="px-6 pt-3 pb-0 flex gap-2 border-b-2 border-black bg-[#ffea79]/20">
          <button
            onClick={() => setSendTab('now')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-2 border-b-0 border-black ${
              sendTab === 'now'
                ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            ⚡ Send Right Now
          </button>

          <button
            onClick={() => setSendTab('schedule')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-2 border-2 border-b-0 border-black ${
              sendTab === 'schedule'
                ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            ⏰ Schedule for Exact Time (e.g. 12:01 AM)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#fefbf3]">
          {/* Top Banner: Photo Preview & Quick Edit trigger */}
          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#ffea79] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                {event.editedPhotoUrl || event.photoUrl ? (
                  <img
                    src={event.editedPhotoUrl || event.photoUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-black">
                    {event.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {event.editedPhotoUrl && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-black" title="Occasion photo decorated" />
                )}
              </div>

              <div>
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                  Celebration Photo Card
                  {event.editedPhotoUrl ? (
                    <span className="text-[10px] font-black text-black bg-[#ffea79] px-2 py-0.5 rounded-md border border-black">
                      Decorated
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-black/50">
                      Standard
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-black/70 mt-0.5">
                  {event.editedPhotoUrl 
                    ? 'Festive frame & occasion stickers ready to send!' 
                    : 'Personalize with hats, confetti, custom frames & crowns'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenPhotoEditor(event)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-[#ffea79] border-2 border-black text-xs font-black uppercase text-black flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000] transition"
            >
              <ImageIcon className="w-4 h-4" />
              {event.editedPhotoUrl ? 'Edit Styled Card' : 'Open Photo Decorator'}
            </button>
          </div>

          {/* AI Wishes Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                AI Generated Wishes for {getOccasionLabel(event)}
              </label>

              <button
                onClick={fetchAiWishes}
                disabled={loading}
                className="text-xs text-black font-black uppercase hover:underline flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Crafting...' : 'Regenerate'}
              </button>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-black/70 gap-3 bg-white rounded-2xl border-2 border-black">
                <div className="w-8 h-8 border-2 border-black border-t-[#ffea79] rounded-full animate-spin" />
                <p className="text-xs font-bold">Gemini is creating tailored {getOccasionLabel(event)} wishes for {event.name}...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {wishes.map((wish, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectWish(idx)}
                    className={`p-4 rounded-2xl border-2 border-black text-left cursor-pointer transition flex flex-col justify-between gap-3 ${
                      selectedWishIndex === idx
                        ? 'bg-[#ffea79] text-black shadow-[4px_4px_0px_#000000] -translate-y-0.5'
                        : 'bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-black flex items-center gap-2">
                        {getToneIcon(wish.tone)}
                        {wish.title}
                      </span>
                      <span className="text-base">{wish.emojis}</span>
                    </div>

                    <p className="text-xs font-medium text-black line-clamp-3 leading-relaxed">
                      "{wish.message}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t-2 border-black/10 text-[10px]">
                      <span className="font-bold text-black/70 uppercase">{wish.tone} tone</span>
                      <span className="font-black text-black">
                        {selectedWishIndex === idx ? '✓ Selected' : 'Tap to select'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Final Message Before Sending */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                Message Preview & Customization
              </label>
              <button
                onClick={handleCopyWish}
                className="text-xs text-black font-bold hover:underline flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>
            </div>

            <textarea
              rows={3}
              value={customizedMessage}
              onChange={(e) => setCustomizedMessage(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-white border-2 border-black text-black font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000] leading-relaxed"
              placeholder="Your celebration wish message..."
            />
          </div>

          {/* Phone Number & Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Recipient WhatsApp Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-black/60" />
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. +14155552671 or 4155552671"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
              <p className="text-[10px] font-semibold text-black/60 mt-1">
                Include country code for direct WhatsApp dispatch (e.g. +1, +44, +91).
              </p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Occasion Personality Note
              </label>
              <input
                type="text"
                value={extraDetails}
                onChange={(e) => setExtraDetails(e.target.value)}
                placeholder="e.g. loves sushi, turning 30, got promoted to VP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
              />
            </div>
          </div>

          {/* SCHEDULED SENDING CONFIGURATION (When in 'schedule' tab) */}
          {sendTab === 'schedule' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#ffea79]/30 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                  <Clock className="w-4 h-4" />
                  Configure Delivery Time & Date
                </div>
                <span className="text-[11px] font-bold text-black/80">
                  Autonomous 24/7 Server Dispatch
                </span>
              </div>

              {/* Date & Time Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                    Scheduled Time (24h)
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              {/* Quick Time Preset Buttons */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                  Quick Time Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { time: '00:01', label: '🌙 12:01 AM (Midnight Surprise)' },
                    { time: '08:00', label: '☀️ 08:00 AM (Morning Sunshine)' },
                    { time: '12:30', label: '🥪 12:30 PM (Lunch Break)' },
                    { time: '19:00', label: '🥂 07:00 PM (Evening Party)' },
                  ].map((preset) => (
                    <button
                      key={preset.time}
                      type="button"
                      onClick={() => setScheduledTime(preset.time)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition ${
                        scheduledTime === preset.time
                          ? 'bg-[#ffea79] text-black shadow-[2px_2px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Mode Choice */}
              <div className="space-y-2 pt-2 border-t-2 border-black/20">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  Delivery Automation Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setDeliveryMode('alarm_prompt')}
                    className={`p-3.5 rounded-2xl border-2 border-black cursor-pointer transition flex flex-col gap-1 ${
                      deliveryMode === 'alarm_prompt'
                        ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                        : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5" />
                        Timed Cloud Server Dispatch
                      </span>
                      <span className="text-[10px] bg-black text-[#ffea79] px-2 py-0.5 rounded font-black">Recommended</span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/70">
                      Dispatches automatically from the server at the exact scheduled minute, even when browser tab is closed!
                    </p>
                  </div>

                  <div
                    onClick={() => setDeliveryMode('webhook_api')}
                    className={`p-3.5 rounded-2xl border-2 border-black cursor-pointer transition flex flex-col gap-1 ${
                      deliveryMode === 'webhook_api'
                        ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                        : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Webhook / API Dispatch
                      </span>
                      <span className="text-[10px] bg-white border border-black px-1.5 py-0.5 rounded font-black">Headless</span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/70">
                      Forwards payload to custom WhatsApp Bot API or webhook URL at the designated time.
                    </p>
                  </div>
                </div>

                {deliveryMode === 'webhook_api' && (
                  <div className="mt-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.your-whatsapp-bot.com/send"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                )}
              </div>

              {/* Schedule Confirmation or Actions */}
              {scheduleSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-100 border-2 border-black flex items-center justify-between text-xs text-black font-bold shadow-[2px_2px_0px_#000000]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Wish scheduled for {scheduledDate} at {scheduledTime}!</span>
                  </div>
                  <button
                    onClick={handleTestScheduleTriggerNow}
                    className="underline text-black font-black hover:text-emerald-900"
                  >
                    Test Server Alarm
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScheduleWhatsAppWish}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Confirm WhatsApp Schedule for {scheduledTime}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestScheduleTriggerNow}
                    className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-zinc-100 text-black text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] transition"
                    title="Preview what happens when time strikes"
                  >
                    Test Alarm
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Curated Gift Ideas */}
          {giftIdeas.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
                <Gift className="w-4 h-4" />
                AI Gift & Celebration Suggestions for {event.name}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {giftIdeas.map((gift, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#ffea79]/20 border border-black text-xs">
                    <div className="font-black text-black uppercase">{gift.title}</div>
                    <div className="text-[11px] font-semibold text-black/70 mt-1">{gift.reason}</div>
                    <div className="text-[10px] text-black font-black mt-1.5">{gift.priceRange}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div className="p-4 sm:p-5 border-t-2 border-black bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={generateGoogleCalendarUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-black text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              Sync Calendar
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSendSms}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000] flex items-center gap-2 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              SMS
            </button>

            <button
              onClick={handleNativeShare}
              className="p-2 rounded-xl bg-white hover:bg-zinc-100 border-2 border-black text-black text-xs shadow-[2px_2px_0px_#000000] transition"
              title="Share via Native Sheet"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              Send WhatsApp Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
