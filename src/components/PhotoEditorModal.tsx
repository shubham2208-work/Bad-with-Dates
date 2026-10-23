import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Download, 
  Share2, 
  RotateCw, 
  Trash2, 
  Palette, 
  Wand2, 
  Upload, 
  Check, 
  Smile, 
  Frame, 
  Type as TypeIcon,
  Layers,
  ZoomIn,
  RefreshCw
} from 'lucide-react';
import { OccasionEvent } from '../types/occasion';
import { getOccasionLabel } from '../utils/dateCalculations';
import confetti from 'canvas-confetti';

interface PhotoEditorModalProps {
  event: OccasionEvent;
  isOpen: boolean;
  onClose: () => void;
  onSaveEditedPhoto: (eventId: string, dataUrl: string) => void;
}

interface StickerItem {
  id: string;
  emoji: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // px
  rotation: number; // degrees
}

type FrameStyle = 'none' | 'birthday-confetti' | 'anniversary-gold' | 'polaroid' | 'cyber-party' | 'romantic-roses' | 'meme-alert';
type FilterStyle = 'none' | 'warm' | 'golden' | 'blush' | 'vintage' | 'vibrant' | 'dramatic';

const STICKER_PRESETS: { category: string; items: { emoji: string; label: string }[] }[] = [
  {
    category: 'Birthday & Party',
    items: [
      { emoji: '🥳', label: 'Party Face' },
      { emoji: '🎂', label: 'Birthday Cake' },
      { emoji: '👑', label: 'Gold Crown' },
      { emoji: '🎈', label: 'Balloons' },
      { emoji: '🎉', label: 'Confetti' },
      { emoji: '🧁', label: 'Cupcake' },
      { emoji: '🎁', label: 'Gift Box' },
      { emoji: '🍾', label: 'Champagne' },
    ],
  },
  {
    category: 'Love & Anniversary',
    items: [
      { emoji: '💍', label: 'Ring' },
      { emoji: '💖', label: 'Sparkle Heart' },
      { emoji: '🌹', label: 'Red Rose' },
      { emoji: '💐', label: 'Bouquet' },
      { emoji: '🥂', label: 'Toast Glasses' },
      { emoji: '✨', label: 'Starlight' },
      { emoji: '🕊️', label: 'Dove' },
      { emoji: '💋', label: 'Kiss' },
    ],
  },
  {
    category: 'Milestone & Fun',
    items: [
      { emoji: '🎓', label: 'Graduation Cap' },
      { emoji: '🚀', label: 'Rocket Level Up' },
      { emoji: '🏆', label: 'Trophy VIP' },
      { emoji: '🕶️', label: 'Cool Shades' },
      { emoji: '⭐', label: 'Gold Star' },
      { emoji: '📅', label: 'Calendar Pinned' },
      { emoji: '🐾', label: 'Paw Print' },
      { emoji: '🔥', label: 'Fire' },
    ],
  },
];

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  event,
  isOpen,
  onClose,
  onSaveEditedPhoto,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string>(event.editedPhotoUrl || event.photoUrl || '');
  const [frame, setFrame] = useState<FrameStyle>('polaroid');
  const [filter, setFilter] = useState<FilterStyle>('warm');
  const [headline, setHeadline] = useState<string>(`Happy ${getOccasionLabel(event)}!`);
  const [subtitle, setSubtitle] = useState<string>(`Celebrating ${event.name}`);
  const [badgeText, setBadgeText] = useState<string>('VIP CELEBRATION');
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'theme' | 'frame' | 'stickers' | 'text' | 'filter'>('theme');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Sync when event changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const initialImage = event.editedPhotoUrl || event.photoUrl || '';
      setImageSrc(initialImage);
      applyOccasionPreset(event.occasionType);
    }
  }, [isOpen, event]);

  const applyOccasionPreset = (type: OccasionEvent['occasionType']) => {
    switch (type) {
      case 'birthday':
        setFrame('birthday-confetti');
        setFilter('warm');
        setHeadline(`Happy Birthday ${event.name}! 🎂`);
        setSubtitle('May your year ahead be pure magic ✨');
        setBadgeText('BIRTHDAY LEGEND');
        setStickers([
          { id: '1', emoji: '👑', label: 'Crown', x: 50, y: 16, size: 54, rotation: -8 },
          { id: '2', emoji: '🎉', label: 'Party', x: 18, y: 22, size: 48, rotation: 15 },
          { id: '3', emoji: '🎂', label: 'Cake', x: 82, y: 76, size: 52, rotation: 5 },
        ]);
        break;
      case 'anniversary':
      case 'wedding':
        setFrame('anniversary-gold');
        setFilter('golden');
        setHeadline(`Happy Anniversary, ${event.name}! 🥂`);
        setSubtitle('Forever looks incredible on you both ❤️');
        setBadgeText('LOVE MILESTONE');
        setStickers([
          { id: '1', emoji: '💍', label: 'Ring', x: 50, y: 16, size: 48, rotation: 0 },
          { id: '2', emoji: '🌹', label: 'Rose', x: 18, y: 80, size: 46, rotation: -12 },
          { id: '3', emoji: '🥂', label: 'Toast', x: 82, y: 78, size: 50, rotation: 10 },
        ]);
        break;
      case 'promotion':
        setFrame('cyber-party');
        setFilter('vibrant');
        setHeadline(`Huge Congrats ${event.name}! 🚀`);
        setSubtitle('Hard work pays off. Next level unlocked!');
        setBadgeText('PROMOTED & PROUD');
        setStickers([
          { id: '1', emoji: '🚀', label: 'Rocket', x: 20, y: 20, size: 52, rotation: 15 },
          { id: '2', emoji: '🏆', label: 'Trophy', x: 80, y: 22, size: 50, rotation: -10 },
          { id: '3', emoji: '⭐', label: 'Star', x: 50, y: 82, size: 44, rotation: 0 },
        ]);
        break;
      case 'graduation':
        setFrame('polaroid');
        setFilter('golden');
        setHeadline(`You Did It, Graduate! 🎓`);
        setSubtitle(`So proud of you, ${event.name}!`);
        setBadgeText('OFFICIALLY GRADUATED');
        setStickers([
          { id: '1', emoji: '🎓', label: 'Grad Cap', x: 50, y: 15, size: 58, rotation: -5 },
          { id: '2', emoji: '✨', label: 'Sparkles', x: 80, y: 24, size: 44, rotation: 12 },
        ]);
        break;
      default:
        setFrame('polaroid');
        setFilter('warm');
        setHeadline(`Cheers to ${event.name}! 🎉`);
        setSubtitle(`Celebrating your ${getOccasionLabel(event)}`);
        setBadgeText('BAD WITH DATES VIP');
        setStickers([
          { id: '1', emoji: '🥳', label: 'Celebration', x: 20, y: 20, size: 48, rotation: 0 },
          { id: '2', emoji: '✨', label: 'Magic', x: 80, y: 20, size: 48, rotation: 0 },
        ]);
    }
  };

  // Re-draw canvas whenever properties change
  useEffect(() => {
    renderCanvas();
  }, [imageSrc, frame, filter, headline, subtitle, badgeText, stickers, selectedStickerId]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 960;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // If frame is polaroid, draw white polaroid card backing
    if (frame === 'polaroid') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(24, 24, width - 48, height - 48);
      // Photo area inside polaroid
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(52, 52, width - 104, 680);
    } else if (frame === 'anniversary-gold') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#292524');
      grad.addColorStop(1, '#1c1917');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (frame === 'birthday-confetti') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#431407');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (frame === 'meme-alert') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Image if present
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      img.onload = () => {
        drawImageAndDecorations(ctx, img, width, height);
      };
    } else {
      // Draw placeholder avatar with initials
      drawAvatarPlaceholder(ctx, width, height);
      drawDecorations(ctx, width, height);
    }
  };

  const drawImageAndDecorations = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    ctx.save();

    let targetX = 40;
    let targetY = 40;
    let targetW = width - 80;
    let targetH = 680;

    if (frame === 'polaroid') {
      targetX = 52;
      targetY = 52;
      targetW = width - 104;
      targetH = 680;
    }

    // Apply Filter
    applyCanvasFilter(ctx, filter);

    // Calculate crop & aspect ratio
    const imgAspect = img.width / img.height;
    const targetAspect = targetW / targetH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = (img.height - sh) / 2;
    }

    // Draw rounded clipping path for modern look
    if (frame !== 'polaroid') {
      ctx.beginPath();
      ctx.roundRect(targetX, targetY, targetW, targetH, 24);
      ctx.clip();
    }

    ctx.drawImage(img, sx, sy, sw, sh, targetX, targetY, targetW, targetH);
    ctx.restore();

    drawDecorations(ctx, width, height);
  };

  const drawAvatarPlaceholder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cx = width / 2;
    const cy = 360;
    const radius = 180;

    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, radius);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = event.name.slice(0, 2).toUpperCase() || 'BD';
    ctx.fillText(initials, cx, cy);

    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Tap "Upload Photo" to customize with real photo', cx, cy + 220);
  };

  const applyCanvasFilter = (ctx: CanvasRenderingContext2D, filterType: FilterStyle) => {
    switch (filterType) {
      case 'warm':
        ctx.filter = 'sepia(0.25) saturate(1.25) brightness(1.05)';
        break;
      case 'golden':
        ctx.filter = 'sepia(0.35) contrast(1.1) brightness(1.08)';
        break;
      case 'blush':
        ctx.filter = 'hue-rotate(-15deg) saturate(1.2) brightness(1.04)';
        break;
      case 'vintage':
        ctx.filter = 'sepia(0.5) contrast(1.15) brightness(0.95)';
        break;
      case 'vibrant':
        ctx.filter = 'saturate(1.4) contrast(1.1)';
        break;
      case 'dramatic':
        ctx.filter = 'grayscale(1) contrast(1.3) brightness(1.02)';
        break;
      default:
        ctx.filter = 'none';
    }
  };

  const drawDecorations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Reset filters for overlay drawing
    ctx.filter = 'none';

    // 1. Frame specific accents
    if (frame === 'anniversary-gold') {
      // Golden luxury border with corner flourishes
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.strokeRect(42, 42, width - 84, height - 84);

      // Corner gold diamonds
      drawGoldDiamond(ctx, 42, 42);
      drawGoldDiamond(ctx, width - 42, 42);
      drawGoldDiamond(ctx, 42, height - 42);
      drawGoldDiamond(ctx, width - 42, height - 42);
    } else if (frame === 'birthday-confetti') {
      // Fun party confetti border
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 8;
      ctx.strokeRect(28, 28, width - 56, height - 56);
      drawSprinkles(ctx, width, height);
    } else if (frame === 'cyber-party') {
      // Neon futuristic glow border
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 8;
      ctx.strokeRect(30, 30, width - 60, height - 60);
      ctx.shadowBlur = 0;
    } else if (frame === 'meme-alert') {
      // Funny roast caution border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, width - 40, height - 40);
    }

    // 2. Draw Top Badge
    if (badgeText) {
      drawPillBadge(ctx, width / 2, 60, badgeText);
    }

    // 3. Draw Bottom Text Area
    const textBaseY = frame === 'polaroid' ? 760 : 750;

    if (frame === 'polaroid') {
      // Handwritten polaroid look
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 42px "Caveat", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(headline, width / 2, textBaseY + 45);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(subtitle, width / 2, textBaseY + 95);

      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('✨ Remembered on time with Bad with Dates ✨', width / 2, textBaseY + 130);
    } else {
      // Bold vibrant card look with dark badge backdrop
      const cardBgY = 720;
      const cardBgH = height - cardBgY - 40;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(40, cardBgY, width - 80, cardBgH, 20);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(headline, width / 2, cardBgY + 65);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(subtitle, width / 2, cardBgY + 115);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('⚡ BAD WITH DATES • ON-TIME GUARANTEED ⚡', width / 2, cardBgY + 155);
    }

    // 4. Draw Stickers (Emojis)
    stickers.forEach((sticker) => {
      const sx = (sticker.x / 100) * width;
      const sy = (sticker.y / 100) * height;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((sticker.rotation * Math.PI) / 180);

      // Sticker drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      // Draw emoji
      ctx.font = `${sticker.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.emoji, 0, 0);

      // Highlight selected sticker
      if (sticker.id === selectedStickerId) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, sticker.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  const drawPillBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
    ctx.save();
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const padX = 22;
    const padY = 10;
    const bw = textWidth + padX * 2;
    const bh = 34;

    // Badge background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = frame === 'anniversary-gold' ? '#f59e0b' : '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2);
    ctx.fill();

    // Badge text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawGoldDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 10, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawSprinkles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const dots = [
      { x: 38, y: 70, c: '#f43f5e' },
      { x: 70, y: 40, c: '#3b82f6' },
      { x: width - 50, y: 80, c: '#eab308' },
      { x: width - 80, y: 45, c: '#10b981' },
      { x: 45, y: height - 80, c: '#8b5cf6' },
      { x: width - 60, y: height - 90, c: '#ec4899' },
    ];
    dots.forEach((d) => {
      ctx.fillStyle = d.c;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Upload Photo Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Sticker to Canvas
  const addSticker = (emoji: string, label: string) => {
    const newSticker: StickerItem = {
      id: String(Date.now()),
      emoji,
      label,
      x: 35 + Math.random() * 30,
      y: 35 + Math.random() * 30,
      size: 50,
      rotation: Math.floor(Math.random() * 30) - 15,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  // Rotate / Resize / Delete Selected Sticker
  const rotateSelectedSticker = () => {
    if (!selectedStickerId) return;
    setStickers((prev) =>
      prev.map((s) => (s.id === selectedStickerId ? { ...s, rotation: (s.rotation + 15) % 360 } : s))
    );
  };

  const resizeSelectedSticker = (delta: number) => {
    if (!selectedStickerId) return;
    setStickers((prev) =>
      prev.map((s) => (s.id === selectedStickerId ? { ...s, size: Math.max(24, Math.min(120, s.size + delta)) } : s))
    );
  };

  const deleteSelectedSticker = () => {
    if (!selectedStickerId) return;
    setStickers((prev) => prev.filter((s) => s.id !== selectedStickerId));
    setSelectedStickerId(null);
  };

  // AI Occasion Auto-Stylist powered by Gemini
  const handleAiAutoStyle = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/suggest-decorations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: event.name,
          occasion: getOccasionLabel(event),
          relationship: event.relationship,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cardHeadline) setHeadline(data.cardHeadline);
        if (data.cardSubtitle) setSubtitle(data.cardSubtitle);
        if (data.badgeText) setBadgeText(data.badgeText);
        if (data.filterSuggestion) setFilter(data.filterSuggestion);

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error('Failed to get AI styling:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save to Person Profile
  const handleSaveToProfile = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    onSaveEditedPhoto(event.id, dataUrl);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClose();
  };

  // Download Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    const dataUrl = canvas.toDataURL('image/png', 0.98);
    const link = document.createElement('a');
    link.download = `bad-with-dates-${event.name.toLowerCase().replace(/\s+/g, '-')}-${event.occasionType}.png`;
    link.href = dataUrl;
    link.click();
    setIsExporting(false);
  };

  // Native Web Share or WhatsApp direct
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share && navigator.canShare) {
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `${event.name}-celebration.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${event.name}'s Celebration Card`,
              text: `${headline} — created on Bad with Dates!`,
              files: [file],
            });
            return;
          }
        });
      } catch (err) {
        console.warn('Web Share canceled or failed:', err);
      }
    }

    // Fallback: copy dataUrl & download
    handleDownloadImage();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#fefbf3] border-[2.5px] border-black rounded-3xl shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[2.5px] border-black bg-[#ffea79]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000000]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                Occasion Photo Studio
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white border border-black font-black text-black">
                  {getOccasionLabel(event)} for {event.name}
                </span>
              </h2>
              <p className="text-[11px] font-bold text-black/70">
                Custom party frames, celebration stickers & WhatsApp greeting overlays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAiAutoStyle}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              {isAiLoading ? 'Styling...' : 'AI Auto-Style'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black transition shadow-[2px_2px_0px_#000000]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Content: Left Canvas, Right Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Canvas Preview Area */}
          <div className="lg:col-span-7 bg-[#fffdfa] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r-[2.5px] border-black overflow-y-auto">
            <div className="relative group max-w-[360px] sm:max-w-[400px] w-full rounded-2xl shadow-[4px_4px_0px_#000000] overflow-hidden border-[2.5px] border-black bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-auto block select-none cursor-pointer"
                onClick={() => setSelectedStickerId(null)}
              />

              {/* Floating quick actions */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload / Change Photo"
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#ffea79] text-black border-2 border-black font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Change Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Sticker manipulation bar if a sticker is selected */}
            {selectedStickerId && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded-2xl bg-[#ffea79] border-2 border-black text-xs font-black text-black shadow-[2px_2px_0px_#000000]">
                <span className="px-1 text-[11px] uppercase">Selected Sticker:</span>
                <button
                  onClick={rotateSelectedSticker}
                  className="p-1 rounded-lg bg-white border border-black hover:bg-zinc-100 flex items-center gap-1"
                  title="Rotate 15°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => resizeSelectedSticker(8)}
                  className="px-2 py-0.5 rounded-lg bg-white border border-black hover:bg-zinc-100 font-black"
                  title="Increase Size"
                >
                  +
                </button>
                <button
                  onClick={() => resizeSelectedSticker(-8)}
                  className="px-2 py-0.5 rounded-lg bg-white border border-black hover:bg-zinc-100 font-black"
                  title="Decrease Size"
                >
                  -
                </button>
                <button
                  onClick={deleteSelectedSticker}
                  className="p-1 rounded-lg bg-red-100 border border-black text-red-600 hover:bg-red-200"
                  title="Delete Sticker"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="lg:col-span-5 flex flex-col bg-[#fefbf3] overflow-y-auto max-h-[500px] lg:max-h-full">
            {/* Tool Tabs */}
            <div className="flex border-b-2 border-black px-4 pt-3 gap-1.5 overflow-x-auto bg-[#ffea79]/20">
              <button
                onClick={() => setActiveTab('theme')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 border-2 border-b-0 border-black ${
                  activeTab === 'theme'
                    ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                    : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Theme
              </button>
              <button
                onClick={() => setActiveTab('frame')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 border-2 border-b-0 border-black ${
                  activeTab === 'frame'
                    ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                    : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
                }`}
              >
                <Frame className="w-3.5 h-3.5" />
                Frames
              </button>
              <button
                onClick={() => setActiveTab('stickers')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 border-2 border-b-0 border-black ${
                  activeTab === 'stickers'
                    ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                    : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                Stickers
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 border-2 border-b-0 border-black ${
                  activeTab === 'text'
                    ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                    : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
                }`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                Text
              </button>
              <button
                onClick={() => setActiveTab('filter')}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 border-2 border-b-0 border-black ${
                  activeTab === 'filter'
                    ? 'bg-[#ffea79] text-black shadow-[1px_-1px_0px_#000000]'
                    : 'bg-white/80 text-black/60 hover:text-black hover:bg-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-5 flex-1 space-y-4 overflow-y-auto">
              {/* THEME PRESETS */}
              {activeTab === 'theme' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-black/70">
                    Instant occasion presets for <strong className="text-black">{event.name}</strong>:
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => applyOccasionPreset('birthday')}
                      className={`p-3 rounded-2xl border-2 border-black text-left transition flex flex-col gap-1 ${
                        event.occasionType === 'birthday'
                          ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                      }`}
                    >
                      <span className="text-xl">🎂</span>
                      <span className="text-xs font-black uppercase">Birthday Fiesta</span>
                      <span className="text-[10px] font-semibold text-black/60">Confetti, crown & candle</span>
                    </button>

                    <button
                      onClick={() => applyOccasionPreset('anniversary')}
                      className={`p-3 rounded-2xl border-2 border-black text-left transition flex flex-col gap-1 ${
                        event.occasionType === 'anniversary'
                          ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                      }`}
                    >
                      <span className="text-xl">💍</span>
                      <span className="text-xs font-black uppercase">Anniversary Gold</span>
                      <span className="text-[10px] font-semibold text-black/60">Golden trim & roses</span>
                    </button>

                    <button
                      onClick={() => applyOccasionPreset('promotion')}
                      className={`p-3 rounded-2xl border-2 border-black text-left transition flex flex-col gap-1 ${
                        event.occasionType === 'promotion'
                          ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                      }`}
                    >
                      <span className="text-xl">🚀</span>
                      <span className="text-xs font-black uppercase">Career Level-Up</span>
                      <span className="text-[10px] font-semibold text-black/60">Trophy & star banner</span>
                    </button>

                    <button
                      onClick={() => applyOccasionPreset('graduation')}
                      className="p-3 rounded-2xl border-2 border-black bg-white hover:bg-zinc-100 text-black text-left transition flex flex-col gap-1 shadow-[1px_1px_0px_#000000]"
                    >
                      <span className="text-xl">🎓</span>
                      <span className="text-xs font-black uppercase">Graduation Laurel</span>
                      <span className="text-[10px] font-semibold text-black/60">Cap & diploma seal</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                      Change Photo Source
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-black bg-white hover:bg-[#ffea79]/30 text-black text-xs font-black uppercase flex items-center justify-center gap-2 transition"
                    >
                      <Upload className="w-4 h-4" />
                      {imageSrc ? 'Replace Current Photo' : 'Upload Person Photo'}
                    </button>
                  </div>
                </div>
              )}

              {/* FRAMES */}
              {activeTab === 'frame' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-black/70">Select festive frame layout:</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'polaroid', label: 'Classic Polaroid', desc: 'Handwritten card style' },
                      { id: 'birthday-confetti', label: 'Confetti Border', desc: 'Sprinkles & party dots' },
                      { id: 'anniversary-gold', label: 'Gold Elegance', desc: 'Double gold luxury rim' },
                      { id: 'cyber-party', label: 'Bold Neo Border', desc: 'Vibrant party lines' },
                      { id: 'meme-alert', label: 'Milestone Alert', desc: '"I actually remembered!"' },
                      { id: 'none', label: 'Clean Borderless', desc: 'Pure photo focus' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFrame(f.id as FrameStyle)}
                        className={`p-3 rounded-2xl border-2 border-black text-left transition flex flex-col gap-1 ${
                          frame === f.id
                            ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                            : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                        }`}
                      >
                        <span className="text-xs font-black uppercase">{f.label}</span>
                        <span className="text-[10px] font-semibold text-black/60">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STICKERS */}
              {activeTab === 'stickers' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-black/70">Tap sticker to place on photo:</span>
                    {stickers.length > 0 && (
                      <button
                        onClick={() => setStickers([])}
                        className="text-[11px] text-red-600 font-black hover:underline"
                      >
                        Clear All ({stickers.length})
                      </button>
                    )}
                  </div>

                  {STICKER_PRESETS.map((group) => (
                    <div key={group.category} className="space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black/70">
                        {group.category}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {group.items.map((item) => (
                          <button
                            key={item.emoji}
                            onClick={() => addSticker(item.emoji, item.label)}
                            className="p-2 rounded-xl bg-white hover:bg-[#ffea79] border-2 border-black flex flex-col items-center justify-center gap-1 transition shadow-[1px_1px_0px_#000000] group"
                          >
                            <span className="text-xl group-hover:scale-125 transition-transform">
                              {item.emoji}
                            </span>
                            <span className="text-[9px] font-bold text-black truncate w-full text-center">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TEXT OVERLAYS */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      Headline Banner
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      Subtitle / Dedication
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                      Top Celebration Badge
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. BIRTHDAY QUEEN or 10TH ANNIVERSARY"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-bold text-xs focus:ring-2 focus:ring-[#ffea79] focus:outline-none shadow-[2px_2px_0px_#000000]"
                    />
                  </div>
                </div>
              )}

              {/* FILTERS */}
              {activeTab === 'filter' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-black/70">Photo color atmosphere:</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'warm', label: 'Warm Glow', emoji: '☀️' },
                      { id: 'golden', label: 'Golden Hour', emoji: '✨' },
                      { id: 'blush', label: 'Romantic Blush', emoji: '🌸' },
                      { id: 'vibrant', label: 'Fiesta Pop', emoji: '🎉' },
                      { id: 'vintage', label: 'Retro 90s', emoji: '📼' },
                      { id: 'dramatic', label: 'B&W Glamour', emoji: '🖤' },
                      { id: 'none', label: 'Original', emoji: '🌿' },
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        onClick={() => setFilter(flt.id as FilterStyle)}
                        className={`p-2.5 rounded-2xl border-2 border-black text-left transition flex items-center gap-2 ${
                          filter === flt.id
                            ? 'bg-[#ffea79] text-black shadow-[3px_3px_0px_#000000]'
                            : 'bg-white text-black hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]'
                        }`}
                      >
                        <span className="text-lg">{flt.emoji}</span>
                        <span className="text-xs font-black uppercase">{flt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t-2 border-black bg-white flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToProfile}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#ffea79] hover:bg-[#ffe34d] border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save to {event.name}'s Profile
                </button>

                <button
                  onClick={handleDownloadImage}
                  disabled={isExporting}
                  className="p-2.5 rounded-xl bg-white hover:bg-zinc-100 text-black border-2 border-black shadow-[2px_2px_0px_#000000] transition"
                  title="Download High-Res Card PNG"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl bg-white hover:bg-[#ffea79] text-black border-2 border-black shadow-[2px_2px_0px_#000000] transition"
                  title="Share directly via WhatsApp / Native Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[10px] text-center font-bold text-black/60">
                Decorated card is automatically attached when sending WhatsApp wishes!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
