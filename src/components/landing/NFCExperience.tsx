"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Cpu, CheckCircle2, Zap, Smartphone, Sparkles } from "lucide-react";
import { Container } from "./Container";
import { Section } from "./Section";
import { cn } from "@/lib/utils";

const benefits = [
  {
    title: "Faster checkout experience",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    title: "Works with physical loyalty cards",
    icon: <Cpu className="w-5 h-5" />,
  },
  {
    title: "Instantly updates customer rewards",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

export function NFCExperience() {
  const [stamps, setStamps] = useState(7);
  const [showBadge, setShowBadge] = useState(false);
  const [isTapping, setIsTapping] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    const runCycle = async () => {
      // 3 Taps Sequence
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 1000));
        setIsTapping(true);
        
        // Moment of contact
        await new Promise(r => setTimeout(r, 800));
        setStamps((prev) => (prev >= 10 ? 10 : prev + 1));
        setShowBadge(true);
        
        await new Promise(r => setTimeout(r, 1500)); // wait for badge
        setShowBadge(false);
        setIsTapping(false);
        await new Promise(r => setTimeout(r, 1000)); // pause between taps
      }

      // Redemption Sequence
      await new Promise(r => setTimeout(r, 500));
      setIsRedeeming(true);
      
      await new Promise(r => setTimeout(r, 4000)); // Show reward for 4s
      
      // Reset
      setIsRedeeming(false);
      setStamps(7);
      
      // Infinite loop trigger
      setTimeout(runCycle, 2000);
    };

    runCycle();
  }, []);

  return (
    <Section id="nfc-experience" className="bg-[#0F172A]">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-bold text-primary uppercase tracking-wider">
                NFC Loyalty Experience
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Tap. Collect. <span className="text-primary">Reward.</span>
            </h2>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
              Customers simply tap their loyalty card to collect stamps instantly — no app switching, no paper cards, no friction.
            </p>
            
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-primary">
                    {benefit.icon}
                  </div>
                  <span className="text-lg text-slate-200 font-medium">
                    {benefit.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Animated Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            {/* Visual Container Card */}
            <div className="relative aspect-square max-w-[540px] mx-auto bg-gradient-to-b from-[#111827] to-transparent rounded-[3rem] border border-white/5 p-8 flex items-center justify-center overflow-hidden shadow-2xl">
              {/* Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
              
              {/* Phone Mockup */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-[280px] h-[560px] bg-[#020617] rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden z-10"
              >
                {/* Phone Speaker/Camera notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                
                {/* Loyalty UI Screen */}
                <div className="p-6 pt-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" fill="white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Brew & Bean</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Loyalty Pass</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 mb-6">
                    <p className="text-xs text-slate-400 mb-2">Stamp Card Progress</p>
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-2xl font-bold text-white tracking-tight">{stamps} / 10</span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {stamps >= 10 ? "Ready to redeem!" : `${Math.round((stamps/10)*100)}% Complete`}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ 
                          width: `${(stamps / 10) * 100}%`,
                          backgroundColor: stamps >= 10 ? "#EA9010" : "#EA9010"
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Stamp Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={i === stamps - 1 && showBadge ? { 
                          scale: [1, 1.3, 1],
                          backgroundColor: ["rgba(234,144,16,0.1)", "rgba(234,144,16,0.3)", "rgba(234,144,16,0.2)"]
                        } : {}}
                        className={cn(
                          "aspect-square rounded-full border border-dashed flex items-center justify-center transition-all duration-500",
                          i < stamps 
                            ? "bg-primary/20 border-primary shadow-[0_0_10px_rgba(234,144,16,0.2)]" 
                            : "bg-white/5 border-white/10"
                        )}
                      >
                        {i < stamps && (
                          <motion.div
                            initial={i === stamps - 1 ? { scale: 0, opacity: 0 } : {}}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            <Zap className="w-4 h-4 text-primary" fill="currentColor" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Success Badge on Screen */}
                  <AnimatePresence>
                    {showBadge && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] bg-primary border border-primary/20 rounded-2xl p-4 shadow-2xl flex items-center gap-3 z-30"
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">Stamp Added!</p>
                          <p className="text-white/80 text-[10px]">+1 point rewards</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Redemption Animation Overlay */}
                <AnimatePresence>
                  {isRedeeming && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#0F172A] z-40 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.8, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="space-y-4"
                      >
                         <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto border border-primary/30">
                            <Sparkles className="w-8 h-8 text-primary" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Reward Unlocked!</h3>
                         <div className="py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-primary text-xs font-mono">
                           #COFFEE-RED-2024
                         </div>
                         <p className="text-[10px] text-slate-500">Show this to your server</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* NFC Card */}
              <motion.div
                animate={isTapping ? {
                  y: [120, -100, 120],
                  scale: [1, 1.05, 1],
                  rotate: [15, 0, 15]
                } : {
                  y: [120, 128, 120],
                  rotate: [15, 13, 15]
                }}
                transition={isTapping ? {
                  duration: 1.5,
                  times: [0, 0.5, 1],
                  ease: "easeInOut"
                } : {
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[300px] h-[190px] bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] z-20 p-6 flex flex-col justify-between backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" fill="white" />
                    </div>
                    <span className="font-bold text-white text-sm">Fidly Card</span>
                  </div>
                  <Cpu className="w-6 h-6 text-slate-500" />
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="w-10 h-6 bg-slate-700/50 rounded-md" />
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Member Since 2024</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                </div>
                
                {/* NFC Wave Ripple (shown during tap) */}
                <AnimatePresence>
                  {isTapping && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                      transition={{ duration: 0.8, times: [0, 1], repeat: 1 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border border-primary/40 pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Success Burst Background Particles (simplified) */}
              <AnimatePresence>
                {showBadge && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-0 pointer-events-none"
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0 }}
                        animate={{ 
                          scale: [0, 1, 0],
                          x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 150 + 50),
                          y: (i < 3 ? 1 : -1) * (Math.random() * 150 + 50),
                        }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary/40 blur-sm"
                        transition={{ duration: 0.8 }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
