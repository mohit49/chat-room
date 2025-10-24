import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  MessageCircle, 
  Shield, 
  AlertTriangle,
  Lock,
  Eye,
  Users,
  Ban,
  CheckCircle2
} from 'lucide-react';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Privacy Policy & Terms - Flipy Chat | Age 16+ | Safe Platform',
  description: 'Read Flipy Chat\'s Privacy Policy and Terms of Service. Strictly 16+ age restriction. Zero-tolerance policy for inappropriate content. Learn about our commitment to safety, security, and privacy.',
  keywords: ['flipy chat privacy', 'chat app terms', 'age restriction 16+', 'safe chat platform', 'content policy', 'data security'],
  openGraph: {
    title: 'Privacy Policy - Flipy Chat | Safe & Secure',
    description: 'Flipy Chat is a safe platform for users 16+. Learn about our strict content policies, age verification, and commitment to privacy.',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
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
              <Link href="/about">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">About</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4 border border-blue-500/50">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4">
            Privacy Policy & Terms
          </h1>
          <p className="text-xl text-gray-300">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Important Notice - Age Restriction */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-red-500 bg-red-950/50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="h-8 w-8 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-red-400 mb-3">Age Restriction - 16+ Only</h2>
                  <p className="text-lg text-red-300 mb-3">
                    <strong>Flipy Chat is exclusively for users who are 16 years of age or older.</strong> By using this 
                    platform, you confirm that you are at least 16 years old. We take age verification seriously and 
                    will terminate any accounts found to belong to users under 16.
                  </p>
                  <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 mt-4">
                    <p className="text-red-300 font-semibold mb-2">🚫 If you are under 16 years old:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-400">
                      <li>You are NOT permitted to create an account</li>
                      <li>You are NOT permitted to use this platform</li>
                      <li>Please exit this site immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Content Policy */}
      <section className="pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-orange-500 bg-orange-950/50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Ban className="h-8 w-8 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-orange-400 mb-3">Strict Content Policy</h2>
                  <p className="text-lg text-orange-300 mb-4">
                    Flipy Chat maintains a <strong>zero-tolerance policy</strong> for inappropriate content. 
                    We are committed to providing a safe, respectful environment for all users.
                  </p>
                  
                  <div className="bg-orange-900/30 border-2 border-orange-500/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold text-orange-300 mb-3">🚫 Strictly Prohibited Content:</h3>
                    <ul className="space-y-2 text-orange-400">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Sexual Content:</strong> Any sexually explicit content, images, messages, or references are strictly prohibited</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Nudity:</strong> Sharing or requesting nude or partially nude images is forbidden</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Adult Content:</strong> No pornographic material, adult services, or sexually suggestive content</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Harassment:</strong> Sexual harassment, unwanted advances, or inappropriate solicitation</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Hate Speech:</strong> Content promoting hatred, violence, or discrimination</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">•</span>
                        <span><strong>Illegal Activities:</strong> Content promoting or facilitating illegal activities</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-900/50 border-2 border-red-500/70 rounded-lg p-4">
                    <p className="text-red-300 font-bold text-lg mb-2">⚠️ Consequences of Violations:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-400">
                      <li>Immediate account suspension or termination</li>
                      <li>Permanent ban from the platform</li>
                      <li>Reporting to appropriate authorities when legally required</li>
                      <li>Legal action may be pursued in severe cases</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Privacy Policy Sections */}
          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <Lock className="mr-3 h-6 w-6 text-blue-400" />
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-white">Account Information:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                  <li>Mobile number (for authentication)</li>
                  <li>Username and profile information</li>
                  <li>Profile picture (optional)</li>
                  <li>Age (to verify 16+ requirement)</li>
                  <li>Location information (if you choose to share it)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-white">Usage Information:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                  <li>Messages and content you send</li>
                  <li>Rooms you create or join</li>
                  <li>Voice broadcasts and recordings</li>
                  <li>Interaction with other users (follows, messages)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <Eye className="mr-3 h-6 w-6 text-purple-400" />
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li>Provide and maintain our chat services</li>
                <li>Authenticate your identity and secure your account</li>
                <li>Enable communication with other users</li>
                <li>Enforce our age restrictions and content policies</li>
                <li>Improve our services and develop new features</li>
                <li>Send important service notifications</li>
                <li>Prevent fraud, abuse, and policy violations</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <Shield className="mr-3 h-6 w-6 text-green-400" />
                3. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>
                We take data security seriously and implement industry-standard measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li>Encrypted data transmission (HTTPS/WSS)</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and user authentication</li>
                <li>Secure server infrastructure</li>
              </ul>
              <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-4 mt-4">
                <p className="text-yellow-300">
                  <strong>Note:</strong> While we implement strong security measures, no system is 100% secure. 
                  Please use strong passwords and never share your account credentials.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <Users className="mr-3 h-6 w-6 text-orange-400" />
                4. Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-4 mb-4">
                <p className="text-green-300 font-semibold mb-2">
                  ✅ We DO NOT sell your personal information to third parties.
                </p>
              </div>
              <p>We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li><strong className="text-white">With other users:</strong> Your profile information, username, and messages you send are visible to other users as part of the service</li>
                <li><strong className="text-white">Legal requirements:</strong> When required by law, court order, or governmental authority</li>
                <li><strong className="text-white">Safety:</strong> To protect the rights, property, or safety of Flipy Chat, our users, or the public</li>
                <li><strong className="text-white">Service providers:</strong> With trusted partners who help us operate our service (under strict confidentiality agreements)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <CheckCircle2 className="mr-3 h-6 w-6 text-blue-400" />
                5. Your Rights and Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li>Access and update your profile information</li>
                <li>Control your location sharing preferences</li>
                <li>Delete your account and associated data</li>
                <li>Report inappropriate content or users</li>
                <li>Block or unfollow other users</li>
                <li>Control notification settings</li>
                <li>Request a copy of your data</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <Shield className="mr-3 h-6 w-6 text-red-400" />
                6. Moderation and Enforcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>
                To maintain a safe platform, we employ both automated and manual moderation:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li>Automated content filtering for prohibited material</li>
                <li>User reporting system for inappropriate content</li>
                <li>Manual review of reported content</li>
                <li>Age verification mechanisms</li>
                <li>Immediate action on policy violations</li>
              </ul>
              <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-4 mt-4">
                <p className="text-blue-300">
                  <strong>Report Violations:</strong> If you encounter inappropriate content or behavior, 
                  please report it immediately. We review all reports promptly and take appropriate action.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <Lock className="mr-3 h-6 w-6 text-purple-400" />
                7. Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>We retain your information for as long as:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li>Your account is active</li>
                <li>Required to provide our services</li>
                <li>Necessary for legal, tax, or accounting requirements</li>
                <li>Needed to resolve disputes or enforce our policies</li>
              </ul>
              <p className="mt-3">
                When you delete your account, we will delete or anonymize your personal information, 
                except where we are legally required to retain it.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <AlertTriangle className="mr-3 h-6 w-6 text-yellow-400" />
                8. Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                <li>Posting the new policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending you a notification (for significant changes)</li>
              </ul>
              <p className="mt-3">
                Your continued use of Flipy Chat after any changes indicates your acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-white">
                <MessageCircle className="mr-3 h-6 w-6 text-blue-400" />
                9. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your data, 
                please contact us through the app's support section.
              </p>
              <div className="bg-gray-700/50 border-2 border-gray-600 rounded-lg p-4 mt-4">
                <p className="text-gray-300">
                  <strong>Remember:</strong> By using Flipy Chat, you agree to this Privacy Policy and confirm 
                  that you are 16 years of age or older.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Safe Community?
          </h2>
          <p className="text-lg text-blue-100 mb-6">
            By creating an account, you confirm you're 16+ and agree to our policies.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white hover:bg-gray-100 text-gray-900">
              Get Started
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
