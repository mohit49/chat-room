import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  MessageCircle, 
  Users, 
  Target,
  Heart,
  Shield,
  Sparkles,
  ArrowRight,
  Globe,
  Zap
} from 'lucide-react';

// SEO Metadata with enhanced social sharing support
export const metadata: Metadata = {
  title: 'About Us - FlipyChat | Our Mission & Values',
  description: 'Learn about FlipyChat\'s mission to bring people together through modern, secure, and intuitive communication. Discover our core values and what makes us different.',
  openGraph: {
    title: 'About FlipyChat - Bringing People Together',
    description: 'Learn about our mission to provide a safe, modern platform for meaningful connections through chat, voice broadcasting, and community building.',
    url: 'https://flipychat.com/about',
    siteName: 'FlipyChat',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://flipychat.com/logo-icon.png',
        width: 1200,
        height: 630,
        alt: 'About FlipyChat',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FlipyChat - Bringing People Together',
    description: 'Learn about our mission to provide a safe, modern platform for meaningful connections through chat, voice broadcasting, and community building.',
    images: ['https://flipychat.com/logo-icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://flipychat.com/about',
  },
};

// Enable server-side rendering (static page, can be cached)
export const revalidate = 3600; // Revalidate every hour

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <img src="/logo-icon.png" alt="Flipy Chat" className="h-10 w-10 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">Home</Button>
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
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            About <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Flipy Chat</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Empowering meaningful connections through modern, secure, and intuitive communication
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-4 border border-blue-500/50">
                <Target className="h-5 w-5" />
                <span className="font-semibold">Our Mission</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Bringing People Together
              </h2>
              <p className="text-lg text-gray-300 mb-4">
                At Flipy Chat, we believe that meaningful communication is the foundation of strong relationships. 
                Our mission is to provide a platform that makes staying connected effortless, secure, and enjoyable.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                We've built a space where you can create communities, share moments, and express yourself freely 
                while maintaining the highest standards of privacy and safety.
              </p>
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Join Our Community <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                <CardContent className="pt-6">
                  <Users className="h-10 w-10 mb-3" />
                  <div className="text-3xl font-bold mb-1">1000+</div>
                  <div className="text-blue-200">Active Users</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                <CardContent className="pt-6">
                  <MessageCircle className="h-10 w-10 mb-3" />
                  <div className="text-3xl font-bold mb-1">100K+</div>
                  <div className="text-purple-200">Messages Sent</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 hover:shadow-lg hover:shadow-green-500/50 transition-all">
                <CardContent className="pt-6">
                  <Globe className="h-10 w-10 mb-3" />
                  <div className="text-3xl font-bold mb-1">50+</div>
                  <div className="text-green-200">Countries</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 hover:shadow-lg hover:shadow-orange-500/50 transition-all">
                <CardContent className="pt-6">
                  <Zap className="h-10 w-10 mb-3" />
                  <div className="text-3xl font-bold mb-1">99.9%</div>
                  <div className="text-orange-200">Uptime</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-300">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <CardContent className="pt-6">
                <div className="h-14 w-14 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center text-white">Safety First</h3>
                <p className="text-gray-400 text-center">
                  We maintain a strict 16+ age policy and enforce zero-tolerance for inappropriate content. 
                  Your safety and comfort are our top priorities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              <CardContent className="pt-6">
                <div className="h-14 w-14 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Heart className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center text-white">User-Centric</h3>
                <p className="text-gray-400 text-center">
                  Every feature we build is designed with you in mind. We listen to feedback and 
                  constantly improve to meet your needs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-green-500/20 transition-all">
              <CardContent className="pt-6">
                <div className="h-14 w-14 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Sparkles className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center text-white">Innovation</h3>
                <p className="text-gray-400 text-center">
                  We're always exploring new ways to enhance your communication experience with 
                  cutting-edge features like voice broadcasting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">What Makes Us Different</h2>
            <p className="text-xl text-gray-300">
              Built for the modern communicator
            </p>
          </div>

          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">Real-Time Everything</h3>
                <p className="text-lg text-gray-300 mb-4">
                  Experience instant message delivery, live voice broadcasting, and real-time notifications. 
                  No delays, no lag – just seamless communication.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    WebSocket-based instant messaging
                  </li>
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    Real-time voice broadcasting
                  </li>
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    Live online status updates
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 rounded-2xl border border-blue-500/30">
                <MessageCircle className="h-24 w-24 text-blue-400 mx-auto" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-8 rounded-2xl border border-purple-500/30">
                <Shield className="h-24 w-24 text-purple-400 mx-auto" />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-bold text-white mb-4">Privacy & Security</h3>
                <p className="text-lg text-gray-300 mb-4">
                  Your conversations are private and secure. We use industry-standard encryption 
                  and never share your data with third parties.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                    Encrypted data transmission
                  </li>
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                    Strict content moderation
                  </li>
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                    Age-verified community (16+)
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">Community-Driven</h3>
                <p className="text-lg text-gray-300 mb-4">
                  Create custom rooms for your communities, follow interesting people, and build 
                  meaningful connections in a safe, respectful environment.
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    Customizable chat rooms
                  </li>
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    Follow system to stay connected
                  </li>
                  <li className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    Rich media sharing
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-8 rounded-2xl border border-green-500/30">
                <Users className="h-24 w-24 text-green-400 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Be part of a safe, vibrant community where real connections happen.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white hover:bg-gray-100 text-gray-900">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
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
                <li><Link href="/" className="hover:text-white transition-colors">Features</Link></li>
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
  );
}
