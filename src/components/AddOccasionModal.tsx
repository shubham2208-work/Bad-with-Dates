import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Bell, 
  Upload, 
  Camera,
  Check
} from 'lucide-react';
import { OccasionEvent, OccasionType } from '../types/occasion';

interface AddOccasionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<OccasionEvent, 'id' | 'createdAt'>, existingId?: string) => void;
  editingEvent?: OccasionEvent | null;
  initialPreset?: { name?: string; relationship?: string; occasionType?: OccasionType; notes?: string } | null;
}

const OCCASIONS: { type: OccasionType; label: string; icon: string }[] = [
  { type: 'birthday', label: 'Birthday', icon: '🎂' },
  { type: 'anniversary', label: 'Anniversary', icon: '💍' },
  { type: 'relationship', label: 'Dating / Love', icon: '❤️' },
  { type: 'promotion', label: 'Work Milestone', icon: '💼' },
  { type: 'graduation', label: 'Graduation', icon: '🎓' },
  { type: 'wedding', label: 'Wedding Day', icon: '💒' },
  { type: 'valentine', label: "Valentine's", icon: '💘' },
  { type: 'friendship', label: 'Best Friends', icon: '🌟' },
  { type: 'pet', label: 'Pet Birthday', icon: '🐾' },
  { type: 'custom', label: 'Custom Special', icon: '🎉' },
];

const RELATIONSHIPS = [
  'Partner / Spouse',
  'Best Friend',
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Close Friend',
  'Colleague / Coworker',
  'Boss / Manager',
  'Child',
  'Pet',
  'Other',
];

