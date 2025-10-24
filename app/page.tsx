import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  MessageCircle, 
  Users, 
  Radio, 
  Shield, 
  Zap, 
  Heart,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  Mic,
  Video,
  Shuffle,
  Link2,
  Clock
} from 'lucide-react';
import LandingClientWrapper from '@/components/landing/LandingClientWrapper';
import { UsersAndRoomsSection } from '@/components/landing/UsersAndRoomsSection';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Flipy Chat - Connect, Chat, and Collaborate Anywhere',
  description: 'Experience seamless communication with Flipy Chat. Create rooms, broadcast voice messages, share moments, and build meaningful connections with people around the world. Join our safe, modern chat platform today!',
  keywords: ['chat app', 'real-time messaging', 'voice broadcasting', 'chat rooms', 'online community', 'social chat', 'instant messaging', 'group chat', 'voice messages'],
  openGraph: {
    title: 'Flipy Chat - Modern Real-Time Communication Platform',
    description: 'Join Flipy Chat for instant messaging, voice broadcasting, and meaningful connections. Safe, fast, and feature-rich chat experience.',
    type: 'website',
    url: 'https://flipychat.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flipy Chat - Connect Anywhere, Anytime',
    description: 'Experience seamless communication with real-time messaging, voice broadcasting, and chat rooms.',
  },
};

