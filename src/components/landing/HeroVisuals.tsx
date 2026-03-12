"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Star, Smartphone, QrCode, Cpu, Zap, CheckCircle2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroVisuals() {
  const [stamps, setStamps] = useState(7);
  const [isTapping, setIsTapping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    let tapCount = 0;
    
    const runCycle = async () => {
      // 3 Taps Sequence
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 1000));
        setIsTapping(true);
        
        // Moment of contact
        await new Promise(r => setTimeout(r, 800));
        setShowFeedback(true);
        setStamps(prev => (prev >= 10 ? 10 : prev + 1));
        
        await new Promise(r => setTimeout(r, 700)); // wait for pulse
        setShowFeedback(false);
        setIsTapping(false);
        await new Promise(r => setTimeout(r, 1500)); // pause between taps
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
    <div className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[#EA9010]/10 blur-[120px] rounded-full" />
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
      
      <div className="relative w-full h-full flex items-center justify-center scale-90 md:scale-100">
        
        {/* 1. Phone Mockup */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[260px] h-[520px] bg-[#020617] rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden z-20"
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-xl z-30" />
          
          {/* Screen Content */}
          <div className="p-6 pt-12 flex flex-col h-full bg-[#0F172A]">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Star className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-white text-sm">Fidly Rewards</span>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 mb-6">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Loyalty Progress</h4>
              <div className="flex justify-between items-end mb-4">
                <span className="text-3xl font-bold text-white">{stamps}<span className="text-slate-600 text-lg">/10</span></span>
                <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                  <Zap className="w-3 h-3" />
                  +1 Stamp
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <motion.div 
                  animate={{ 
                    width: `${(stamps/10)*100}%`,
                    backgroundColor: stamps >= 10 ? "#EA9010" : "#EA9010"
                  }}
                  className="h-full bg-primary"
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[9px] text-slate-500 text-center">
                {stamps >= 10 ? "Reward ready to redeem!" : "Reward unlocked at 10 stamps"}
              </p>
            </div>

            {/* Stamp Grid */}
            <div className="grid grid-cols-5 gap-2 mb-8">
              {[...Array(10)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={i === stamps - 1 && showFeedback ? { 
                    scale: [1, 1.3, 1],
                    boxShadow: ["0 0 0px var(--primary)", "0 0 15px var(--primary)", "0 0 0px var(--primary)"]
                  } : i === 9 && stamps >= 10 ? {
                    scale: [1, 1.1, 1],
                    transition: { repeat: Infinity, duration: 2 }
                  } : {}}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center border transition-colors duration-500",
                    i < stamps 
                      ? "bg-primary/20 border-primary" 
                      : "bg-white/5 border-white/10"
                  )}
                >
                  {i < stamps && <Star className="w-3 h-3 text-primary" fill="currentColor" />}
                </motion.div>
              ))}
            </div>

            {/* Bottom UI Elements */}
            <div className="mt-auto space-y-3 pb-4">
               {stamps >= 10 ? (
                 <motion.button 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="w-full h-12 rounded-xl bg-primary text-white font-bold text-xs shadow-[0_0_20px_rgba(234,144,16,0.4)]"
                 >
                   REDEEM FREE COFFEE
                 </motion.button>
               ) : (
                 <>
                  <div className="w-full h-10 rounded-xl bg-white/5 border border-white/5 flex items-center px-3 gap-3">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400">Added to Apple Wallet</span>
                  </div>
                  <div className="w-full h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center px-3 gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase">NFC Ready to Tap</span>
                  </div>
                 </>
               )}
            </div>
          </div>

          {/* Screen Feedback Overlay */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/10 flex items-center justify-center z-40 pointer-events-none"
              >
                <div className="bg-[#111827] border border-primary/30 rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-2">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </motion.div>
                  <p className="text-white font-bold text-sm">Stamp Added!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New: Reward Redemption Animation Overlay */}
          <AnimatePresence>
            {isRedeeming && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F172A] z-50 flex items-center justify-center p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                    />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[#F2A93A] flex items-center justify-center mx-auto shadow-2xl">
                       <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Reward Unlocked!</h3>
                    <p className="text-slate-400 text-xs">Show this screen to the cashier to claim your free reward.</p>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="py-3 px-6 rounded-full bg-white/5 border border-white/10 text-primary font-bold text-sm"
                  >
                    #FID-99283
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 2. Floating Digital Card */}
        <motion.div
// ... rest of the component
          animate={{ 
            y: [0, 10, 0],
            rotate: [0, -1.5, 0]
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-4 top-[15%] w-[200px] aspect-[1.5/1] bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-2xl border border-white/10 shadow-2xl z-30 p-4 backdrop-blur-xl"
        >
          <div className="flex justify-between items-start mb-4">
             <div className="w-6 h-6 rounded-lg bg-[#EA9010] flex items-center justify-center">
                <Star className="w-4 h-4 text-white" fill="white" />
             </div>
             <QrCode className="w-6 h-6 text-slate-600" />
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-16 bg-white/20 rounded" />
            <div className="h-1.5 w-24 bg-white/10 rounded" />
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border-2 border-[#111827]" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-primary">PLATINUM</span>
          </div>
        </motion.div>

        {/* 3. NFC Loyalty Card */}
        <motion.div
          animate={isTapping ? {
            y: [120, -110, 120],
            scale: [1, 1.05, 1],
            rotate: [5, 0, 5]
          } : {
            y: [120, 126, 120],
            rotate: [5, 7, 5]
          }}
          transition={isTapping ? {
            duration: 1.6,
            times: [0, 0.5, 1],
            ease: "easeInOut"
          } : {
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -left-12 bottom-[10%] w-[220px] h-[140px] bg-gradient-to-br from-primary to-[#F2A93A] rounded-xl shadow-2xl z-40 p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
             <span className="text-white font-bold text-lg italic tracking-tighter">Fidly.</span>
             <Cpu className="w-6 h-6 text-white/50" />
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
               <div className="w-8 h-4 bg-white/20 rounded" />
               <p className="text-[8px] text-white/60 font-medium">Business Advantage Card</p>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
               <Smartphone className="w-4 h-4 text-white/80" />
            </div>
          </div>

          {/* Contact Ripple */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                transition={{ duration: 0.6 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border border-white/40 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Floating Accent Orbs */}
        <motion.div
          animate={{ x: [-10, 10, -10], y: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"
        />
        <motion.div
          animate={{ x: [10, -10, 10], y: [10, -10, 10] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full"
        />
      </div>
    </div>
  );
}
