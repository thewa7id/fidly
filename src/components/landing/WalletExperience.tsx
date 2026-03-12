"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { QrCode, Smartphone, Zap, CheckCircle2, Wallet, Plus, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Container } from "./Container";
import { Section } from "./Section";
import { cn } from "@/lib/utils";

const walletBullets = [
  {
    title: "No app required",
    description: "Customers don't need to download anything new.",
    icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
  },
  {
    title: "Add once, use anytime",
    description: "Saved directly to their device's native wallet.",
    icon: <Wallet className="w-5 h-5 text-blue-500" />,
  },
  {
    title: "Faster checkout",
    description: "Scan the pass in seconds during purchase.",
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
  },
];

export function WalletExperience() {
  const [walletType, setWalletType] = useState<"apple" | "google">("apple");
  const [step, setStep] = useState(0); // 0: Choose, 1: Adding, 2: Success
  const [phoneRotation, setPhoneRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const runCycle = async () => {
      setStep(0);
      await new Promise(r => setTimeout(r, 2500));
      
      setStep(1);
      await new Promise(r => setTimeout(r, 1500));

      setStep(2);
      await new Promise(r => setTimeout(r, 4500));

      setStep(0);
      setWalletType(prev => (prev === "apple" ? "google" : "apple"));
      
      setTimeout(runCycle, 1000);
    };

    runCycle();
  }, []);

  // Subtle mouse-based tilt (simulated via idle animation or just random subtle shift)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhoneRotation({ 
        x: (Math.random() - 0.5) * 4, 
        y: (Math.random() - 0.5) * 4 
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Section className="bg-[#0F172A] border-t border-white/5 overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Wallet className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Wallet Experience</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
              One tap and it's <span className="text-blue-500 text-glow-blue italic">Saved.</span>
            </h2>
            
            <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-lg">
              No apps to download. No accounts to create. Your customers simply add their loyalty card to their native wallet in seconds.
            </p>
            
            <div className="space-y-8">
              {walletBullets.map((bullet, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="mt-1 w-12 h-12 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center shrink-0 shadow-lg">
                    {bullet.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{bullet.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{bullet.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Animated Product Story */}
          <div className="relative aspect-square max-w-[540px] mx-auto bg-gradient-to-tr from-[#111827] to-slate-900 rounded-[4rem] border border-white/10 p-12 flex items-center justify-center overflow-visible shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            {/* 1. Phone Mockup with 3D Tilt */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotateX: phoneRotation.x,
                rotateY: phoneRotation.y
              }}
              transition={{ 
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                rotateX: { duration: 2, ease: "easeInOut" },
                rotateY: { duration: 2, ease: "easeInOut" }
              }}
              style={{ perspective: 1000 }}
              className="relative w-[300px] h-[600px] bg-[#020617] rounded-[3.5rem] border-[12px] border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] z-20 overflow-hidden"
            >
              {/* Screen Content */}
              <div className="h-full w-full bg-[#0F172A] p-7 pt-14 flex flex-col relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-[1.5rem] z-30" />
                
                <div className="flex items-center justify-between mb-10 opacity-80">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-primary" fill="currentColor" />
                   </div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fidly Pass</div>
                </div>

                <AnimatePresence mode="wait">
                  {/* Phase 0: Choice Screen */}
                  {step === 0 && (
                    <motion.div 
                      key="choice"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="flex-1 flex flex-col"
                    >
                      <h4 className="text-center font-bold text-white text-2xl mb-3 tracking-tight">Claim Your Card</h4>
                      <p className="text-center text-slate-400 text-[12px] mb-12 px-6 leading-relaxed">Instantly add your card to your mobile wallet.</p>
                      
                      <div className="space-y-4">
                        <motion.div 
                          animate={walletType === "apple" ? { scale: 1.02, boxShadow: "0 10px 30px rgba(255,255,255,0.1)" } : { opacity: 0.4 }}
                          className="w-full h-16 rounded-2xl bg-white text-black flex items-center justify-center gap-4 shadow-xl cursor-default"
                        >
                           <Wallet className="w-6 h-6 text-black" />
                           <span className="font-extrabold text-sm">Add to Apple Wallet</span>
                        </motion.div>
                        <motion.div 
                           animate={walletType === "google" ? { scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" } : { opacity: 0.4 }}
                           className="w-full h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center gap-4"
                        >
                           <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                           </div>
                           <span className="text-white text-sm font-extrabold">Add to Google Wallet</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Phase 1: Adding Spinner */}
                  {step === 1 && (
                    <motion.div 
                      key="adding"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center"
                    >
                       <div className="relative w-24 h-24 mb-6">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-[6px] border-primary/20 border-t-primary"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Wallet className="w-8 h-8 text-primary/40" />
                          </div>
                       </div>
                       <p className="text-primary text-xs font-bold animate-pulse">Syncing with wallet...</p>
                    </motion.div>
                  )}

                  {/* Phase 2: Success Visual */}
                  {step === 2 && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-1 flex flex-col"
                    >
                       <div className={cn(
                         "rounded-[2rem] p-6 border border-white/10 mb-10 shadow-2xl h-[200px] flex flex-col justify-between overflow-hidden relative group",
                         walletType === "apple" ? "bg-black" : "bg-gradient-to-br from-slate-900 to-slate-950"
                       )}>
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex justify-between items-start relative z-10">
                             <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                  <Zap className="w-5 h-5 text-primary" fill="currentColor" />
                                </div>
                                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">LOYALTY</span>
                             </div>
                             <Wallet className="w-5 h-5 text-white/10" />
                          </div>
                          <div className="relative z-10">
                            <div className="h-2 w-32 bg-white/20 rounded-full mb-4" />
                            <div className="flex gap-2">
                               {[...Array(5)].map((_, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 * i, type: "spring" }}
                                    className="w-6 h-6 rounded-full bg-primary shadow-[0_0_15px_rgba(234,144,16,0.5)]" 
                                  />
                               ))}
                            </div>
                          </div>
                       </div>
                       
                       <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="flex flex-col items-center gap-5 text-center mt-4"
                       >
                          <div className="relative">
                            <motion.div 
                              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-green-500 rounded-full blur-xl"
                            />
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center relative z-10">
                               <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                          </div>
                          <div>
                            <h5 className="text-white font-bold text-xl mb-1 tracking-tight">Added Successfully</h5>
                            <p className="text-slate-500 text-sm">Ready in your pocket</p>
                          </div>
                       </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Premium Card Slide Effect */}
            <AnimatePresence>
              {step === 1 && (
                <motion.div
                  initial={{ 
                    y: 400, 
                    x: walletType === "apple" ? -120 : 120,
                    opacity: 0, 
                    scale: 0.7, 
                    rotateY: walletType === "apple" ? -30 : 30,
                    rotateX: 20
                  }}
                  animate={{ 
                    y: -120, 
                    x: 0,
                    opacity: 1, 
                    scale: 1, 
                    rotateY: 0,
                    rotateX: 0
                  }}
                  exit={{ 
                    scale: 0.9, 
                    opacity: 0,
                    y: -220,
                    filter: "blur(10px)"
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 80, 
                    damping: 15,
                    opacity: { duration: 0.4 }
                  }}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 top-[50%] w-[340px] aspect-[1.58/1] rounded-[2rem] border border-white/20 shadow-[0_60px_100px_rgba(0,0,0,0.9)] z-40 p-8 flex flex-col justify-between backdrop-blur-3xl",
                    walletType === "apple" ? "bg-black" : "bg-slate-900"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(234,144,16,0.4)]">
                        <Zap className="w-7 h-7 text-white" fill="white" />
                      </div>
                      <div>
                        <span className="block text-white font-black text-lg tracking-tight">Fidly Loyalty</span>
                        <span className="block text-[10px] text-slate-500 uppercase font-black tracking-widest">Gold Member</span>
                      </div>
                    </div>
                    {walletType === "apple" ? (
                      <Wallet className="w-7 h-7 text-slate-600" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 shadow-lg">
                        <div className="w-full h-full rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="space-y-2">
                       <div className="h-3 w-32 bg-white/10 rounded-full" />
                       <div className="h-2 w-20 bg-white/5 rounded-full" />
                    </div>
                    <div className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl font-black text-primary text-sm shadow-inner">
                       9/10
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Floating Particles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -30, 0],
                  x: [0, (i % 2 ? 20 : -20), 0],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ 
                  duration: 5 + i, 
                  repeat: Infinity, 
                  delay: i * 0.5 
                }}
                className={cn(
                  "absolute w-2 h-2 rounded-full",
                  i % 2 ? "bg-primary/40" : "bg-blue-500/40"
                )}
                style={{ 
                  left: `${20 + i * 20}%`, 
                  top: `${30 + i * 15}%`,
                  filter: "blur(4px)"
                }}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
