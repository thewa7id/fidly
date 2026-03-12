"use client";

import Link from 'next/link';
import { 
  ArrowRight, 
  Star, 
  Smartphone, 
  Cpu, 
  QrCode, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  LayoutDashboard, 
  Gift, 
  CheckCircle2, 
  Store,
  Coffee,
  Utensils,
  Croissant,
  Scissors,
  Dumbbell,
  IceCream,
  ShoppingBag,
  Plus,
  ArrowUpRight,
  Shield,
  Smartphone as PhoneIcon,
  CreditCard,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from '@/components/landing/Container';
import { Section } from '@/components/landing/Section';
import { BrandButton } from '@/components/landing/BrandButton';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { HeroVisuals } from '@/components/landing/HeroVisuals';
import { NFCExperience } from '@/components/landing/NFCExperience';
import { WalletExperience } from '@/components/landing/WalletExperience';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F9FAFB] selection:bg-[#EA9010]/30 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-xl">
        <Container className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#EA9010] flex items-center justify-center shadow-[0_0_20px_rgba(234,144,16,0.2)]">
              <Star className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Fidly</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors">How it Works</Link>
            <Link href="#pricing" className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors">Log in</Link>
            <Link href="/register">
              <BrandButton size="sm">Start Free</BrandButton>
            </Link>
          </div>
        </Container>
      </nav>

      {/* 1. Hero Section */}
      <Section className="pt-40 md:pt-52 pb-20 overflow-hidden relative">
        <Container className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="text-left"
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EA9010]/10 border border-[#EA9010]/20 text-[#EA9010] text-xs font-bold uppercase tracking-wider mb-8"
            >
              <PhoneIcon className="w-3 h-3" />
              Modern Loyalty Platform
            </motion.div>
            
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-6xl md:text-8xl font-bold leading-[1.05] mb-8 text-white tracking-tight"
            >
              Turn visits into <span className="text-[#EA9010]">loyal</span> customers
            </motion.h1>
            
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-xl text-[#9CA3AF] max-w-xl mb-10 leading-relaxed"
            >
              Fidly helps restaurants, cafés, and local businesses reward customers with digital stamps, NFC loyalty cards, wallet passes, and smart loyalty tools.
            </motion.p>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link href="/register">
                <BrandButton size="lg" glow className="px-10 py-8 text-xl">
                  Start Free
                </BrandButton>
              </Link>
              <Link href="/demo">
                <BrandButton size="lg" variant="outline" className="px-10 py-8 text-xl">
                  Book a Demo
                </BrandButton>
              </Link>
            </motion.div>

            {/* Feature Pills */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex flex-wrap gap-4"
            >
              {[
                { label: "NFC Loyalty Cards", icon: <Cpu className="w-3 h-3" /> },
                { label: "Apple & Google Wallet", icon: <Wallet className="w-3 h-3" /> },
                { label: "POS Integrations", icon: <Zap className="w-3 h-3" /> }
              ].map((pill, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {pill.icon}
                  {pill.label}
                </div>
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <HeroVisuals />
          </motion.div>
        </Container>
      </Section>

      {/* 2. Social Proof Section */}
      <Section className="py-20 border-y border-white/5 bg-[#111827]/50" animate={false}>
        <Container>
          <div className="text-center mb-12">
            <p className="text-[#9CA3AF] font-medium uppercase tracking-[0.2em] text-xs mb-8">Trusted by growing businesses</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div>
                <div className="text-5xl font-bold text-white mb-2">10,000+</div>
                <div className="text-[#9CA3AF] text-sm">loyalty cards issued</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">150+</div>
                <div className="text-[#9CA3AF] text-sm">businesses using Fidly</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">35,000+</div>
                <div className="text-[#9CA3AF] text-sm">customer visits rewarded</div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 3. Problem Section */}
      <Section className="bg-[#0F172A]">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Paper loyalty cards don't work anymore</h2>
            <p className="text-xl text-[#9CA3AF]">
              Traditional loyalty programs are broken. Customers lose them, businesses can't track them, and they provide zero insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Lost cards" 
              description="85% of paper loyalty cards are lost or forgotten before they're ever redeemed."
              icon={<Zap className="w-6 h-6" />}
              glow={false}
            />
            <FeatureCard 
              title="No analytics" 
              description="You have no idea who your best customers are or how often they return."
              icon={<BarChart3 className="w-6 h-6" />}
              glow={false}
            />
            <FeatureCard 
              title="No customer data" 
              description="You can't contact your customers with rewards or special offers."
              icon={<ShieldCheck className="w-6 h-6" />}
              glow={false}
            />
          </div>
        </Container>
      </Section>

      {/* 4. Wallet Experience Section */}
      <WalletExperience />

      {/* 5. Solution Section */}
      <Section className="bg-[#111827] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#EA9010]/5 blur-[120px] rounded-full" />
        <Container>
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Meet Fidly</h2>
              <p className="text-xl text-[#9CA3AF] mb-12 leading-relaxed">
                A digital loyalty system designed for modern businesses. Frictionless for customers, powerful for owners.
              </p>
              
              <ul className="space-y-6">
                {[
                  { title: "QR Loyalty Card", desc: "No app needed. Just scan and save to home screen." },
                  { title: "NFC Tap Technology", desc: "Tap a physical card to collect stamps instantly." },
                  { title: "Wallet Integration", desc: "Native Apple & Google Wallet support." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EA9010]/20 flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-[#EA9010]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-[#9CA3AF] text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="aspect-[4/5] bg-slate-900 rounded-2xl border border-white/5 p-6 flex flex-col justify-end">
                  <QrCode className="w-10 h-10 text-[#EA9010] mb-4" />
                  <p className="text-white font-bold">QR Access</p>
                </div>
                <div className="aspect-[1/1] bg-gradient-to-br from-[#EA9010] to-[#F2A93A] rounded-2xl p-6 flex flex-col justify-end">
                  <Star className="w-10 h-10 text-white mb-4" fill="white" />
                  <p className="text-white font-bold">Rewards</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="aspect-[1/1] bg-slate-800 rounded-2xl border border-white/5 p-6 flex flex-col justify-end">
                  <Smartphone className="w-10 h-10 text-white opacity-40 mb-4" />
                  <p className="text-white font-bold">Wallet</p>
                </div>
                <div className="aspect-[4/5] bg-slate-900 rounded-2xl border border-white/5 p-6 flex flex-col justify-end">
                  <Cpu className="w-10 h-10 text-[#EA9010] mb-4" />
                  <p className="text-white font-bold">NFC Chip</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 5. Features Section & 7. Business Types */}
      <Section id="features">
        <Container>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for local businesses</h2>
            <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
              Everything you need to build customer loyalty in a digital-first world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
            <FeatureCard 
              title="Digital loyalty cards" 
              description="Customers collect stamps directly from their phone. No physical card required."
              icon={<Smartphone className="w-6 h-6" />}
            />
            <FeatureCard 
              title="NFC loyalty cards" 
              description="Customers tap a physical card to collect rewards instantly. Frictionless experience."
              icon={<Cpu className="w-6 h-6" />}
            />
            <FeatureCard 
              title="Apple & Google Wallet" 
              description="Native wallet passes keep your brand top-of-mind and easy to access."
              icon={<Star className="w-6 h-6" />}
            />
            <FeatureCard 
              title="POS integrations" 
              description="Works seamlessly with Garista and other modern POS systems."
              icon={<Zap className="w-6 h-6" />}
            />
            <FeatureCard 
              title="Customer insights" 
              description="Understand visit frequency, retention, and lifetime value of every customer."
              icon={<BarChart3 className="w-6 h-6" />}
            />
            <FeatureCard 
              title="Custom rewards" 
              description="Create flexible reward tiers that match your business and margins."
              icon={<Gift className="w-6 h-6" />}
            />
          </div>

          <div className="bg-[#111827] rounded-[3rem] p-12 md:p-20 border border-white/5 text-center">
            <h3 className="text-3xl font-bold text-white mb-16">Perfect for any shop</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
              {[
                { icon: Coffee, name: "Coffee Shops" },
                { icon: Utensils, name: "Restaurants" },
                { icon: Croissant, name: "Bakeries" },
                { icon: Scissors, name: "Hair Salons" },
                { icon: Dumbbell, name: "Gyms" },
                { icon: IceCream, name: "Ice Cream" },
                { icon: ShoppingBag, name: "Retail" },
                { icon: Plus, name: "And more..." }
              ].map((industry, i) => (
                <div key={i} className="flex flex-col items-center gap-4 group">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#EA9010]/10 group-hover:border-[#EA9010]/30 transition-all">
                    <industry.icon className="w-8 h-8 text-[#9CA3AF] group-hover:text-[#EA9010]" />
                  </div>
                  <span className="text-[#9CA3AF] font-medium transition-colors group-hover:text-white">{industry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* 6. How It Works */}
      <Section id="how-it-works" className="bg-[#111827]">
        <Container>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Start rewarding in minutes</h2>
            <p className="text-xl text-[#9CA3AF]">Simple to set up, effortless to use.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line (Hidden on mobile) */}
            <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {[
              { step: "01", title: "Create program", desc: "Set your stamps and rewards in our easy dashboard." },
              { step: "02", title: "Customers join", desc: "They scan your QR or tap their NFC card to join instantly." },
              { step: "03", title: "Reward loyalty", desc: "Customers redeem rewards and keep coming back for more." }
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-[#0F172A] flex items-center justify-center text-3xl font-bold text-[#EA9010] mb-8 shadow-2xl">
                  {s.step}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{s.title}</h4>
                <p className="text-[#9CA3AF]">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 8. NFC Highlight & 9. Analytics */}
      <NFCExperience />

      {/* 9. Analytics Preview Section */}
      <Section className="pb-0 overflow-hidden bg-[#0F172A] border-t border-white/5">
        <Container>
          <div className="grid lg:grid-cols-2 gap-20 items-end">
            <div className="pb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EA9010]/10 border border-[#EA9010]/20 text-[#EA9010] text-xs font-bold uppercase tracking-wider mb-8">
                Business Analytics
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Data-driven loyalty.</h2>
              <p className="text-xl text-[#9CA3AF] mb-10 leading-relaxed">
                Understand your customers better than ever. Track visit frequency, retention rates, and lifetime value through a beautiful dashboard.
              </p>
              <BrandButton size="lg" variant="outline">View Analytics Demo</BrandButton>
            </div>
            
            <div className="relative">
              {/* Analytics Preview */}
              <div className="bg-[#111827] rounded-t-[3rem] border-x border-t border-white/10 p-4 md:p-8 pb-0 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className="bg-[#0F172A] rounded-t-2xl p-6 border-x border-t border-white/5 min-h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                     <div className="h-4 w-32 bg-white/10 rounded-full" />
                     <div className="h-4 w-4 bg-white/10 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                      <div className="h-2 w-12 bg-white/10 rounded mb-2" />
                      <div className="h-6 w-16 bg-[#EA9010]/40 rounded" />
                    </div>
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                      <div className="h-2 w-12 bg-white/10 rounded mb-2" />
                      <div className="h-6 w-16 bg-white/20 rounded" />
                    </div>
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
                      <div className="h-2 w-12 bg-white/10 rounded mb-2" />
                      <div className="h-6 w-16 bg-white/20 rounded" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-32 mb-8">
                    {[40, 60, 45, 80, 55, 90, 70, 85, 60, 100, 75, 45].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#EA9010]/20 rounded-t-sm" 
                        style={{ height: `${h}%` }}
                      >
                        {h === 100 && <div className="w-full h-full bg-[#EA9010] rounded-t-sm opacity-50" />}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-1/3 bg-white/10 rounded" />
                        <div className="h-2 w-2/3 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-1/4 bg-white/10 rounded" />
                        <div className="h-2 w-1/2 bg-white/5 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 10. Final CTA */}
      <Section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#EA9010]/10 pointer-events-none" />
        <Container className="relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">Start building customer<br />loyalty today</h2>
          <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-12">
            Join 150+ businesses already using Fidly to turn visits into loyal customers. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register">
              <BrandButton size="lg" glow className="px-12 py-8 text-xl">Start Free Trial</BrandButton>
            </Link>
            <Link href="/demo">
              <BrandButton size="lg" variant="outline" className="px-12 py-8 text-xl">Book Demo</BrandButton>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <Container>
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#EA9010] flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="text-xl font-bold text-white">Fidly</span>
              </div>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">
                The modern loyalty platform for shops, restaurants, and local businesses.
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-bold mb-6">Product</h5>
              <ul className="space-y-4 text-sm text-[#9CA3AF]">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-bold mb-6">Company</h5>
              <ul className="space-y-4 text-sm text-[#9CA3AF]">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-bold mb-6">Legal</h5>
              <ul className="space-y-4 text-sm text-[#9CA3AF]">
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 text-sm text-[#9CA3AF]">
            <p>© {new Date().getFullYear()} Fidly. All rights reserved.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
              <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