export default function LandingPage() {

  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Flipy Chat',
    description: 'Experience seamless communication with Flipy Chat. Create rooms, broadcast voice messages, share moments, and build meaningful connections.',
    url: 'https://flipychat.com',
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
    },
    featureList: [
      'Real-time Messaging',
      'Voice Broadcasting',
      'Chat Rooms',
      'Voice Messages',
      'Follow System',
      'Image Sharing',
    ],
  };

  return (
    <LandingClientWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Navigation */}
        <nav className="border-b border-gray-800 bg-gray-900/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/">
                <img src="/logo-icon.png" alt="Flipy Chat" className="h-10 w-10 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/about">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">About</Button>
                </Link>
                <Link href="/privacy-policy">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">Privacy</Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <Badge className="mb-4 text-sm px-4 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 text-blue-300" variant="secondary">
              🎉 New: Voice Broadcasting Feature
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Connect, Chat, and Collaborate
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Anywhere, Anytime</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience seamless communication with our modern chat platform. Create rooms, broadcast voice messages, 
              share moments, and build meaningful connections with people around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Start Chatting <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Everything You Need to Stay Connected
              </h2>
              <p className="text-xl text-gray-300">
                Powerful features designed for modern communication
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Real-time Messaging</h3>
                  <p className="text-gray-400">
                    Send and receive messages instantly with our lightning-fast chat system.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Create Rooms</h3>
                  <p className="text-gray-400">
                    Organize conversations with custom rooms for teams, friends, or communities.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-green-500/20 transition-all">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Radio className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Voice Broadcasting</h3>
                  <p className="text-gray-400">
                    Broadcast your voice in real-time to all room members with high-quality audio.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-orange-500/20 transition-all">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Mic className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Voice Messages</h3>
                  <p className="text-gray-400">
                    Record and share voice messages for more personal communication.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-red-500/20 transition-all">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Heart className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Follow System</h3>
                  <p className="text-gray-400">
                    Follow users, build your network, and stay updated with their activities.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Safe & Secure</h3>
                  <p className="text-gray-400">
                    Your privacy matters. Age-restricted (16+) with strict content policies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Users and Rooms Sections - Client-side fetched */}
        <UsersAndRoomsSection />

        {/* Why Choose Us Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">
                  Why Choose Flipy Chat?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg text-white">Easy to Use</h3>
                      <p className="text-gray-400">Intuitive interface designed for everyone</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg text-white">Lightning Fast</h3>
                      <p className="text-gray-400">Real-time messaging with zero lag</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg text-white">Cross-Platform</h3>
                      <p className="text-gray-400">Works seamlessly on all devices</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg text-white">Privacy First</h3>
                      <p className="text-gray-400">Your data is encrypted and secure</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                  <CardContent className="pt-6">
                    <Globe className="h-8 w-8 mb-2" />
                    <div className="text-3xl font-bold mb-1">Global</div>
                    <div className="text-blue-200">Connect Worldwide</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                  <CardContent className="pt-6">
                    <Zap className="h-8 w-8 mb-2" />
                    <div className="text-3xl font-bold mb-1">Fast</div>
                    <div className="text-purple-200">Instant Delivery</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 hover:shadow-lg hover:shadow-green-500/50 transition-all">
                  <CardContent className="pt-6">
                    <Lock className="h-8 w-8 mb-2" />
                    <div className="text-3xl font-bold mb-1">Secure</div>
                    <div className="text-green-200">End-to-End</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 hover:shadow-lg hover:shadow-orange-500/50 transition-all">
                  <CardContent className="pt-6">
                    <Heart className="h-8 w-8 mb-2" />
                    <div className="text-3xl font-bold mb-1">16+</div>
                    <div className="text-orange-200">Safe Community</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full mb-4 border border-purple-500/50">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Coming Soon</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Exciting Features on the Horizon
              </h2>
              <p className="text-xl text-gray-300">
                We're constantly innovating to bring you the best chat experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 - Video Calling */}
              <Card className="border-2 border-gray-700 bg-gradient-to-br from-gray-800/80 to-blue-900/20 hover:from-gray-800 hover:to-blue-900/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all group">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-blue-500/50">
                    <Video className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Video Calling</h3>
                  <p className="text-gray-400 mb-4">
                    Connect face-to-face with high-quality video calls. Make your conversations more personal 
                    with crystal-clear video and audio.
                  </p>
                  <div className="flex items-center text-sm text-blue-400 font-semibold">
                    <Zap className="h-4 w-4 mr-2" />
                    HD Quality • Secure • Fast
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 - Random Chat Connect */}
              <Card className="border-2 border-gray-700 bg-gradient-to-br from-gray-800/80 to-purple-900/20 hover:from-gray-800 hover:to-purple-900/30 hover:shadow-lg hover:shadow-purple-500/20 transition-all group">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-purple-500/50">
                    <Shuffle className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Random Chat Connect</h3>
                  <p className="text-gray-400 mb-4">
                    Meet new people randomly based on your location, country, and gender preferences. 
                    Discover interesting conversations with people around the world.
                  </p>
                  <div className="flex items-center text-sm text-purple-400 font-semibold">
                    <Globe className="h-4 w-4 mr-2" />
                    Location-based • Smart Matching
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 - Quick Share & Chat */}
              <Card className="border-2 border-gray-700 bg-gradient-to-br from-gray-800/80 to-green-900/20 hover:from-gray-800 hover:to-green-900/30 hover:shadow-lg hover:shadow-green-500/20 transition-all group">
                <CardContent className="pt-6">
                  <div className="h-16 w-16 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-green-500/50">
                    <Link2 className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Quick Share & Chat</h3>
                  <p className="text-gray-400 mb-4">
                    Share secure chat links via WhatsApp or any platform. Anyone with the link can instantly 
                    join and start chatting without signup - quick and secure!
                  </p>
                  <div className="flex items-center text-sm text-green-400 font-semibold">
                    <Lock className="h-4 w-4 mr-2" />
                    End-to-End Encrypted • No Signup
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-400 text-lg mb-4">
                Want to be notified when these features launch?
              </p>
              <Link href="/login">
                <Button variant="outline" size="lg" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Join the Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Connecting?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users already chatting on Flipy Chat. It's free to get started!
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white hover:bg-gray-100 text-gray-900">
                Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-950 text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <Link href="/">
                  <img src="/logo-icon.png" alt="Flipy Chat" className="h-8 w-8 rounded-lg mb-4 cursor-pointer hover:opacity-80 transition-opacity" />
                </Link>
                <p className="text-sm text-gray-500">
                  Connecting people through modern communication
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Product</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Features</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Get Started</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Create Account</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Flipy Chat. All rights reserved. This platform is for users 16 years and older.</p>
            </div>
          </div>
        </footer>
      </div>
    </LandingClientWrapper>
  );
}