export const AddOccasionModal: React.FC<AddOccasionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  initialPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Best Friend');
  const [occasionType, setOccasionType] = useState<OccasionType>('birthday');
  const [customOccasionTitle, setCustomOccasionTitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startYear, setStartYear] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [repeatYearly, setRepeatYearly] = useState<boolean>(true);
  const [remindDaysBefore, setRemindDaysBefore] = useState<number[]>([7, 1, 0]);

  useEffect(() => {
    if (editingEvent) {
      setName(editingEvent.name);
      setRelationship(editingEvent.relationship);
      setOccasionType(editingEvent.occasionType);
      setCustomOccasionTitle(editingEvent.customOccasionTitle || '');
      setDate(editingEvent.date);
      setStartYear(editingEvent.startYear ? String(editingEvent.startYear) : '');
      setPhone(editingEvent.phone || '');
      setEmail(editingEvent.email || '');
      setNotes(editingEvent.notes || '');
      setPhotoUrl(editingEvent.photoUrl || '');
      setRepeatYearly(editingEvent.repeatYearly);
      setRemindDaysBefore(editingEvent.remindDaysBefore || [7, 1, 0]);
    } else {
      const target = new Date();
      target.setDate(target.getDate() + 7);
      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');

      setName(initialPreset?.name || '');
      setRelationship(initialPreset?.relationship || 'Best Friend');
      setOccasionType(initialPreset?.occasionType || 'birthday');
      setCustomOccasionTitle('');
      setDate(`${y}-${m}-${d}`);
      setStartYear('');
      setPhone('');
      setEmail('');
      setNotes(initialPreset?.notes || '');
      setPhotoUrl('');
      setRepeatYearly(true);
      setRemindDaysBefore([7, 1, 0]);
    }
  }, [editingEvent, initialPreset, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleReminderDay = (day: number) => {
    setRemindDaysBefore((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    onSave(
      {
        name: name.trim(),
        relationship,
        occasionType,
        customOccasionTitle: customOccasionTitle.trim() || undefined,
        date,
        startYear: startYear ? parseInt(startYear, 10) : undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUrl: photoUrl || undefined,
        repeatYearly,
        remindDaysBefore,
      },
      editingEvent?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fefbf3] border-[2.5px] border-black rounded-3xl shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[2.5px] border-black bg-[#ffea79]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000000]">
              <CalendarIcon className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-black uppercase">
                {editingEvent ? 'Edit Celebration' : 'Add Date to Remember'}
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                Autonomous 24/7 background alerts & WhatsApp auto-dispatch
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#fefbf3]">
          {/* Person Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Person's Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-black/60" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin, Mom, Alex"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Occasion Category Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
              Select Occasion Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {OCCASIONS.map((occ) => {
                const isSelected = occasionType === occ.type;
                return (
                  <button
                    type="button"
                    key={occ.type}
                    onClick={() => setOccasionType(occ.type)}
                    className={`p-2 rounded-xl border-2 border-black text-xs font-bold flex flex-col items-center gap-1 transition ${
                      isSelected
                        ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000] -translate-y-0.5'
                        : 'bg-white text-black/80 hover:bg-[#fff9db] shadow-[1px_1px_0px_#000000]'
                    }`}
                  >
                    <span className="text-xl">{occ.icon}</span>
                    <span className="truncate w-full text-center text-[11px] font-black">{occ.label}</span>
                  </button>
                );
              })}
            </div>

            {occasionType === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customOccasionTitle}
                  onChange={(e) => setCustomOccasionTitle(e.target.value)}
                  placeholder="Custom Occasion Title (e.g. Marathon Finish, Half-Birthday)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            )}
          </div>

          {/* Date & Milestone / Origin Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Occasion Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center justify-between">
                <span>Start / Birth Year</span>
                <span className="text-[10px] font-semibold text-black/50 normal-case">Optional for milestones</span>
              </label>
              <input
                type="number"
                min="1920"
                max="2035"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="e.g. 1996 for Turning 30"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="p-3.5 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
              Upload Person's Picture (Auto Frame & Stickers)
            </label>
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#ffea79] border-2 border-black flex-shrink-0 flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-black" />
                )}
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold text-black">
                  {photoUrl ? 'Photo uploaded! Ready for festive frames.' : 'Add a photo to style with party hats & frames'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#ffea79] border-2 border-black text-xs font-black text-black flex items-center gap-1.5 transition shadow-[2px_2px_0px_#000000]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {photoUrl ? 'Change Photo' : 'Select Photo File'}
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-2.5 py-1 text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phone for WhatsApp & SMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Recipient WhatsApp Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-black/60" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155550199 or 4155550199"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Email (optional backup)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-black/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>
          </div>

          {/* Notes & Personality */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              Gift Ideas & Personality Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-black/60" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Loves espresso, vinyl records, dog named Milo"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
              />
            </div>
          </div>

          {/* Repeat Yearly & Notification Alarms */}
          <div className="p-4 rounded-2xl bg-[#ffea79]/30 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-black">Annual Repeat</div>
                <div className="text-[11px] font-bold text-black/70">Auto-reschedules yearly so you never forget</div>
              </div>
              <input
                type="checkbox"
                checked={repeatYearly}
                onChange={(e) => setRepeatYearly(e.target.checked)}
                className="w-5 h-5 accent-black rounded cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t-2 border-black/20">
              <div className="text-xs font-black uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-black" />
                Alert Schedule Milestones:
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { days: 7, label: '7 Days Before (Gifts)' },
                  { days: 3, label: '3 Days Before' },
                  { days: 1, label: '1 Day Before' },
                  { days: 0, label: 'On The Day' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.days}
                    onClick={() => toggleReminderDay(item.days)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition ${
                      remindDaysBefore.includes(item.days)
                        ? 'bg-[#ffea79] text-black shadow-[2px_2px_0px_#000000]'
                        : 'bg-white text-black/70 hover:bg-[#ffea79]/40'
                    }`}
                  >
                    {remindDaysBefore.includes(item.days) ? '✓ ' : ''}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border-2 border-black hover:bg-zinc-100 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition"
            >
              {editingEvent ? 'Save Changes' : 'Start Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
