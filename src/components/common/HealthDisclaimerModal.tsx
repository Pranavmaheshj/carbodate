import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

interface HealthDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthDisclaimerModal: React.FC<HealthDisclaimerModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md clay-card rounded-clay-card p-6 sm:p-7 relative text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full clay-pebble flex items-center justify-center text-clay-text/60 hover:text-clay-text dark:text-slate-400 dark:hover:text-white transition"
              aria-label="Close disclaimer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-full clay-pebble bg-clay-coral text-clay-text flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black text-clay-text dark:text-white">
                  Health & Clinical Notice
                </h3>
                <span className="text-xs font-sans text-clay-text/60 dark:text-slate-400">
                  Please read carefully
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-sans text-clay-text/80 dark:text-slate-300 leading-relaxed max-h-[55vh] overflow-y-auto pr-1">
              <p>
                <strong className="text-clay-text dark:text-white font-heading font-black">Not Medical Advice:</strong> Carbodate is designed solely for informational, wellness, and self-directed fitness and caloric tracking purposes. It does not provide medical diagnoses, treatment plans, or formal clinical prescriptions.
              </p>
              <p>
                <strong className="text-clay-text dark:text-white font-heading font-black">Safe Caloric Deficits:</strong> Caloric equations (Mifflin-St Jeor, TDEE, METs) provide scientific estimates. Carbodate enforces safety floors (1,200 kcal for women, 1,500 kcal for men) to help prevent severe metabolic slowdown and nutritional deficiencies.
              </p>
              <p>
                <strong className="text-clay-text dark:text-white font-heading font-black">Consult a Professional:</strong> Always consult a qualified physician, registered dietitian, or certified medical provider prior to embarking on any aggressive diet, high-intensity exercise program, or if you have pre-existing cardiovascular, metabolic, or eating disorder conditions.
              </p>
              <p>
                <strong className="text-clay-text dark:text-white font-heading font-black">Emergency:</strong> If you experience chest pain, severe dizziness, shortness of breath, or adverse physical symptoms during any exercise, stop immediately and seek emergency medical assistance.
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3.5 rounded-clay-btn clay-btn-lime text-clay-text font-heading font-black transition active:scale-95 text-sm shadow-sm"
            >
              I Understand & Agree
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
