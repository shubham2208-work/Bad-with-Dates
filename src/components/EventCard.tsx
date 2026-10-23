import React from 'react';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Calendar, 
  Edit3, 
  Trash2, 
  Phone, 
  Clock, 
  CheckCircle,
  Star,
  MoreVertical
} from 'lucide-react';
import { OccasionEvent } from '../types/occasion';
import { 
  getNextOccurrence, 
  getOccasionLabel, 
  getOccasionIcon, 
  generateWhatsAppUrl 
} from '../utils/dateCalculations';

interface EventCardProps {
  event: OccasionEvent;
  onSendWish: (event: OccasionEvent) => void;
  onEditPhoto: (event: OccasionEvent) => void;
  onEditEvent: (event: OccasionEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSendWish,
  onEditPhoto,
  onEditEvent,
  onDeleteEvent,
}) => {
  const occ = getNextOccurrence(event);

  const directWhatsAppUrl = generateWhatsAppUrl(
    event.phone,
    `Happy ${getOccasionLabel(event)}, ${event.name}! 🎉 Wishing you the most incredible celebration! (Sent via Bad with Dates)`
  );

  return (
    <div className={`relative rounded-[26px] bg-[#fefbf3] border-[2.5px] border-black transition-all duration-200 flex flex-col justify-between overflow-hidden ${
      occ.isToday
        ? 'neo-box-lg ring-4 ring-[#fde047]'
        : 'neo-box hover:-translate-y-0.5'
    }`}>
      {/* Top Section */}
      <div className="p-5 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar and Details */}
          <div className="flex items-center gap-3.5">
            {/* Circular Avatar */}
            <div 
              onClick={() => onEditPhoto(event)}
              className="relative w-14 h-14 rounded-full overflow-hidden cursor-pointer group/avatar flex-shrink-0 bg-white border-2 border-black neo-shadow-sm transition"
              title="Click to open Occasion Photo Studio"
            >
              {event.editedPhotoUrl || event.photoUrl ? (
                <img
                  src={event.editedPhotoUrl || event.photoUrl}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover/avatar:scale-105 transition duration-200"
                />
              ) : (
                /* Fallback line-art avatar */
                <div className="w-full h-full bg-amber-50 flex items-center justify-center text-black font-black text-lg">
                  {event.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Photo Studio Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>

              {event.editedPhotoUrl && (
                <div className="absolute bottom-0 inset-x-0 bg-[#fde047] text-black font-black text-[8px] text-center uppercase tracking-tight py-0.5 border-t border-black">
                  STYLED
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-black tracking-tight truncate max-w-[160px]">
                  {event.name}
                </h3>
                <span className="text-base">{getOccasionIcon(event.occasionType)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-0.5">
                <span>{event.relationship}</span>
                <span>•</span>
                <span className="text-black font-bold">{getOccasionLabel(event)}</span>
              </div>
            </div>
          </div>

          {/* Urgency Badge */}
          <div className="flex flex-col items-end gap-1.5">
            {occ.isToday ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white border-2 border-black neo-shadow-sm animate-bounce flex items-center gap-1">
                <span>🎉</span> TODAY!
              </span>
            ) : occ.isTomorrow ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#fde047] text-black border-2 border-black neo-shadow-sm">
                TOMORROW
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-black border-2 border-black neo-shadow-sm">
                In {occ.daysRemaining}d
              </span>
            )}

            {occ.milestoneLabel && (
              <span className="text-[10px] font-black uppercase tracking-wider text-black bg-blue-100 border border-black px-2 py-0.5 rounded-full">
                {occ.milestoneLabel}
              </span>
            )}
          </div>
        </div>

        {/* Retro Countdown Digit Box Strip */}
        <div className="p-2.5 rounded-2xl bg-white border-2 border-black neo-shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Days block */}
            <div className="flex flex-col items-center">
              <span className="w-10 h-8 rounded-lg bg-slate-50 border border-black font-mono font-black text-sm flex items-center justify-center text-black">
                {occ.daysRemaining}
              </span>
              <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase">Days</span>
            </div>
            <span className="text-rose-500 font-black text-lg">:</span>

            {/* Hours block */}
            <div className="flex flex-col items-center">
              <span className="w-10 h-8 rounded-lg bg-slate-50 border border-black font-mono font-black text-sm flex items-center justify-center text-black">
                {occ.daysRemaining === 0 ? '0' : String(occ.daysRemaining * 24 % 24).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase">Hours</span>
            </div>
            <span className="text-rose-500 font-black text-lg">:</span>

            {/* Target Date text */}
            <div className="flex flex-col items-center">
              <span className="w-10 h-8 rounded-lg bg-slate-50 border border-black font-mono font-black text-sm flex items-center justify-center text-black">
                00
              </span>
              <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase">Mins</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-black text-black">
              {occ.formattedDate}
            </div>
            {event.phone && (
              <div className="text-[10px] font-mono text-slate-600">
                {event.phone}
              </div>
            )}
          </div>
        </div>

        {/* Note if available */}
        {event.notes && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-black text-[11px] text-slate-700 italic line-clamp-1">
            "{event.notes}"
          </div>
        )}

        {event.lastWishedAt && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Wished {new Date(event.lastWishedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Card Bottom Actions Bar */}
      <div className="p-3.5 bg-amber-50/60 border-t-2 border-black flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEditPhoto(event)}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-black border-2 border-black neo-btn"
            title="Edit Photo Card with Stickers & Frames"
          >
            <ImageIcon className="w-4 h-4 text-rose-500" />
          </button>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-[#25d366]/20 hover:bg-[#25d366]/30 text-emerald-800 border-2 border-black neo-btn"
            title="Open WhatsApp chat directly"
          >
            <Send className="w-4 h-4 text-emerald-700" />
          </a>

          <button
            onClick={() => onEditEvent(event)}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border-2 border-black neo-btn"
            title="Edit Details"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteEvent(event.id)}
            className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-black neo-btn"
            title="Delete Celebration"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onSendWish(event)}
          className="px-4 py-2 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black text-xs font-black border-2 border-black neo-btn flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Wishes Studio</span>
        </button>
      </div>
    </div>
  );
};
