'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Music, 
  Sparkles, 
  MapPin, 
  Users, 
  ArrowRight, 
  Search, 
  Star, 
  Flame, 
  Building2, 
  Mic2, 
  Headphones, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Radio,
  Volume2,
  Compass,
  X,
  Info,
  ShieldCheck,
  CalendarCheck,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import api from '@/lib/api';

const POPULAR_CITIES = [
  'All Cities',
  'Mumbai',
  'Bangalore',
  'New Delhi',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Ahmedabad'
];

const GENRES = [
  { id: 'all', label: 'All Vibes', icon: Radio },
  { id: 'acoustic', label: 'Acoustic & Indie', icon: Mic2 },
  { id: 'electronic', label: 'DJ & Electronic', icon: Headphones },
  { id: 'jazz', label: 'Jazz & Soul', icon: Volume2 },
  { id: 'rock', label: 'Rock & Bands', icon: Flame },
  { id: 'comedy', label: 'Standup Comedy', icon: Sparkles },
];

const CURATED_DEMO_EVENTS = [
  {
    _id: 'demo-1',
    title: 'Neon Sunset Acoustic Sessions',
    genre: 'Acoustic & Indie',
    description: 'An intimate, soul-stirring sunset acoustic showcase featuring harmonic guitar fingerpicking, ambient loops, and original indie storytelling on the rooftop terrace.',
    restaurant: {
      restaurantName: 'Skyline Terrace Lounge',
      location: 'Indiranagar, Bangalore',
      address: '100ft Road, 4th Floor Rooftop, Indiranagar',
      vibe: 'Open-air panoramic rooftop with artisan beverages'
    },
    performer: {
      displayName: 'Aarav & The Waves',
      category: 'Indie Folk / Acoustic Duo',
      bio: 'Award-winning Bangalore duo known for emotive vocals, acoustic fingerpicking, and soulful indie melodies.',
      profilePicture: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    atmosphere: 'Intimate Unplugged Session',
    isTonight: true,
  },
  {
    _id: 'demo-2',
    title: 'Midnight Groove & House Vinyl',
    genre: 'DJ & Electronic',
    description: 'Underground deep house and melodic techno set mixed exclusively on pure analog vinyl records for electronic music aficionados.',
    restaurant: {
      restaurantName: 'Subterra Speakeasy & Club',
      location: 'Bandra West, Mumbai',
      address: 'Pali Hill Basement 2, Bandra West',
      vibe: 'Atmospheric subterranean dance floor & listening room'
    },
    performer: {
      displayName: 'DJ Kyra Nova',
      category: 'Deep House & Melodic Techno',
      bio: 'Berlin-trained producer and selector spinning hypnotic basslines and ethereal grooves across premier clubs.',
      profilePicture: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    atmosphere: 'Late Night Club Set',
    isTonight: true,
  },
  {
    _id: 'demo-3',
    title: 'Candlelight Jazz & Craft Cocktails',
    genre: 'Jazz & Soul',
    description: 'A cozy candlelit evening featuring smooth upright bass, silky jazz piano, and contemporary neo-soul renditions paired with artisan cocktails.',
    restaurant: {
      restaurantName: 'The Brass Peacock Room',
      location: 'Connaught Place, New Delhi',
      address: 'Inner Circle Block C, Connaught Place',
      vibe: 'Speakeasy cocktail parlor with velvet booths'
    },
    performer: {
      displayName: 'Maya Chen Trio',
      category: 'Neo-Soul & Contemporary Jazz',
      bio: 'Classically trained trio blending classic Blue Note jazz standards with modern neo-soul textures.',
      profilePicture: 'https://images.unsplash.com/photo-1525994886773-080587e161c2?auto=format&fit=crop&w=800&q=80',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    atmosphere: 'Candlelit Dinner Jazz',
    isTonight: false,
  },
  {
    _id: 'demo-4',
    title: 'Electric Euphoria: Live Indie Rock',
    genre: 'Rock & Bands',
    description: 'High-octane live alternative rock set packed with driving drums, dual electric guitars, and anthemic choruses.',
    restaurant: {
      restaurantName: 'The Foundry Warehouse',
      location: 'Koregaon Park, Pune',
      address: 'Lane 7 Industrial Arcade, Koregaon Park',
      vibe: 'Industrial craft microbrewery & live stage'
    },
    performer: {
      displayName: 'The Velvet Horizon',
      category: 'Alternative Rock 4-Piece',
      bio: 'Explosive indie rock band featuring powerhouse vocals, crunchy riffs, and stadium-worthy hooks.',
      profilePicture: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 32).toISOString(),
    atmosphere: 'High-Energy Band Night',
    isTonight: false,
  },
  {
    _id: 'demo-5',
    title: 'Punchline Dinner: Unfiltered Comedy',
    genre: 'Standup Comedy',
    description: 'An evening of live stand-up comedy featuring fresh observations on modern dating, workplace culture, and daily life.',
    restaurant: {
      restaurantName: 'The Social Comedy Cellar',
      location: 'Jubilee Hills, Hyderabad',
      address: 'Road No. 36, Jubilee Hills',
      vibe: 'Dinner theater layout with craft kitchen'
    },
    performer: {
      displayName: 'Karan Mehra Live',
      category: 'Stand-up Comedian',
      bio: 'Stand-up comedian with over 20M online views known for sharp observational wit and crowd work.',
      profilePicture: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    atmosphere: 'Dinner & Comedy Special',
    isTonight: false,
  },
  {
    _id: 'demo-6',
    title: 'Golden Hour Rhythms & Tapas',
    genre: 'Acoustic & Indie',
    description: 'Relaxed sunset acoustic guitar session featuring Mediterranean melodies, bossa nova rhythms, and Spanish guitar classics.',
    restaurant: {
      restaurantName: 'Sol & Luna Rooftop',
      location: 'Anjuna, Goa',
      address: 'Cliff Road South, Anjuna Beach',
      vibe: 'Coastal sunset deck overlooking the Arabian Sea'
    },
    performer: {
      displayName: 'Elena & The Strings',
      category: 'Spanish Guitar & Vocals',
      bio: 'International guitarist and vocalist blending Latin guitar, bossa nova, and Mediterranean acoustic grooves.',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 52).toISOString(),
    atmosphere: 'Sunset Coastal Session',
    isTonight: false,
  }
];

const FAQS = [
  {
    question: 'What is StageLink?',
    answer: 'StageLink is the premier live music and entertainment marketplace connecting indie performers, hospitality venues, and audiences. We make it seamless for artists to find paid gigs, for restaurants to curate live talent, and for music lovers to discover tonight’s shows.'
  },
  {
    question: 'How do performers use the platform?',
    answer: 'Artists create an Electronic Press Kit (EPK) with their audio samples, genre tags, and technical requirements. They can browse open gigs posted by verified venues, submit quotes, receive booking offers, and build a verified performance history.'
  },
  {
    question: 'How do restaurants and lounges benefit?',
    answer: 'Venues can schedule live entertainment with ease, review verified artist auditions, eliminate empty weeknights, and provide patrons with interactive digital stage schedules.'
  },
  {
    question: 'Is StageLink free to explore?',
    answer: 'Yes! Anyone can explore live performance schedules, discover new artists, and learn about local venues completely free.'
  },
  {
    question: 'Where do reservations and bookings happen?',
    answer: 'Bookings and gig agreements happen securely inside the StageLink member dashboards. Registered performers manage their gigs, venues manage artist schedules, and registered patrons manage their event table reservations.'
  }
];

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [activeRoleTab, setActiveRoleTab] = useState<'performer' | 'restaurant' | 'audience'>('performer');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Purely informational detail modal for viewing event/artist/venue background
  const [selectedEventInfo, setSelectedEventInfo] = useState<any | null>(null);
  const [activeInfoModal, setActiveInfoModal] = useState<'performer' | 'restaurant' | 'audience' | 'platform' | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch upcoming showcase events with fallback
  useEffect(() => {
    if (!isMounted) return;

    const fetchLiveGigs = async () => {
      setLoadingEvents(true);
      try {
        const cityParam = selectedCity && selectedCity !== 'All Cities' ? `&city=${encodeURIComponent(selectedCity)}` : '';
        const res = await api.get(`/events?status=upcoming${cityParam}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setLiveEvents(res.data);
        } else {
          setLiveEvents(CURATED_DEMO_EVENTS);
        }
      } catch (err) {
        setLiveEvents(CURATED_DEMO_EVENTS);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchLiveGigs();
  }, [isMounted, selectedCity]);

  // Filter events based on genre & search
  const filteredEvents = useMemo(() => {
    return liveEvents.filter((item) => {
      const matchesSearch = searchQuery === '' || 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.performer?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.restaurant?.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre = selectedGenre === 'all' || 
        item.genre?.toLowerCase().includes(selectedGenre) ||
        (selectedGenre === 'acoustic' && (item.genre?.toLowerCase().includes('acoustic') || item.genre?.toLowerCase().includes('indie'))) ||
        (selectedGenre === 'electronic' && (item.genre?.toLowerCase().includes('dj') || item.genre?.toLowerCase().includes('techno') || item.genre?.toLowerCase().includes('electronic'))) ||
        (selectedGenre === 'jazz' && (item.genre?.toLowerCase().includes('jazz') || item.genre?.toLowerCase().includes('soul'))) ||
        (selectedGenre === 'rock' && (item.genre?.toLowerCase().includes('rock') || item.genre?.toLowerCase().includes('band'))) ||
        (selectedGenre === 'comedy' && item.genre?.toLowerCase().includes('comedy'));

      return matchesSearch && matchesGenre;
    });
  }, [liveEvents, searchQuery, selectedGenre]);

  const scrollToSection = (sectionId: string) => {
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToSection('live-shows-section');
  };

  const getDashboardHref = () => {
    if (!user) return '/events';
    if (user.role === 'restaurant') return '/dashboard/restaurant';
    if (user.role === 'performer') return '/dashboard/performer';
    if (user.role === 'customer') return '/dashboard/audience';
    if (user.role === 'admin') return '/dashboard/admin';
    return '/dashboard/audience';
  };

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Ambient Lighting & Stage Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-48 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed top-2/3 -right-48 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse-slow" />

      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-24">
        
        {/* Logged-In User Quick Portal Info */}
        {isAuthenticated && user && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-zinc-900/80 to-purple-950/60 border border-indigo-500/30 backdrop-blur-xl shadow-lg shadow-indigo-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm text-zinc-400">Welcome back,</p>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  {user.name}
                  <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {user.role}
                  </span>
                </h2>
              </div>
            </div>
            <Link href={getDashboardHref()}>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/20 px-5 py-2.5 flex items-center gap-2 text-sm font-semibold transition-all hover:translate-x-0.5 cursor-pointer">
                Go to {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''} Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative text-center pt-6 pb-16 sm:pt-12 sm:pb-24">
          
          {/* Live indicator badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-700/60 backdrop-blur-md text-xs sm:text-sm text-zinc-300 mb-8 shadow-inner hover:border-indigo-500/50 transition-colors">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-zinc-200">
              Live Entertainment Platform
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-indigo-400 font-medium">
              {selectedCity || 'All Cities'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6 leading-[1.08]">
            Where Live Music <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 drop-shadow-sm">
              Ignites Every Stage.
            </span>
          </h1>

          {/* Informational Subtitle */}
          <p className="text-base sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal px-2">
            StageLink connects extraordinary indie performers, iconic hospitality venues, and passionate fans. Discover how our live entertainment ecosystem works.
          </p>

          {/* Showcase Discovery Search Bar */}
          <div className="max-w-4xl mx-auto mb-10 px-2">
            <form 
              onSubmit={handleSearchSubmit}
              className="p-2 sm:p-3 rounded-2xl sm:rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 flex flex-col sm:flex-row items-center gap-2 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-3 px-4 w-full sm:flex-1">
                <Search className="w-5 h-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Explore artist, genre, or vibe (e.g. Jazz, Indie, Acoustic)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none py-2"
                />
              </div>

              <div className="w-full sm:w-auto flex items-center border-t sm:border-t-0 sm:border-l border-zinc-800 px-3 py-1 sm:py-0">
                <MapPin className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <select
                  value={selectedCity || 'All Cities'}
                  onChange={(e) => setSelectedCity(e.target.value === 'All Cities' ? '' : e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-zinc-300 focus:outline-none cursor-pointer pr-4 py-2"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900 text-zinc-200">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto rounded-xl sm:rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-7 py-3 text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Filter Showcase</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick Genre Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {GENRES.map((g) => {
                const Icon = g.icon;
                const active = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGenre(g.id);
                      scrollToSection('live-shows-section');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                        : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* In-Page Informational Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button 
              size="lg" 
              onClick={() => scrollToSection('live-shows-section')}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full px-8 py-6 text-base sm:text-lg font-bold shadow-[0_0_40px_-8px_rgba(99,102,241,0.6)] hover:shadow-[0_0_50px_-5px_rgba(99,102,241,0.8)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Compass className="w-5 h-5 text-indigo-200" />
              View Featured Shows & Artists
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => scrollToSection('ecosystem-section')}
              className="w-full sm:w-auto rounded-full px-8 py-6 text-base sm:text-lg font-semibold border-zinc-700/80 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/80 hover:text-white hover:border-zinc-600 transition-all backdrop-blur-md cursor-pointer"
            >
              How the Network Works
            </Button>
          </div>
        </section>

        {/* Live Soundwave & Network Stats */}
        <section className="my-8 rounded-3xl bg-zinc-900/70 border border-zinc-800/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
              <div className="flex items-end gap-1.5 h-9 px-3 py-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
                {[0.4, 0.9, 0.5, 0.8, 0.3, 1.0, 0.6, 0.7, 0.9, 0.4, 0.8, 0.5, 0.9, 0.3].map((heightRatio, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-indigo-500 via-fuchsia-500 to-cyan-400 rounded-full animate-soundwave"
                    style={{
                      animationDelay: `${(i % 5) * 0.2}s`,
                      height: `${Math.round(heightRatio * 24) + 4}px`
                    }}
                  />
                ))}
              </div>
              <div className="text-left">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Network Pulse
                </span>
                <p className="text-sm font-semibold text-white">Live Entertainment Ecosystem</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 w-full lg:w-auto text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">500+</p>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">Verified Artists</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">120+</p>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">Partner Venues</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">25K+</p>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">Monthly Attendees</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight flex items-center justify-center gap-1">
                  <span>4.9</span>
                  <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">Average Stage Rating</p>
              </div>
            </div>

          </div>
        </section>

        {/* Featured Shows & Artist Spotlight Section */}
        <section id="live-shows-section" className="my-16 sm:my-24 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
                <Flame className="w-4 h-4 text-amber-400" /> Featured Stage Spotlights
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Curated Performances & Venues
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 mt-1">
                Explore the variety of live acts and premier venues active across {selectedCity || 'the network'}. Click any card for detailed artist & venue background.
              </p>
            </div>

            <button 
              onClick={() => {
                setSelectedGenre('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group cursor-pointer"
            >
              <span>View all showcases ({liveEvents.length})</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Event Cards Grid */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/30 border border-zinc-800/50">
              <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No showcases match your current filter</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-4">
                Try selecting another city or vibe to see more performer spotlights.
              </p>
              <Button 
                variant="outline"
                onClick={() => { setSelectedGenre('all'); setSearchQuery(''); setSelectedCity(''); }}
                className="rounded-full border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const eventDate = new Date(event.date);
                const isToday = new Date().toDateString() === eventDate.toDateString() || event.isTonight;
                const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEventInfo(event)}
                    className="group rounded-3xl bg-zinc-900/80 border border-zinc-800/80 hover:border-indigo-500/50 backdrop-blur-xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-950/50 cursor-pointer"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 bg-zinc-950">
                        {event.performer?.profilePicture ? (
                          <img
                            src={event.performer.profilePicture}
                            alt={event.performer?.displayName || event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-zinc-900 to-purple-950 flex items-center justify-center">
                            <Music className="w-12 h-12 text-indigo-400/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />

                        {/* Timing Tag */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1.5 ${
                            isToday 
                              ? 'bg-amber-500/90 text-zinc-950 shadow-md shadow-amber-500/30' 
                              : 'bg-zinc-900/80 text-zinc-200 border border-white/10'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {isToday ? `Live Tonight • ${formattedTime}` : `${formattedDate} • ${formattedTime}`}
                          </span>
                        </div>

                        {/* Genre Tag */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-900/80 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                            {event.genre || 'Live Music'}
                          </span>
                        </div>
                      </div>

                      {/* Performer & Title */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2">
                          <Mic2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                            {event.performer?.displayName || 'Featured Artist'}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                      </div>

                      {/* Venue & Location */}
                      <div className="space-y-1 text-xs text-zinc-400 mb-5">
                        <div className="flex items-center gap-2 text-zinc-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="line-clamp-1">{event.restaurant?.restaurantName || 'Exclusive Venue'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="line-clamp-1">{event.restaurant?.location || 'City Center'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info Badge */}
                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="text-xs text-zinc-400">
                        <span className="font-semibold text-zinc-300">{event.atmosphere || 'Live Performance'}</span>
                      </div>

                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                        <span>Showcase Details</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Built for Every Stage - Ecosystem Breakdown */}
        <section id="ecosystem-section" className="my-16 sm:my-28 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
              The StageLink Ecosystem
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Built for Every Stage of the Experience
            </h2>
            <p className="text-zinc-400 mt-3 text-base sm:text-lg">
              Explore how StageLink provides dedicated tools for performers, venues, and live entertainment fans.
            </p>

            {/* Role Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-full bg-zinc-900 border border-zinc-800 mt-8 gap-1 shadow-lg">
              <button
                onClick={() => setActiveRoleTab('performer')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeRoleTab === 'performer'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Mic2 className="w-4 h-4" />
                <span>For Performers</span>
              </button>
              <button
                onClick={() => setActiveRoleTab('restaurant')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeRoleTab === 'restaurant'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>For Venues</span>
              </button>
              <button
                onClick={() => setActiveRoleTab('audience')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeRoleTab === 'audience'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>For Audiences</span>
              </button>
            </div>
          </div>

          {/* Interactive Role Card Content */}
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-6 sm:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {activeRoleTab === 'performer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> For Solo Artists, Bands, DJs & Comedians
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                    Showcase Your Sound & Connect With Curated Stages.
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    Build a verified Electronic Press Kit (EPK), receive direct gig invitations from top venues, and grow your live audience.
                  </p>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Direct gig applications to vetted cocktail bars, clubs, and rooftops</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Custom audio & video reel portfolio with social links</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Verified performer profile and attendee feedback ratings</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Button 
                      onClick={() => setActiveInfoModal('performer')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-7 py-6 font-bold shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      <span>How Artists Succeed on StageLink</span>
                    </Button>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveInfoModal('performer')}
                  className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-xl space-y-4 cursor-pointer hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
                        <Mic2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">Artist Platform Workflow</h4>
                        <p className="text-xs text-emerald-400 font-medium">● Verified Gig Agreements</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full">EPK Showcase</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Friday Acoustic Night</p>
                        <p className="text-zinc-400">Skyline Taproom • 8:00 PM</p>
                      </div>
                      <span className="text-emerald-400 font-bold">Scheduled</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Sunday Brunch Jazz</p>
                        <p className="text-zinc-400">The Brass Room • 12:30 PM</p>
                      </div>
                      <span className="text-indigo-400 font-bold">Venue Invite</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-indigo-400 font-semibold pt-1">Click to view performer feature overview →</p>
                </div>
              </div>
            )}

            {activeRoleTab === 'restaurant' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 text-xs font-semibold">
                    <Building2 className="w-3.5 h-3.5" /> For Lounges, Microbreweries, Cafes & Clubs
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                    Curate Live Programming with Frictionless Booking.
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    Post open performance dates, scout vetted musician auditions with recorded demos, and manage stage entertainment seamlessly.
                  </p>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Post open gig calls and review structured artist applications</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Interactive digital stage schedule & QR codes for patrons</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Track entertainment footfall and boost lounge atmosphere</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Button 
                      onClick={() => setActiveInfoModal('restaurant')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-7 py-6 font-bold shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      <span>How Venues Curate Entertainment</span>
                    </Button>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveInfoModal('restaurant')}
                  className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-xl space-y-4 cursor-pointer hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">Venue Management Capabilities</h4>
                        <p className="text-xs text-indigo-400 font-medium">Curated Roster of Artists</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">Active Stage</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Live Entertainment Schedule</p>
                        <p className="text-zinc-400">Weekly Jazz & Acoustic Lineup</p>
                      </div>
                      <span className="text-zinc-300 font-bold">Active</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Artist Inquiries: Neo Soul Collective</p>
                        <p className="text-zinc-400">Audition Track Available</p>
                      </div>
                      <span className="text-indigo-400 font-bold">Vetted</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-purple-400 font-semibold pt-1">Click to view venue partner capabilities →</p>
                </div>
              </div>
            )}

            {activeRoleTab === 'audience' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5" /> For Music Fans & Night Owls
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                    Discover Incredible Live Performances in Your City.
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    Explore rooftop acoustic sets, candlelit jazz parlors, and electronic DJ showcases with verified performer line-ups.
                  </p>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Filter live shows by music vibe, locality, and performance timing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Listen to artist demos and view verified venue atmospheric tags</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>Social meetup tables to connect with like-minded music lovers</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Button 
                      onClick={() => setActiveInfoModal('audience')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-7 py-6 font-bold shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      <span>How Fans Experience StageLink</span>
                    </Button>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveInfoModal('audience')}
                  className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-xl space-y-4 cursor-pointer hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">Audience Discovery Experience</h4>
                        <p className="text-xs text-zinc-400">Live Stage Highlights</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full">Community</span>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 text-xs space-y-2">
                    <div className="flex justify-between font-bold text-white">
                      <span>Rooftop Candlelight Session</span>
                      <span className="text-indigo-400">8:00 PM</span>
                    </div>
                    <p className="text-zinc-400">Skyline Taproom • Live Jazz Duo</p>
                    <div className="pt-1 flex items-center gap-2 text-zinc-300">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Community table and social music meetup feature</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-cyan-400 font-semibold pt-1">Click to view fan feature guide →</p>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* 3-Step Platform Journey (Informational Roadmap) */}
        <section className="my-16 sm:my-28 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
            How The Network Functions
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Three Steps of the Live Experience
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-16 text-base sm:text-lg">
            StageLink streamlines the entire lifecycle of live entertainment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div 
              onClick={() => scrollToSection('live-shows-section')}
              className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md relative group hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-lg mb-6">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Discover & Match</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Explore by musical vibe, genre, and city locality. Artists discover open stages, venues discover vetted talent, and music fans find tonight's shows.
              </p>
            </div>

            <div 
              onClick={() => setActiveInfoModal('restaurant')}
              className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md relative group hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-lg mb-6">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Book & Schedule</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Performers and venues confirm transparent gig contracts inside their dashboards, locking in sound checks, performance times, and rates.
              </p>
            </div>

            <div 
              onClick={() => setActiveInfoModal('audience')}
              className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md relative group hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-lg mb-6">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Experience the Stage</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Audiences enjoy live performances, interact with digital stage schedules, tip performers, and share feedback that strengthens the local scene.
              </p>
            </div>
          </div>
        </section>

        {/* Community Testimonials */}
        <section className="my-16 sm:my-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
              Voices of StageLink
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Loved by Artists, Venues & Music Fans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
                  "StageLink transformed how I book my acoustic tours. I discovered 8 packed weekend gigs across Bangalore and Pune without sending a single cold email."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Elena R."
                  className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Elena R.</h4>
                  <p className="text-xs text-indigo-400">Indie Acoustic Songwriter</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
                  "Our Thursday night table occupancy spiked by 45% after we started programming curated jazz musicians via StageLink. An absolute game-changer."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Vikram S."
                  className="w-10 h-10 rounded-full object-cover border border-purple-500/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Vikram S.</h4>
                  <p className="text-xs text-purple-400">General Manager, Skyline Lounge</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
                  "Finding great live music used to mean endless social media scrolling. With StageLink I can simply see who is performing live near me tonight."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                  alt="Ananya P."
                  className="w-10 h-10 rounded-full object-cover border border-cyan-500/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Ananya P.</h4>
                  <p className="text-xs text-cyan-400">Live Music Enthusiast</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section id="faq-section" className="my-16 sm:my-28 max-w-3xl mx-auto scroll-mt-24">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-white text-base sm:text-lg hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronRight className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-90 text-indigo-400' : ''
                    }`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm sm:text-base text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Informational Call to Action */}
        <section className="my-16 sm:my-24 rounded-3xl bg-gradient-to-r from-indigo-950 via-zinc-900 to-purple-950 border border-indigo-500/30 p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-indigo-950/60">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Empowering the Live Stage
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Ready to Discover <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">
                Your Local Live Scene?
              </span>
            </h2>

            <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto">
              Learn how artists, venues, and live entertainment enthusiasts are elevating performances across the country.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                size="lg"
                onClick={() => scrollToSection('live-shows-section')}
                className="w-full sm:w-auto rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-6 text-base sm:text-lg shadow-xl shadow-indigo-600/40 transition-all hover:scale-105 cursor-pointer"
              >
                Explore Showcases
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setActiveInfoModal('platform')}
                className="w-full sm:w-auto rounded-full border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white px-8 py-6 text-base sm:text-lg font-semibold transition-all backdrop-blur-md cursor-pointer"
              >
                Platform Information Overview
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* PURELY INFORMATIONAL MODAL: EVENT & ARTIST SPOTLIGHT (NO BOOKING)         */}
      {/* ========================================================================= */}
      {selectedEventInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEventInfo(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Event Media Header */}
            <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-zinc-950">
              {selectedEventInfo.performer?.profilePicture ? (
                <img
                  src={selectedEventInfo.performer.profilePicture}
                  alt={selectedEventInfo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-950">
                  <Music className="w-16 h-16 text-indigo-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-md">
                  {selectedEventInfo.genre || 'Live Showcase'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900/80 text-zinc-200 border border-white/10 backdrop-blur-md">
                  {new Date(selectedEventInfo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Title & Artist */}
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-1">
                <Mic2 className="w-4 h-4" />
                <span>{selectedEventInfo.performer?.displayName || 'Featured Artist'}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{selectedEventInfo.performer?.category || 'Live Musician'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {selectedEventInfo.title}
              </h2>
            </div>

            {/* Description / Bio */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-300 leading-relaxed">
              <p>{selectedEventInfo.description || selectedEventInfo.performer?.bio || 'Featured live stage performance curated through StageLink.'}</p>
            </div>

            {/* Venue & Location Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>{selectedEventInfo.restaurant?.restaurantName || 'Venue'}</span>
                </div>
                <p className="text-zinc-400">{selectedEventInfo.restaurant?.address || selectedEventInfo.restaurant?.location || 'City Center'}</p>
                {selectedEventInfo.restaurant?.vibe && (
                  <p className="text-indigo-400/90 pt-1 font-medium">{selectedEventInfo.restaurant.vibe}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/60 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Showcase Information</span>
                </div>
                <p className="text-zinc-300 font-semibold">{selectedEventInfo.atmosphere || 'Live Performance'}</p>
                <p className="text-zinc-400">Live performance details and schedules are managed directly by venue and performer partners.</p>
              </div>
            </div>

            {/* Note Explaining Info-Only Nature */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                This is an informational spotlight. Registered venues, performers, and patrons manage bookings and live schedules inside their respective dashboards.
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedEventInfo(null)}
                className="px-6 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Close Showcase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PURELY INFORMATIONAL GUIDES MODAL (PERFORMER, VENUE, AUDIENCE, PLATFORM)  */}
      {/* ========================================================================= */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveInfoModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {activeInfoModal === 'performer' && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-xs font-bold">
                  <Mic2 className="w-3.5 h-3.5" /> Artist & Performer Information
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Artists Perform on StageLink
                </h2>
                <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">1</span>
                      Digital EPK Profile
                    </h4>
                    <p className="text-xs text-zinc-400">Artists build a digital press kit with musical genre tags, demo reels, bio, and performance history.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">2</span>
                      Curated Gigs & Direct Inquiries
                    </h4>
                    <p className="text-xs text-zinc-400">Browse open gig slots posted by vetted venues or receive direct booking invites from restaurant managers.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">3</span>
                      Transparent Performance Agreements
                    </h4>
                    <p className="text-xs text-zinc-400">Lock in gig dates, sound checks, and agreed compensation directly with venue owners.</p>
                  </div>
                </div>
              </>
            )}

            {activeInfoModal === 'restaurant' && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 text-purple-400 border border-purple-500/30 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" /> Venue Partner Program
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  How Hospitality Venues Benefit
                </h2>
                <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs">1</span>
                      Vetted Musician Roster
                    </h4>
                    <p className="text-xs text-zinc-400">Review verified artist profiles with audio and video samples tailored to your venue's atmosphere.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs">2</span>
                      Digital Live Schedules
                    </h4>
                    <p className="text-xs text-zinc-400">Provide patrons with live schedules and stage highlights to build regular live entertainment nights.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs">3</span>
                      Streamlined Booking & Coordination
                    </h4>
                    <p className="text-xs text-zinc-400">Communicate directly with performers for sound requirements, schedule updates, and performance confirmations.</p>
                  </div>
                </div>
              </>
            )}

            {activeInfoModal === 'audience' && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
                  <Users className="w-3.5 h-3.5" /> Audience & Fan Experience
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Discovering Live Shows on StageLink
                </h2>
                <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-xs">1</span>
                      Vibe-Based Discovery
                    </h4>
                    <p className="text-xs text-zinc-400">Search by genres like Acoustic, Jazz, Techno, or Comedy to find what matches your mood.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-xs">2</span>
                      Live Stage Highlights
                    </h4>
                    <p className="text-xs text-zinc-400">Learn about independent artists, upcoming concert tours, and local residency shows in your city.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-xs">3</span>
                      Community Music Culture
                    </h4>
                    <p className="text-xs text-zinc-400">Support local musicians, connect with fellow live music lovers, and celebrate indie culture.</p>
                  </div>
                </div>
              </>
            )}

            {activeInfoModal === 'platform' && (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-xs font-bold">
                  <Info className="w-3.5 h-3.5" /> StageLink Network Overview
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  About the StageLink Platform
                </h2>
                <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                  <p>StageLink unites three foundational pillars of the live entertainment scene:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <p className="font-bold text-indigo-400 text-sm mb-1">Independent Artists</p>
                      <p className="text-zinc-400">Showcase demo reels, find verified gig offers, and build a following.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <p className="font-bold text-purple-400 text-sm mb-1">Hospitality Venues</p>
                      <p className="text-zinc-400">Book vetted talent, publish schedules, and elevate dining atmosphere.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <p className="font-bold text-cyan-400 text-sm mb-1">Live Audiences</p>
                      <p className="text-zinc-400">Discover upcoming gigs and celebrate live independent talent.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setActiveInfoModal(null)}
                className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
